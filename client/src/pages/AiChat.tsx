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
  Star,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Copy,
  Check
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

// Enhanced content formatting function
const formatMessageContent = (content: string) => {
  // Remove markdown-style formatting that looks unprofessional
  const formatted = content
    // Replace ### with proper headers
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-white mb-2 mt-4">$1</h3>')
    // Replace ## with slightly larger headers  
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold text-white mb-3 mt-4">$1</h2>')
    // Replace # with main headers
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-white mb-3 mt-4">$1</h1>')
    // Clean up ** bold formatting to be more subtle
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
    // Clean up * italic formatting
    .replace(/\*(.+?)\*/g, '<em class="italic text-gray-300">$1</em>')
    // Replace bullet points with clean list items
    .replace(/^- (.+)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-purple-400 mt-1">•</span><span>$1</span></div>')
    // Replace numbered lists
    .replace(/^(\d+)\. (.+)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-purple-400 font-medium">$1.</span><span>$2</span></div>')
    // Clean line breaks
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');

  return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
};

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
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
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

  // Check if wallet verification needed - improved compatibility with BAM Swap
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
          
          // Check if session is valid from walletSecurity
          const isSessionValid = walletSecurity.isSessionValid(address);
          
          if (isSessionValid) {
            setIsVerified(true);
            setWalletAddress(address);
          } else {
            // Try to verify immediately if wallet is connected but no session
            try {
              const verification = await walletSecurity.verifyWalletOwnership(address);
              if (verification.isValid) {
                setIsVerified(true);
                setWalletAddress(address);
              } else {
                setShowVerificationDialog(true);
                setVerificationError(verification.error || 'Wallet verification required');
              }
            } catch (error) {
              setShowVerificationDialog(true);
            }
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

  // Username creation mutation
  const createUsernameMutation = useMutation({
    mutationFn: async ({ username, displayName }: { username: string; displayName?: string }) => {
      const response = await fetch('/api/user/username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, displayName })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create username');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setShowUsernameDialog(false);
      setUsername('');
      setDisplayName('');
      setUsernameError(null);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      setUsernameError(error.message || 'Failed to create username');
    }
  });

  const handleCreateUsername = async () => {
    if (!username.trim()) return;
    
    setUsernameError(null);
    try {
      await createUsernameMutation.mutateAsync({
        username: username.trim(),
        displayName: displayName.trim() || undefined
      });
    } catch (error) {
      console.error('Username creation failed:', error);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      // Clear wallet session
      walletSecurity.clearSession(walletAddress);
      
      // Reset state
      setIsVerified(false);
      setWalletAddress('');
      setShowWalletMenu(false);
      setShowVerificationDialog(true);
      
      // Clear any cached data
      queryClient.clear();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  const copyAddressToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

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
      console.log('🔐 Starting wallet verification for AIChat access...');
      
      const verification: WalletVerification = await walletSecurity.verifyWalletOwnership(address);

      if (verification.isValid) {
        console.log('✅ AIChat wallet verification successful');
        setIsVerified(true);
        setWalletAddress(address);
        setShowVerificationDialog(false);
        
        // Create BAM Swap session for compatibility
        await walletSecurity.createSessionForBamSwap(address);
      } else {
        console.warn('❌ AIChat wallet verification failed:', verification.error);
        setVerificationError(verification.error || 'Verification failed');
      }
    } catch (error: any) {
      console.error('AIChat verification error:', error);
      if (error.message?.includes('insufficient') || error.message?.includes('10M')) {
        setVerificationError('You need at least 10M BAM tokens to access BAM AIChat.');
      } else if (error.message?.includes('signature') || error.message?.includes('rejected')) {
        setVerificationError('Wallet signature required for access verification.');
      } else {
        setVerificationError('Failed to verify wallet. Please try again.');
      }
    } finally {
      setVerificationLoading(false);
    }
  };

  // For static deployment, we'll use local state instead of API calls
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationData, setConversationData] = useState<{ conversation: Conversation; messages: Message[] } | undefined>();
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [highlights] = useState<any[]>([]); // Placeholder for crypto highlights

  // Create new conversation (local state for static deployment)
  const createConversationMutation = useMutation({
    mutationFn: async ({ title, category }: { title: string; category: string }) => {
      const newConversation = {
        id: Date.now().toString(),
        userId: null,
        title,
        category,
        isActive: true,
        messageCount: 0,
        lastMessageAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      } as unknown as Conversation;
      return newConversation;
    },
    onSuccess: (conversation: Conversation) => {
      setConversations(prev => [conversation, ...prev]);
      setConversationData({
        conversation,
        messages: []
      });
      setSelectedConversation(conversation.id);
    }
  });

  // Send message using AI API
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          conversationHistory: conversationData?.messages || []
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.json();
    },
    onSuccess: (aiResponse) => {
      // Add user message and AI response to conversation
      if (conversationData) {
        const userMessage = {
          id: Date.now().toString(),
          conversationId: selectedConversation || null,
          role: 'user',
          content: messageInput.trim(),
          metadata: null,
          tokens: null,
          createdAt: new Date()
        } as unknown as Message;
        
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          conversationId: selectedConversation || null,
          role: 'assistant',
          content: aiResponse.response,
          metadata: null,
          tokens: null,
          createdAt: new Date()
        } as unknown as Message;

        setConversationData(prev => ({
          ...prev!,
          messages: [...(prev?.messages || []), userMessage, aiMessage]
        }));

        // Update conversation count
        setConversations(prev => 
          prev.map(conv => 
            conv.id === selectedConversation 
              ? { ...conv, messageCount: conv.messageCount + 2 }
              : conv
          )
        );
      }
      setMessageInput('');
    }
  });

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    try {
      await sendMessageMutation.mutateAsync({
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
              <p className="text-sm text-gray-400">AI-powered crypto and growth companion</p>
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
            className="fixed top-20 left-4 z-50 md:hidden bg-gray-800/90 hover:bg-gray-700 backdrop-blur-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}

        {/* Mobile Sidebar */}
        {showSidebar && (
          <div className="w-full md:w-80 bg-gray-900/95 backdrop-blur-sm border-r border-gray-700 flex flex-col fixed md:relative h-full z-10 md:bg-gray-900">
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

            {/* Wallet & User Info */}
            <div className="p-4 border-t border-gray-700">
              <div className="space-y-3">
                {/* Wallet Connection Status */}
                <div className="relative">
                  <Button
                    onClick={() => setShowWalletMenu(!showWalletMenu)}
                    variant="outline"
                    size="sm"
                    className="w-full border-gray-600 hover:bg-gray-800 text-xs justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Wallet className="w-3 h-3" />
                      <span>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                    </div>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                  
                  {/* Wallet Menu Dropdown */}
                  {showWalletMenu && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                      <div className="p-3 border-b border-gray-700">
                        <div className="text-xs text-gray-400 mb-1">Connected Wallet</div>
                        <div className="text-xs font-mono text-white">{walletAddress}</div>
                      </div>
                      <div className="p-1">
                        <Button
                          onClick={copyAddressToClipboard}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs hover:bg-gray-700"
                        >
                          {addressCopied ? <Check className="w-3 h-3 mr-2" /> : <Copy className="w-3 h-3 mr-2" />}
                          {addressCopied ? 'Copied!' : 'Copy Address'}
                        </Button>
                        <Button
                          onClick={handleDisconnectWallet}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs hover:bg-gray-700 text-red-400 hover:text-red-300"
                        >
                          <LogOut className="w-3 h-3 mr-2" />
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Status */}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Zap className="w-3 h-3" />
                  <span>AI Powered</span>
                </div>

                {/* Username Creation */}
                <Button
                  onClick={() => setShowUsernameDialog(true)}
                  size="sm"
                  variant="outline"
                  className="w-full text-xs border-gray-600 hover:bg-gray-800"
                >
                  <User className="w-3 h-3 mr-1" />
                  Create Username
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative z-20">
          {!selectedConversation ? (
            // Welcome Screen - Mobile Optimized
            <div className="flex-1 flex flex-col">
              <div className="flex-1 flex items-center justify-center p-4 min-h-0 relative z-30">
                <div className="text-center max-w-md w-full">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                    <Brain className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-4">Welcome to BAM AIChat</h2>
                  <p className="text-gray-400 text-sm md:text-base mb-6">
                    AI-powered crypto companion for insights, DeFi education for building business and wealth multiplication. Anything from business, crypto and growth BAM AIChat will help you grow.
                  </p>
                  
                  {/* Quick Actions - Compact Mobile Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {categories.slice(0, 4).map((category) => (
                      <Button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategory(category.id);
                          handleNewConversation();
                        }}
                        variant="outline"
                        className="p-3 h-auto border-gray-600 hover:bg-gray-800 text-left"
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
              <div className="p-4 border-t border-gray-700 bg-gray-900/95 backdrop-blur-sm relative z-30">
                <div className="max-w-md mx-auto">
                  <div className="flex gap-2">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Ask about crypto, DeFi, business, wealth building..."
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
                      onClick={() => {
                        if (messageInput.trim()) {
                          handleNewConversation();
                        }
                      }}
                      disabled={!messageInput.trim()}
                      className="bg-purple-600 hover:bg-purple-700 px-3"
                      size="sm"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-xs text-gray-400 mt-2 text-center">
                    Start by asking about crypto, business, DeFi, or wealth building
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Chat Interface
            <>
              {/* Chat Header - Fixed Mobile Layout */}
              <div className="p-3 md:p-4 border-b border-gray-700 bg-gray-900/95 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setShowSidebar(true)}
                    size="sm"
                    variant="ghost"
                    className="md:hidden p-1 flex-shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 min-w-0 mr-2">
                    <h3 className="font-semibold text-sm md:text-base truncate pr-2">
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
                          <div className="whitespace-pre-wrap text-sm leading-relaxed prose prose-sm prose-invert max-w-none">
                            {formatMessageContent(message.content)}
                          </div>
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
                      placeholder="Ask about crypto, DeFi, business, wealth building..."
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

      {/* Username Creation Dialog */}
      <Dialog open={showUsernameDialog} onOpenChange={setShowUsernameDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Create Username</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a unique username for your BAM AIChat profile
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300">Username</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="e.g. crypto_trader"
                className="mt-1 bg-gray-800 border-gray-600 text-white"
                maxLength={20}
              />
              <div className="text-xs text-gray-400 mt-1">
                3-20 characters, letters, numbers, and underscores only
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Display Name (Optional)</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Crypto Trader"
                className="mt-1 bg-gray-800 border-gray-600 text-white"
                maxLength={30}
              />
            </div>
            {usernameError && (
              <div className="text-red-400 text-sm">{usernameError}</div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={() => setShowUsernameDialog(false)}
                variant="outline"
                className="flex-1 border-gray-600 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateUsername}
                disabled={!username.trim() || username.length < 3 || createUsernameMutation.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {createUsernameMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}