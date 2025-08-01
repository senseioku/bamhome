import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  MessageCircle, 
  Send, 
  TrendingUp, 
  BookOpen, 
  Search,
  Sparkles,
  Plus,
  ChevronLeft,
  MoreVertical,
  Brain,
  Zap,
  Globe
} from 'lucide-react';
import Navigation from '@/components/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: any;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  category: string;
  messageCount: number;
  lastMessageAt: string;
}

export default function AiChat() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ['/api/chat/conversations'],
  });

  // Fetch current conversation details
  const { data: conversationData, isLoading: loadingConversation } = useQuery({
    queryKey: ['/api/chat/conversations', selectedConversation],
    enabled: !!selectedConversation,
  });

  // Fetch crypto updates
  const { data: cryptoUpdates = [] } = useQuery({
    queryKey: ['/api/crypto/updates'],
  });

  // Fetch highlighted updates
  const { data: highlights = [] } = useQuery({
    queryKey: ['/api/crypto/highlights'],
  });

  // Create new conversation
  const createConversationMutation = useMutation({
    mutationFn: async ({ title, category }: { title: string; category: string }) => {
      return apiRequest('/api/chat/conversations', {
        method: 'POST',
        body: { title, category }
      });
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      setSelectedConversation(conversation.id);
    }
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      return apiRequest(`/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: { content }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      setMessageInput('');
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationData?.messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    let conversationId = selectedConversation;

    // Create new conversation if none selected
    if (!conversationId) {
      const newConversation = await createConversationMutation.mutateAsync({
        title: messageInput.slice(0, 50) + '...',
        category: selectedCategory
      });
      conversationId = newConversation.id;
    }

    if (conversationId) {
      sendMessageMutation.mutate({
        conversationId,
        content: messageInput
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'crypto': return <TrendingUp className="w-4 h-4" />;
      case 'research': return <Search className="w-4 h-4" />;
      case 'learn': return <BookOpen className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'crypto': return 'bg-green-500/20 text-green-400';
      case 'research': return 'bg-blue-500/20 text-blue-400';
      case 'learn': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navigation />
      
      <div className="pt-16 h-screen flex">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-80 bg-black/40 backdrop-blur-xl border-r border-gray-700">
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      BAM AIGPT
                    </h1>
                    <p className="text-xs text-gray-400">AI Assistant</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSidebar(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2 mb-6">
                <Button
                  onClick={() => {
                    setSelectedConversation(null);
                    setSelectedCategory('general');
                  }}
                  className="w-full justify-start gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  New Chat
                </Button>
              </div>

              {/* Category Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Categories</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'general', label: 'General', icon: MessageCircle },
                    { id: 'crypto', label: 'Market', icon: TrendingUp },
                    { id: 'research', label: 'Research', icon: Search },
                    { id: 'learn', label: 'Learn', icon: BookOpen }
                  ].map(category => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className={`justify-start gap-2 ${
                        selectedCategory === category.id 
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <category.icon className="w-3 h-3" />
                      {category.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Recent Conversations */}
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-3">Recent Chats</h3>
                <ScrollArea className="h-64">
                  <div className="space-y-1">
                    {conversations.map((conv: Conversation) => (
                      <Button
                        key={conv.id}
                        variant="ghost"
                        onClick={() => setSelectedConversation(conv.id)}
                        className={`w-full justify-start p-3 h-auto ${
                          selectedConversation === conv.id 
                            ? 'bg-gray-700/50 text-white' 
                            : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                        }`}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <div className={`mt-1 p-1 rounded ${getCategoryColor(conv.category)}`}>
                            {getCategoryIcon(conv.category)}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <div className="font-medium truncate text-sm">
                              {conv.title}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {conv.messageCount} messages
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-black/20 backdrop-blur-xl border-b border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {!showSidebar && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSidebar(true)}
                    className="text-gray-400 hover:text-white"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                )}
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {conversationData?.conversation?.title || 'BAM AIGPT'}
                  </h2>
                  <p className="text-sm text-gray-400">
                    Your 24/7 AI Partner for Business, Crypto, and Growth
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-400 border-green-500/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                  Online
                </Badge>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            {!selectedConversation ? (
              // Welcome Screen
              <div className="h-full flex items-center justify-center">
                <div className="max-w-2xl mx-auto text-center space-y-8">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      BAM AIGPT
                    </h2>
                    <p className="text-lg text-gray-300">
                      Your 24/7 AI Partner for Business, Crypto, and Growth
                    </p>
                    <p className="text-gray-400">
                      Uses multiple sources and tools to answer questions with citations.
                    </p>
                  </div>

                  <div className="grid gap-4">
                    <Card className="bg-black/20 border-cyan-500/30 hover:border-cyan-400/50 transition-colors cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white mb-2">STAY UPDATED</h3>
                            <p className="text-gray-400 text-sm">
                              Latest crypto news, airdrops, and Web3 updates. Stay ahead.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-black/20 border-blue-500/30 hover:border-blue-400/50 transition-colors cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <Search className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white mb-2">RESEARCH</h3>
                            <p className="text-gray-400 text-sm">
                              Deep dives into crypto projects, tokens, and blockchain tech.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-black/20 border-purple-500/30 hover:border-purple-400/50 transition-colors cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white mb-2">LEARN A TOPIC</h3>
                            <p className="text-gray-400 text-sm">
                              Quick guides to understand crypto, Web3, and blockchain basics.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            ) : (
              // Chat Messages
              <div className="space-y-4 pb-4">
                {loadingConversation ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
                  </div>
                ) : (
                  conversationData?.messages?.map((message: Message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <Brain className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                            : 'bg-black/40 border border-gray-700 text-gray-100'
                        }`}
                      >
                        <div className="prose prose-invert prose-sm max-w-none">
                          {message.content.split('\n').map((line, i) => (
                            <p key={i} className="mb-2 last:mb-0">{line}</p>
                          ))}
                        </div>
                        {message.metadata?.sources && (
                          <div className="mt-3 pt-3 border-t border-gray-600">
                            <p className="text-xs text-gray-400 mb-2">Sources:</p>
                            <div className="flex flex-wrap gap-1">
                              {message.metadata.sources.map((source: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {source}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-2">
                          {formatTime(message.createdAt)}
                        </div>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <div className="w-4 h-4 bg-gray-300 rounded-full" />
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 bg-black/20 backdrop-blur-xl border-t border-gray-700">
            <div className="flex gap-3">
              <div className="flex-1">
                <Textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Write a message here..."
                  className="min-h-[60px] resize-none bg-black/40 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500"
                  disabled={sendMessageMutation.isPending}
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || sendMessageMutation.isPending}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 px-6"
              >
                {sendMessageMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}