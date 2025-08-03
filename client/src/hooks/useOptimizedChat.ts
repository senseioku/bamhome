import { useState, useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Optimized chat hook with performance enhancements
export function useOptimizedChat() {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const queryClient = useQueryClient();

  // Get conversations with pagination
  const { 
    data: conversationsData, 
    isLoading: loadingConversations,
    refetch: refetchConversations 
  } = useQuery({
    queryKey: ['/api/chat/conversations', { page: 1, limit: 50 }],
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const conversations = conversationsData?.data || conversationsData || [];

  // Get current conversation with messages
  const { 
    data: conversationData, 
    isLoading: loadingMessages 
  } = useQuery({
    queryKey: ['/api/chat/conversations', currentConversationId],
    enabled: !!currentConversationId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const messages = conversationData?.messages || [];

  // Create new conversation
  const createConversationMutation = useMutation({
    mutationFn: async (data: { title: string; category?: string }) => {
      return apiRequest('/api/chat/conversations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (newConversation) => {
      setCurrentConversationId(newConversation.id);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
    },
  });

  // Send message with optimistic updates
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      setIsStreaming(true);
      try {
        return await apiRequest(`/api/chat/conversations/${conversationId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ content }),
        });
      } finally {
        setIsStreaming(false);
      }
    },
    onMutate: async ({ conversationId, content }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: ['/api/chat/conversations', conversationId] 
      });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(['/api/chat/conversations', conversationId]);

      // Optimistically update
      queryClient.setQueryData(['/api/chat/conversations', conversationId], (old: any) => {
        if (!old) return old;
        
        const optimisticMessage = {
          id: `temp-${Date.now()}`,
          role: 'user',
          content,
          createdAt: new Date().toISOString(),
          conversationId,
        };

        return {
          ...old,
          messages: [...(old.messages || []), optimisticMessage],
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          ['/api/chat/conversations', variables.conversationId],
          context.previousData
        );
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ 
        queryKey: ['/api/chat/conversations', currentConversationId] 
      });
    },
  });

  // Memoized handlers
  const startNewConversation = useCallback(async (title: string = 'New Conversation') => {
    return createConversationMutation.mutateAsync({ 
      title, 
      category: 'general' 
    });
  }, [createConversationMutation]);

  const sendMessage = useCallback(async (content: string) => {
    if (!currentConversationId) {
      const newConversation = await startNewConversation('Chat');
      return sendMessageMutation.mutateAsync({
        conversationId: newConversation.id,
        content,
      });
    }
    
    return sendMessageMutation.mutateAsync({
      conversationId: currentConversationId,
      content,
    });
  }, [currentConversationId, startNewConversation, sendMessageMutation]);

  const selectConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
  }, []);

  // Memoized values
  const isLoading = useMemo(() => 
    loadingConversations || loadingMessages || 
    createConversationMutation.isPending || 
    sendMessageMutation.isPending,
    [loadingConversations, loadingMessages, createConversationMutation.isPending, sendMessageMutation.isPending]
  );

  const currentConversation = useMemo(() => 
    conversations.find((c: any) => c.id === currentConversationId),
    [conversations, currentConversationId]
  );

  return {
    // Data
    conversations,
    currentConversation,
    messages,
    currentConversationId,
    
    // Loading states
    isLoading,
    isStreaming,
    loadingConversations,
    loadingMessages,
    
    // Actions
    startNewConversation,
    sendMessage,
    selectConversation,
    refetchConversations,
    
    // Mutation states
    isSendingMessage: sendMessageMutation.isPending,
    isCreatingConversation: createConversationMutation.isPending,
  };
}