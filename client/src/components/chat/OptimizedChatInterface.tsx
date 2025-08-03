import { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Plus, MessageSquare, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOptimizedChat } from '@/hooks/useOptimizedChat';
import { OptimizedLoading, MessageSkeleton, ConversationSkeleton } from '@/components/ui/optimized-loading';
import { performanceMonitor } from '@/lib/performance';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

export function OptimizedChatInterface() {
  const [message, setMessage] = useState('');
  const [showConversations, setShowConversations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    conversations,
    currentConversation,
    messages,
    currentConversationId,
    isLoading,
    isStreaming,
    loadingConversations,
    loadingMessages,
    startNewConversation,
    sendMessage,
    selectConversation,
    isSendingMessage,
  } = useOptimizedChat();

  // Performance monitoring
  useEffect(() => {
    const endTiming = performanceMonitor.startTiming('chat_render');
    return endTiming;
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when conversation changes
  useEffect(() => {
    if (currentConversationId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentConversationId]);

  // Memoized message components for performance
  const messageComponents = useMemo(() => {
    return messages.map((msg: Message) => (
      <MessageBubble key={msg.id} message={msg} />
    ));
  }, [messages]);

  // Memoized conversation list
  const conversationComponents = useMemo(() => {
    return conversations.map((conv: Conversation) => (
      <ConversationItem
        key={conv.id}
        conversation={conv}
        isActive={conv.id === currentConversationId}
        onClick={() => selectConversation(conv.id)}
      />
    ));
  }, [conversations, currentConversationId, selectConversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSendingMessage) return;

    const messageText = message.trim();
    setMessage('');
    
    try {
      await sendMessage(messageText);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessage(messageText); // Restore message on error
    }
  };

  const handleNewConversation = async () => {
    try {
      await startNewConversation('New Chat');
      setShowConversations(false);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      {showConversations && (
        <div className="w-80 border-r border-border bg-muted/30">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Conversations</h2>
              <Button
                onClick={handleNewConversation}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                New
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            {loadingConversations ? (
              <ConversationSkeleton />
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No conversations yet. Start a new chat!
              </div>
            ) : (
              <div className="p-2">
                {conversationComponents}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowConversations(!showConversations)}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Conversations
              </Button>
              
              {currentConversation && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">{currentConversation.title}</span>
                  <Badge variant="secondary" className="text-xs">
                    {currentConversation.messageCount} messages
                  </Badge>
                </div>
              )}
            </div>

            {isStreaming && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <OptimizedLoading size="sm" variant="pulse" />
                <span>AI is thinking...</span>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {!currentConversationId ? (
            <WelcomeScreen onStartChat={handleNewConversation} />
          ) : loadingMessages ? (
            <MessageSkeleton />
          ) : messages.length === 0 ? (
            <EmptyChat onStartChat={handleNewConversation} />
          ) : (
            <div className="space-y-4">
              {messageComponents}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border bg-background/95 backdrop-blur">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isSendingMessage}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!message.trim() || isSendingMessage}
              className="gap-2"
            >
              {isSendingMessage ? (
                <OptimizedLoading size="sm" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Message bubble component
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-lg p-3 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}
      >
        <div className="text-sm font-medium mb-1 opacity-70">
          {isUser ? 'You' : 'BAM AI'}
        </div>
        <div className="whitespace-pre-wrap">{message.content}</div>
        <div className="text-xs opacity-50 mt-2">
          {new Date(message.createdAt).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

// Conversation item component
function ConversationItem({ 
  conversation, 
  isActive, 
  onClick 
}: { 
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      className={`cursor-pointer transition-colors hover:bg-accent mb-2 ${
        isActive ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{conversation.title}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {conversation.messageCount} messages
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(conversation.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Welcome screen
function WelcomeScreen({ onStartChat }: { onStartChat: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="max-w-md">
        <TrendingUp className="h-16 w-16 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold mb-2">Welcome to BAM AIChat</h2>
        <p className="text-muted-foreground mb-6">
          Your AI-powered crypto and business companion. Get insights, education, and guidance for wealth multiplication.
        </p>
        <Button onClick={onStartChat} className="gap-2">
          <Plus className="h-4 w-4" />
          Start New Conversation
        </Button>
      </div>
    </div>
  );
}

// Empty chat state
function EmptyChat({ onStartChat }: { onStartChat: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <MessageSquare className="h-12 w-12 mb-4 text-muted-foreground" />
      <h3 className="text-lg font-medium mb-2">Start the conversation</h3>
      <p className="text-muted-foreground mb-4">
        Ask anything about crypto, business, or general topics.
      </p>
    </div>
  );
}