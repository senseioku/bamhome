import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { walletSecurity, type WalletVerification } from '@/lib/walletSecurity';
import Navigation from '@/components/navigation';
import { 
  MessageCircle, 
  Send, 
  TrendingUp, 
  BookOpen, 
  Search,
  Sparkles,
  Plus,
  ChevronLeft,
  Brain,
  Zap,
  Globe,
  Wallet,
  Shield,
  AlertTriangle,
  Clock,
  Star
} from 'lucide-react';

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
  const [showSidebar, setShowSidebar] = useState(window.innerWidth >= 768);
  const [isVerified, setIsVerified] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Check window size for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setShowSidebar(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation]);

  // Check if wallet verification needed
  useEffect(() => {
    const checkVerification = async () => {
      if (!(window as any).ethereum) {
        setShowVerificationDialog(true);
        return;
      }

      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          const address = accounts[0];
          const isValid = walletSecurity.isSessionValid(address);
          if (isValid) {
            setIsVerified(true);
            setWalletAddress(address);
          } else {
            setShowVerificationDialog(true);
          }
        } else {
          setShowVerificationDialog(true);
        }
      } catch (error) {
        setShowVerificationDialog(true);
      }
    };

    checkVerification();
  }, []);

  const handleWalletVerification = async () => {
    setVerificationLoading(true);
    setVerificationError(null);

    try {
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        setVerificationError('Please connect your wallet to continue.');
        return;
      }

      const address = accounts[0];
      const verification: WalletVerification = await walletSecurity.verifyWalletOwnership(address);

      if (verification.isValid) {
        setIsVerified(true);
        setWalletAddress(address);
        setShowVerificationDialog(false);
      } else {
        setVerificationError(verification.error || 'Verification failed');
      }
    } catch (error: any) {
      setVerificationError('Failed to verify wallet. Please try again.');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Fetch conversations (only if verified)
  const { data: conversations = [] } = useQuery({
    queryKey: ['/api/chat/conversations'],
    enabled: isVerified,
  }) as { data: Conversation[] };

  // Fetch current conversation details
  const { data: conversationData, isLoading: loadingConversation } = useQuery({
    queryKey: ['/api/chat/conversations', selectedConversation],
    enabled: !!selectedConversation && isVerified,
  }) as { data: { conversation: Conversation; messages: Message[] } | undefined; isLoading: boolean };

  // Fetch crypto updates
  const { data: cryptoUpdates = [] } = useQuery({
    queryKey: ['/api/crypto/updates'],
    enabled: isVerified,
  });

  // Fetch highlighted content
  const { data: highlights = [] } = useQuery({
    queryKey: ['/api/crypto/highlights'],
    enabled: isVerified,
  }) as { data: any[] };

  // Create new conversation
  const createConversationMutation = useMutation({
    mutationFn: async ({ title, category }: { title: string; category: string }) => {
      return apiRequest('/api/chat/conversations', 'POST', { title, category });
    },
    onSuccess: (conversation: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      setSelectedConversation(conversation.id);
    }
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      return apiRequest(`/api/chat/conversations/${conversationId}/messages`, 'POST', { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      setMessageInput('');
    }
  });

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: selectedConversation,
        content: messageInput.trim()
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleNewConversation = async () => {
    const title = `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Chat ${Date.now()}`;
    try {
      await createConversationMutation.mutateAsync({
        title,
        category: selectedCategory
      });
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const categories = [
    { id: 'crypto', name: 'Crypto Analysis', icon: TrendingUp, color: 'bg-green-500' },
    { id: 'research', name: 'Research', icon: Search, color: 'bg-blue-500' },
    { id: 'learn', name: 'Learn DeFi', icon: BookOpen, color: 'bg-purple-500' },
    { id: 'general', name: 'General Chat', icon: MessageCircle, color: 'bg-gray-500' }
  ];

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
            <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-white">
                  <Shield className="w-5 h-5 text-blue-400" />
                  BAM AIChat Access Verification
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  To access BAM AIChat, you need to verify wallet ownership with at least 10M BAM tokens.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <Wallet className="w-4 h-4" />
                    <span className="font-medium">Requirements:</span>
                  </div>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Hold at least 10M BAM tokens</li>
                    <li>• Sign wallet verification message</li>
                    <li>• Connect with MetaMask or Web3 wallet</li>
                  </ul>
                </div>

                {verificationError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm">{verificationError}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleWalletVerification}
                    disabled={verificationLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {verificationLoading ? 'Verifying...' : 'Verify Wallet'}
                  </Button>
                  <Link href="/">
                    <Button variant="outline" className="border-gray-600 text-gray-300">
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <div className="pt-16 flex h-screen">
        {/* Mobile Sidebar Toggle */}
        {!showSidebar && (
          <Button
            onClick={() => setShowSidebar(true)}
            size="sm"
            variant="ghost"
            className="fixed top-20 left-4 z-40 md:hidden bg-gray-800 hover:bg-gray-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}

        {/* Sidebar */}
        {showSidebar && (
          <div className="w-full md:w-80 bg-gray-900 border-r border-gray-700 flex flex-col fixed md:relative h-full z-30">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-6 h-6 text-purple-400" />
                  <h1 className="text-xl font-bold">BAM AIChat</h1>
                  <Badge className="bg-purple-600 text-white text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI
                  </Badge>
                </div>
                <Button
                  onClick={() => setShowSidebar(false)}
                  size="sm"
                  variant="ghost"
                  className="md:hidden"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>

              {/* Category Selection */}
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    size="sm"
                    className={`text-xs ${
                      selectedCategory === category.id
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'border-gray-600 hover:bg-gray-800'
                    }`}
                  >
                    <category.icon className="w-3 h-3 mr-1" />
                    {category.name}
                  </Button>
                ))}
              </div>

              <Button
                onClick={handleNewConversation}
                className="w-full mt-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                {conversations.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                    <p className="text-xs">Start a new chat above</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <Button
                      key={conv.id}
                      onClick={() => {
                        setSelectedConversation(conv.id);
                        if (window.innerWidth < 768) setShowSidebar(false);
                      }}
                      variant={selectedConversation === conv.id ? 'default' : 'ghost'}
                      className={`w-full justify-start text-left h-auto p-3 ${
                        selectedConversation === conv.id
                          ? 'bg-purple-600/20 border-purple-500/30'
                          : 'hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{conv.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-gray-700 text-gray-300 text-xs">
                            {conv.category}
                          </Badge>
                          <span className="text-xs text-gray-400">{conv.messageCount} msgs</span>
                        </div>
                      </div>
                    </Button>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Quick Info */}
            <div className="p-4 border-t border-gray-700">
              <div className="text-xs text-gray-400 space-y-1">
                <div className="flex items-center gap-2">
                  <Wallet className="w-3 h-3" />
                  <span>Verified: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3" />
                  <span>Claude 4.0 Sonnet</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {!selectedConversation ? (
            // Welcome Screen
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center max-w-2xl">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Welcome to BAM AIGPT</h2>
                <p className="text-gray-400 mb-6">
                  Your AI-powered crypto companion. Get real-time insights, research assistance, and learn about DeFi.
                </p>
                
                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {categories.slice(0, 4).map((category) => (
                    <Button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        handleNewConversation();
                      }}
                      variant="outline"
                      className="p-4 h-auto border-gray-600 hover:bg-gray-800"
                    >
                      <div className="text-center">
                        <category.icon className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                        <div className="font-medium">{category.name}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {category.id === 'crypto' && 'Market analysis & insights'}
                          {category.id === 'research' && 'Deep research & reports'}
                          {category.id === 'learn' && 'DeFi education & guides'}
                          {category.id === 'general' && 'General conversations'}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>

                {/* Recent Updates */}
                {highlights.length > 0 && (
                  <div className="text-left">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-400" />
                      Latest Crypto Highlights
                    </h3>
                    <div className="space-y-3">
                      {highlights.slice(0, 3).map((update: any) => (
                        <div key={update.id} className="bg-gray-800/50 rounded-lg p-3 text-left">
                          <div className="font-medium text-sm mb-1">{update.title}</div>
                          <div className="text-xs text-gray-400">{update.summary}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Chat Interface
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-700 bg-gray-900">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setShowSidebar(true)}
                    size="sm"
                    variant="ghost"
                    className="md:hidden"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex-1">
                    <h3 className="font-semibold">{conversationData?.conversation?.title || 'Loading...'}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-purple-600 text-white text-xs">
                        {conversationData?.conversation?.category || selectedCategory}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        Claude 4.0 • {conversationData?.messages?.length || 0} messages
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="max-w-4xl mx-auto space-y-4">
                  {loadingConversation ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
                    </div>
                  ) : (
                    conversationData?.messages?.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.role === 'user'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-800 text-gray-100'
                          }`}
                        >
                          <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                          <div className="text-xs opacity-70 mt-2">
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-700 bg-gray-900">
                <div className="max-w-4xl mx-auto">
                  <div className="flex gap-2">
                    <Textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Ask about crypto, DeFi, or anything else..."
                      className="flex-1 bg-gray-800 border-gray-600 text-white resize-none"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || sendMessageMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-xs text-gray-400 mt-2 text-center">
                    Press Enter to send • Shift+Enter for new line
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}