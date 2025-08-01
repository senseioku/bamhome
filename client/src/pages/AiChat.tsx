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
import { walletSignatureService } from '@/lib/walletSignature';
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
  
  // Debug logging for verification state
  useEffect(() => {
    console.log('AiChat component - isVerified:', isVerified, 'walletAddress:', walletAddress);
  }, [isVerified, walletAddress]);
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
    console.log('Starting wallet verification...');
    setVerificationLoading(true);
    setVerificationError(null);

    try {
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        setVerificationError('Please connect your wallet to continue.');
        return;
      }

      const address = accounts[0];
      console.log('Verifying wallet address:', address);
      const verification: WalletVerification = await walletSecurity.verifyWalletOwnership(address);
      console.log('Verification result:', verification);

      if (verification.isValid) {
        console.log('Verification successful, now signing message for authentication');
        
        // Step 2: Sign message for cryptographic proof (only in production or if explicitly requested)
        if (process.env.NODE_ENV === 'production' || window.location.search.includes('require_signature=true')) {
          const signatureResult = await walletSignatureService.authenticateWallet(address);
          
          if (signatureResult.success) {
            console.log('Wallet signature successful, user authenticated');
            setIsVerified(true);
            setWalletAddress(address);
            setShowVerificationDialog(false);
            
            // Store authentication data for API calls
            localStorage.setItem('verifiedWalletAddress', address);
            localStorage.setItem('walletSignature', signatureResult.signature!);
            localStorage.setItem('walletTimestamp', signatureResult.timestamp!.toString());
          } else {
            console.log('Signature failed:', signatureResult.error);
            setVerificationError(signatureResult.error || 'Signature verification failed');
          }
        } else {
          // Development mode - skip signature for easier testing
          console.log('Development mode: skipping signature verification');
          setIsVerified(true);
          setWalletAddress(address);
          setShowVerificationDialog(false);
          
          // Store only wallet address for development
          localStorage.setItem('verifiedWalletAddress', address);
        }
      } else {
        console.log('Token verification failed:', verification.error);
        setVerificationError(verification.error || 'Token verification failed');
        localStorage.removeItem('verifiedWalletAddress');
        localStorage.removeItem('walletSignature');
        localStorage.removeItem('walletTimestamp');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
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
    console.log('Creating new conversation:', { selectedCategory, isVerified });
    if (!isVerified) {
      console.error('User not verified - cannot create conversation');
      return;
    }

    const title = `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Chat ${Date.now()}`;
    try {
      const result = await createConversationMutation.mutateAsync({
        title,
        category: selectedCategory
      });
      console.log('Conversation created successfully:', result);
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
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Navigation />
        
        {/* Compact Mobile Login */}
        <div className="flex-1 flex items-center justify-center p-4 pt-20">
          <div className="w-full max-w-sm space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white mb-1">BAM AIChat</h2>
              <p className="text-sm text-gray-400">AI-powered crypto companion</p>
            </div>

            {/* Requirements Card */}
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-blue-400">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Access Requirements</span>
              </div>
              <div className="space-y-2 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  <span>Hold 10M+ BAM tokens</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  <span>Verify wallet ownership</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  <span>Connect MetaMask/Web3 wallet</span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {verificationError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2 text-red-400">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{verificationError}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleWalletVerification}
                disabled={verificationLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3"
              >
                {verificationLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Verifying...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Verify Wallet Access
                  </div>
                )}
              </Button>
              
              <Link href="/" className="block">
                <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navigation />
      
      <div className="flex-1 flex pt-16 relative">
        {/* Mobile Sidebar Toggle */}
        {!showSidebar && (
          <Button
            onClick={() => setShowSidebar(true)}
            size="sm"
            variant="ghost"
            className="fixed top-20 left-4 z-40 md:hidden bg-gray-800/90 hover:bg-gray-700 backdrop-blur-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}

        {/* Mobile Sidebar */}
        {showSidebar && (
          <div className="w-full md:w-80 bg-gray-900/95 backdrop-blur-sm border-r border-gray-700 flex flex-col fixed md:relative h-full z-30 md:bg-gray-900">
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
                onClick={async (e) => {
                  e.preventDefault();
                  console.log('New Chat button clicked from sidebar');
                  await handleNewConversation();
                }}
                disabled={createConversationMutation.isPending}
                className="w-full mt-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
                size="sm"
              >
                {createConversationMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
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
            // Welcome Screen - Mobile Optimized
            <div className="flex-1 flex flex-col">
              <div className="flex-1 flex items-center justify-center p-4 min-h-0">
                <div className="text-center max-w-md w-full">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                    <Brain className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-4">Welcome to BAM AIChat</h2>
                  <p className="text-gray-400 text-sm md:text-base mb-6">
                    AI-powered crypto companion for insights and DeFi education.
                  </p>
                  
                  {/* Quick Actions - Compact Mobile Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {categories.slice(0, 4).map((category) => (
                      <Button
                        key={category.id}
                        onClick={async (e) => {
                          e.preventDefault();
                          console.log('Category button clicked:', category.id);
                          setSelectedCategory(category.id);
                          await handleNewConversation();
                        }}
                        disabled={createConversationMutation.isPending}
                        variant="outline"
                        className="p-3 h-auto border-gray-600 hover:bg-gray-800 text-left disabled:opacity-50"
                      >
                        <div className="flex flex-col items-center">
                          <category.icon className="w-5 h-5 mb-2 text-purple-400" />
                          <div className="font-medium text-xs">{category.name}</div>
                          <div className="text-xs text-gray-400 mt-1 text-center leading-tight">
                            {category.id === 'crypto' && 'Market insights'}
                            {category.id === 'research' && 'Deep research'}
                            {category.id === 'learn' && 'DeFi guides'}
                            {category.id === 'general' && 'Chat'}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Fixed Chat Input at Bottom */}
              <div className="p-4 border-t border-gray-700 bg-gray-900/95 backdrop-blur-sm">
                <div className="max-w-md mx-auto">
                  <div className="flex gap-2">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Ask about crypto, DeFi, or start a conversation..."
                      className="flex-1 bg-gray-800 border-gray-600 text-white text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (messageInput.trim()) {
                            handleNewConversation();
                          }
                        }
                      }}
                    />
                    <Button
                      onClick={async (e) => {
                        e.preventDefault();
                        console.log('Welcome input button clicked:', messageInput);
                        if (messageInput.trim()) {
                          await handleNewConversation();
                        }
                      }}
                      disabled={!messageInput.trim() || createConversationMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-700 px-3 disabled:opacity-50"
                      size="sm"
                    >
                      {createConversationMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="text-xs text-gray-400 mt-2 text-center">
                    Start by typing a question or select a category above
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Chat Interface
            <>
              {/* Chat Header - Compact Mobile */}
              <div className="p-3 md:p-4 border-b border-gray-700 bg-gray-900/95 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setShowSidebar(true)}
                    size="sm"
                    variant="ghost"
                    className="md:hidden p-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm md:text-base truncate">
                      {conversationData?.conversation?.title || 'Loading...'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-purple-600 text-white text-xs">
                        {conversationData?.conversation?.category || selectedCategory}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {conversationData?.messages?.length || 0} msgs
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages - Mobile Optimized */}
              <ScrollArea className="flex-1 p-3 md:p-4">
                <div className="max-w-4xl mx-auto space-y-3">
                  {loadingConversation ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400" />
                    </div>
                  ) : (
                    conversationData?.messages?.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-2 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[85%] md:max-w-[80%] rounded-lg p-3 ${
                            message.role === 'user'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-800 text-gray-100'
                          }`}
                        >
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                          <div className="text-xs opacity-70 mt-1">
                            {new Date(message.createdAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input - Fixed Bottom */}
              <div className="p-3 md:p-4 border-t border-gray-700 bg-gray-900/95 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto">
                  <div className="flex gap-2">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Ask about crypto, DeFi, or anything else..."
                      className="flex-1 bg-gray-800 border-gray-600 text-white text-sm"
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
                      className="bg-purple-600 hover:bg-purple-700 px-3"
                      size="sm"
                    >
                      {sendMessageMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 text-center">
                    Press Enter to send
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