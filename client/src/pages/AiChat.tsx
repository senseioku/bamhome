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
import { useToast } from "@/hooks/use-toast";
import { walletSecurity, type WalletVerification } from '@/lib/walletSecurity';
import { countries, searchCountries, getCountryByCode } from '@/lib/countries';
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
  ChevronRight,
  Copy,
  Check,
  MessageSquare,
  BarChart3,
  Coins,
  X
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
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editCountrySearch, setEditCountrySearch] = useState('');
  const [showEditCountryDropdown, setShowEditCountryDropdown] = useState(false);
  const [editProfileError, setEditProfileError] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const editCountryDropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query user profile
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return null;
      const response = await fetch(`/api/user/profile?walletAddress=${walletAddress}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!walletAddress && isVerified,
  });

  // Check window size for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024;
      setShowSidebar(isDesktop);
    };
    handleResize(); // Call on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation]);

  // Handle clicks outside country dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
      if (editCountryDropdownRef.current && !editCountryDropdownRef.current.contains(event.target as Node)) {
        setShowEditCountryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check if wallet verification needed - improved compatibility with BAM Swap
  useEffect(() => {
    const checkVerification = async () => {
      if (typeof window === 'undefined') {
        // Server-side rendering - defer verification
        return;
      }

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
              console.error('Wallet verification error:', error);
              setShowVerificationDialog(true);
            }
          }
        } else {
          setShowVerificationDialog(true);
        }
      } catch (error) {
        console.error('Wallet access error:', error);
        setShowVerificationDialog(true);
      }
    };

    // Add delay to ensure DOM is ready in production
    const timer = setTimeout(() => {
      checkVerification();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Username creation mutation
  const createUsernameMutation = useMutation({
    mutationFn: async ({ username, displayName, email, country }: { username: string; displayName?: string; email: string; country: string }) => {
      const response = await fetch('/api/user/username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username, 
          displayName, 
          email,
          country,
          walletAddress 
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        
        // Handle rate limiting with friendly messages
        if (response.status === 429) {
          const friendlyMessage = error.tip ? `${error.message} ${error.tip}` : error.message;
          throw new Error(friendlyMessage || 'Please wait before trying again');
        }
        
        throw new Error(error.message || 'Failed to create username');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setUserProfile(data);
      setShowUsernameDialog(false);
      setUsername('');
      setDisplayName('');
      setEmail('');
      setCountry('');
      setCountrySearch('');
      setUsernameError(null);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      // Force refresh conversations for newly registered users
      if (walletAddress) {
        queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations', walletAddress] });
        queryClient.refetchQueries({ queryKey: ['/api/chat/conversations', walletAddress] });
      }
      
      // Show success confirmation
      console.log('✅ Profile created and linked to wallet:', data);
      toast({
        title: "Profile Created Successfully!",
        description: "Welcome to BAM AIChat! You can now start chatting.",
        duration: 5000,
      });
    },
    onError: (error: any) => {
      // Enhanced error message for rate limits
      const isRateLimit = error.message?.includes('limit') || error.message?.includes('wait') || error.message?.includes('time');
      setUsernameError(error.message || 'Failed to create username');
      
      if (isRateLimit) {
        toast({
          title: "Rate Limit Reached",
          description: error.message,
          variant: "destructive",
          duration: 6000
        });
      }
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async ({ username, displayName, email, country }: { username?: string; displayName?: string; email?: string; country?: string }) => {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username, 
          displayName,
          email,
          country,
          walletAddress 
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        
        // Handle rate limiting with friendly messages
        if (response.status === 429) {
          const friendlyMessage = error.tip ? `${error.message} ${error.tip}` : error.message;
          throw new Error(friendlyMessage || 'Please wait before trying again');
        }
        
        throw new Error(error.message || 'Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch user profile
      queryClient.invalidateQueries({ queryKey: ['user-profile', walletAddress] });
      setShowEditProfileDialog(false);
      setEditUsername('');
      setEditDisplayName('');
      setEditEmail('');
      setEditCountry('');
      setEditCountrySearch('');
      setEditProfileError(null);
      
      console.log('✅ Profile successfully updated:', data);
      toast({
        title: "Profile Updated!",
        description: `Your profile has been updated successfully.`,
        duration: 5000,
      });
    },
    onError: (error: any) => {
      // Enhanced error message for rate limits
      const isRateLimit = error.message?.includes('limit') || error.message?.includes('wait') || error.message?.includes('time');
      setEditProfileError(error.message || 'Failed to update profile');
      
      if (isRateLimit) {
        toast({
          title: "Rate Limit Reached",
          description: error.message,
          variant: "destructive",
          duration: 6000
        });
      }
    }
  });

  const handleCreateUsername = async () => {
    if (!username.trim()) {
      setUsernameError('Username is required');
      return;
    }

    if (!email.trim()) {
      setUsernameError('Email address is required');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setUsernameError('Please enter a valid email address');
      return;
    }

    if (!country) {
      setUsernameError('Please select your country');
      return;
    }
    
    setUsernameError(null);
    try {
      await createUsernameMutation.mutateAsync({
        username: username.trim(),
        displayName: displayName.trim() || undefined,
        email: email.trim(),
        country: country
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

  const handleEditProfile = () => {
    // Pre-fill with current profile data
    setEditUsername(userProfile?.username || '');
    setEditDisplayName(userProfile?.displayName || '');
    setEditEmail(userProfile?.email || '');
    setEditCountry(userProfile?.country || '');
    setEditCountrySearch(getCountryByCode(userProfile?.country || '')?.name || '');
    setEditProfileError(null);
    setShowEditProfileDialog(true);
    setShowWalletMenu(false);
  };

  // Check if username can be changed (30-day restriction)
  const canChangeUsername = () => {
    if (!userProfile?.lastUsernameChange) return true;
    
    const daysSinceLastChange = Math.floor(
      (Date.now() - new Date(userProfile.lastUsernameChange).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysSinceLastChange >= 30;
  };

  const getNextUsernameChangeDate = () => {
    if (!userProfile?.lastUsernameChange) return null;
    
    const nextChangeDate = new Date(userProfile.lastUsernameChange);
    nextChangeDate.setDate(nextChangeDate.getDate() + 30);
    return nextChangeDate;
  };

  const getDaysUntilUsernameChange = () => {
    if (!userProfile?.lastUsernameChange) return 0;
    
    const daysSinceLastChange = Math.floor(
      (Date.now() - new Date(userProfile.lastUsernameChange).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return Math.max(0, 30 - daysSinceLastChange);
  };

  const handleUpdateProfile = async () => {
    if (!editUsername.trim()) return;
    
    setEditProfileError(null);
    try {
      await updateProfileMutation.mutateAsync({
        username: editUsername.trim(),
        displayName: editDisplayName.trim() || undefined,
        email: editEmail.trim() || undefined,
        country: editCountry || undefined
      });
    } catch (error) {
      console.error('Profile update failed:', error);
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

  // Copy message to clipboard
  const copyMessageToClipboard = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      toast({
        title: "Copied to clipboard",
        description: "Message copied successfully",
        duration: 2000
      });
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
      toast({
        title: "Copy failed",
        description: "Unable to copy message to clipboard",
        variant: "destructive",
        duration: 3000
      });
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
        // Normalize wallet address to lowercase for consistency
        const normalizedAddress = address.toLowerCase();
        setWalletAddress(normalizedAddress);
        setShowVerificationDialog(false);
        
        // Create BAM Swap session for compatibility
        await walletSecurity.createSessionForBamSwap(normalizedAddress);
        
        // Check if user has profile - force registration for new users
        setTimeout(async () => {
          try {
            const profileResponse = await fetch(`/api/user/profile?walletAddress=${normalizedAddress}`);
            if (profileResponse.status === 404) {
              console.log('🔄 New user detected, enforcing registration...');
              setShowUsernameDialog(true);
            } else {
              // Force refresh conversations after wallet connection
              console.log('🔄 Force refreshing conversations after wallet verification...');
              queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations', normalizedAddress] });
              queryClient.refetchQueries({ queryKey: ['/api/chat/conversations', normalizedAddress] });
            }
          } catch (error) {
            console.error('Error checking user profile:', error);
            // If error checking profile, still force registration to be safe
            setShowUsernameDialog(true);
          }
        }, 100);
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

  // Fetch conversations from database
  const conversationsQuery = useQuery({
    queryKey: ['/api/chat/conversations', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      
      // Ensure wallet address is normalized before API calls
      const normalizedWallet = walletAddress.toLowerCase();
      console.log('🔄 Fetching conversations for normalized wallet:', normalizedWallet);
      const response = await fetch(`/api/chat/conversations?walletAddress=${normalizedWallet}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.log('📭 No conversations found for wallet');
          return [];
        }
        console.error('❌ Failed to fetch conversations:', response.status);
        throw new Error('Failed to fetch conversations');
      }
      const data = await response.json();
      console.log('✅ Conversations fetched for wallet:', normalizedWallet, 'Data:', data);
      console.log('📊 Conversation count:', Array.isArray(data) ? data.length : 'Not an array');
      return Array.isArray(data) ? data : [];
    },
    enabled: !!walletAddress && isVerified,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  const conversations = Array.isArray(conversationsQuery?.data) ? conversationsQuery.data : [];

  // Fetch specific conversation data
  const conversationQuery = useQuery({
    queryKey: ['/api/chat/conversations', selectedConversation, walletAddress],
    queryFn: async () => {
      if (!selectedConversation || !walletAddress) return undefined;
      
      console.log('🔄 Fetching conversation:', selectedConversation);
      // Ensure wallet address is normalized for consistency  
      const normalizedWallet = walletAddress.toLowerCase();
      const response = await fetch(`/api/chat/conversations/${selectedConversation}?walletAddress=${normalizedWallet}`);
      if (!response.ok) {
        console.error('❌ Failed to fetch conversation:', response.status);
        throw new Error('Failed to fetch conversation');
      }
      const data = await response.json();
      console.log('✅ Conversation data fetched:', data);
      return data;
    },
    enabled: !!selectedConversation && !!walletAddress && isVerified,
    refetchOnWindowFocus: false,
    staleTime: 30000
  });

  const conversationData = conversationQuery.data;
  const loadingConversation = conversationQuery.isLoading;
  const [highlights] = useState<any[]>([]); // Placeholder for crypto highlights

  // Create new conversation with database persistence
  const createConversationMutation = useMutation({
    mutationFn: async ({ title, category }: { title: string; category: string }) => {
      console.log('🔄 Creating new conversation:', { title, category, walletAddress });
      
      // Create a timeout controller for the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title, 
          category, 
          walletAddress: walletAddress.toLowerCase() 
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          message: response.status === 429 ? 'Rate limit exceeded. Please wait a moment.' : 'Failed to create conversation' 
        }));
        console.error('❌ Failed to create conversation:', {
          status: response.status,
          statusText: response.statusText,
          error: error
        });
        throw new Error(error.message || `HTTP ${response.status}: Failed to create conversation`);
      }
      
      const newConversation = await response.json();
      console.log('✅ Conversation created successfully:', newConversation);
      return newConversation;
    },
    onSuccess: (conversation: Conversation) => {
      console.log('✅ Conversation created, refreshing list and selecting conversation');
      // Refresh conversations list
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations', walletAddress] });
      setSelectedConversation(conversation.id);
    },
    onError: (error: any) => {
      console.error('❌ Create conversation failed:', error);
      toast({
        title: "Failed to create conversation",
        description: error.message || "Please try again in a moment",
        variant: "destructive",
        duration: 5000
      });
    }
  });

  // Send message using database API
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      if (!selectedConversation || !walletAddress) {
        throw new Error('No conversation selected or wallet not connected');
      }

      console.log('🔄 Sending message to conversation:', selectedConversation);
      
      // Create a timeout controller for the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`/api/chat/conversations/${selectedConversation}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          walletAddress: walletAddress.toLowerCase()
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          message: response.status === 429 ? 'Rate limit exceeded. Please wait a moment.' : 'Failed to send message' 
        }));
        console.error('❌ Failed to send message:', {
          status: response.status,
          statusText: response.statusText,
          error: error
        });
        throw new Error(error.message || `HTTP ${response.status}: Failed to send message`);
      }

      const result = await response.json();
      console.log('✅ Message sent successfully:', result);
      return result;
    },
    onSuccess: (result) => {
      // Clear message input
      setMessageInput('');
      
      // Refresh the conversation data to show new messages
      queryClient.invalidateQueries({ 
        queryKey: ['/api/chat/conversations', selectedConversation, walletAddress] 
      });
      
      // Also refresh conversations list to update message count and timestamp
      queryClient.invalidateQueries({ 
        queryKey: ['/api/chat/conversations', walletAddress] 
      });
      console.log('✅ Message sent successfully');
    },
    onError: (error: any) => {
      console.error('Send message error:', error);
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again",
        variant: "destructive",
        duration: 5000
      });
    }
  });

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (messageInputRef.current) {
      messageInputRef.current.style.height = 'auto';
      const scrollHeight = messageInputRef.current.scrollHeight;
      const maxHeight = 200; // Max height in pixels (about 8 lines)
      messageInputRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
      messageInputRef.current.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  };

  // Handle input change with auto-resize
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    adjustTextareaHeight();
  };

  // Check if user is near bottom of messages
  const isNearBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 100; // Within 100px of bottom
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Smart scroll: only auto-scroll if user was already near bottom
  const smartScrollToBottom = () => {
    if (isNearBottom()) {
      scrollToBottom();
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim()) {
      console.log('⚠️ Empty message, skipping send');
      return;
    }

    if (sendMessageMutation.isPending) {
      console.log('🔄 Already sending message, skipping duplicate request');
      return;
    }

    console.log('🔄 Sending message:', messageInput.trim());
    
    try {
      await sendMessageMutation.mutateAsync({
        content: messageInput.trim()
      });
      
      // Reset textarea height after sending
      if (messageInputRef.current) {
        messageInputRef.current.style.height = 'auto';
      }
      
      // Always scroll to bottom after sending a message
      setTimeout(scrollToBottom, 100);
      console.log('✅ Message sent and UI updated');
    } catch (error) {
      console.error('❌ Failed to send message:', error);
    }
  };

  const handleNewConversation = async () => {
    if (createConversationMutation.isPending) {
      console.log('🔄 Already creating conversation, skipping duplicate request');
      return;
    }

    const title = `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Chat ${Date.now()}`;
    console.log('🔄 Creating new conversation:', { title, category: selectedCategory });
    
    try {
      await createConversationMutation.mutateAsync({
        title,
        category: selectedCategory
      });
      console.log('✅ Conversation created successfully');
    } catch (error) {
      console.error('❌ Failed to create conversation:', error);
      toast({
        title: "Failed to create conversation",
        description: "Please try again in a moment",
        variant: "destructive",
        duration: 5000
      });
    }
  };

  const categories = [
    { id: 'crypto', name: 'Crypto Analysis', icon: TrendingUp, color: 'bg-green-500' },
    { id: 'research', name: 'Research', icon: Search, color: 'bg-blue-500' },
    { id: 'learn', name: 'Learn DeFi', icon: BookOpen, color: 'bg-purple-500' },
    { id: 'general', name: 'General Chat', icon: MessageCircle, color: 'bg-gray-500' }
  ];

  // Auto-resize textarea on mount and content change
  useEffect(() => {
    adjustTextareaHeight();
  }, [messageInput]);

  // Scroll to bottom when new messages are received (only if user was near bottom)
  useEffect(() => {
    if (conversationData?.messages?.length) {
      setTimeout(smartScrollToBottom, 100);
    }
  }, [conversationData?.messages?.length]);

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        
        {/* Compact Mobile Login */}
        <div className="flex-1 flex items-center justify-center p-3 pt-16">
          <div className="w-full max-w-sm space-y-3">
            {/* Header */}
            <div className="text-center">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white mb-1">BAM AIChat</h2>
              <p className="text-xs text-gray-400">AI-powered crypto companion</p>
            </div>

            {/* Requirements Card */}
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-blue-400">
                <Shield className="w-3 h-3" />
                <span className="text-xs font-medium">Access Requirements</span>
              </div>
              <div className="space-y-1 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                  <span>Hold 10M+ BAM tokens</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                  <span>Verify wallet ownership</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                  <span>Connect MetaMask/Web3 wallet</span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {verificationError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                <div className="flex items-start gap-2 text-red-400">
                  <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span className="text-xs">{verificationError}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                onClick={handleWalletVerification}
                disabled={verificationLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2.5"
              >
                {verificationLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="text-sm">Verifying...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Wallet className="w-3 h-3" />
                    <span className="text-sm">Verify Wallet Access</span>
                  </div>
                )}
              </Button>
              
              <Link href="/" className="block">
                <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 py-2">
                  <ChevronLeft className="w-3 h-3 mr-1" />
                  <span className="text-sm">Back to Home</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen text-white flex">
      {/* Left Sidebar - Full Height DeepSeek Style */}
      {showSidebar && (
        <div className={`${sidebarCollapsed ? 'w-16' : 'w-80 xl:w-96'} bg-gray-900 border-r border-gray-700 flex flex-col fixed lg:relative z-50 h-full transition-all duration-300`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                {!sidebarCollapsed && (
                  <>
                    <Brain className="w-6 h-6 text-purple-400" />
                    <h1 className="text-xl font-bold">BAM AIChat</h1>
                    <Badge className="bg-purple-600 text-white text-sm px-2 py-1">AI</Badge>
                  </>
                )}
                {sidebarCollapsed && (
                  <Brain className="w-6 h-6 text-purple-400" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  size="sm"
                  variant="ghost"
                  className="p-2 hidden lg:flex"
                >
                  {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
                <Button
                  onClick={() => setShowSidebar(false)}
                  size="sm"
                  variant="ghost"
                  className="lg:hidden p-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {!sidebarCollapsed && (
              <Button
                onClick={handleNewConversation}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg mt-4"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                <span className="text-base font-medium">New chat</span>
              </Button>
            )}
            {sidebarCollapsed && (
              <Button
                onClick={handleNewConversation}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg mt-4"
                size="lg"
              >
                <Plus className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Conversations List - Full height scrollable */}
          {!sidebarCollapsed && (
            <ScrollArea className="flex-1 px-4 py-2">
              {!Array.isArray(conversations) || conversations.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-base font-medium mb-2">No conversations yet</p>
                  <p className="text-sm">Start a new chat to get going</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Recent Section */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Recent Chats</h3>
                      <div className="text-xs text-gray-500">
                        {Array.isArray(conversations) ? conversations.length : 0}/10 limit
                      </div>
                    </div>
                    <div className="space-y-1">
                      {Array.isArray(conversations) && conversations.slice(0, 5).map((conv: any) => (
                        <Button
                          key={conv.id}
                          onClick={() => {
                            setSelectedConversation(conv.id);
                            if (window.innerWidth < 1024) setShowSidebar(false);
                          }}
                          variant="ghost"
                          className={`w-full justify-start text-left py-3 px-3 rounded-lg transition-colors ${
                            selectedConversation === conv.id
                              ? 'bg-gray-800 text-white'
                              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                          }`}
                        >
                          <div className="w-full">
                            <div className={`font-medium text-sm truncate mb-1 ${
                              selectedConversation === conv.id ? 'text-white' : 'text-gray-200'
                            }`}>
                              {conv.title}
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-gray-700 text-gray-300 px-2 py-0.5">
                                  {conv.category}
                                </Badge>
                                <span>{conv.messageCount} messages</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(conv.lastMessageAt || new Date()).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Older Conversations */}
                  {Array.isArray(conversations) && conversations.length > 5 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">Earlier</h3>
                      <div className="space-y-1">
                        {conversations.slice(5).map((conv: any) => (
                          <Button
                            key={conv.id}
                            onClick={() => {
                              setSelectedConversation(conv.id);
                              if (window.innerWidth < 1024) setShowSidebar(false);
                            }}
                            variant="ghost"
                            className={`w-full justify-start text-left py-3 px-3 rounded-lg transition-colors ${
                              selectedConversation === conv.id
                                ? 'bg-gray-800 text-white'
                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            }`}
                          >
                            <div className="w-full">
                              <div className={`font-medium text-sm truncate mb-1 ${
                                selectedConversation === conv.id ? 'text-white' : 'text-gray-200'
                              }`}>
                                {conv.title}
                              </div>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-gray-700 text-gray-300 px-2 py-0.5">
                                    {conv.category}
                                  </Badge>
                                  <span>{conv.messageCount} messages</span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(conv.lastMessageAt || new Date()).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          )}

          {/* Collapsed sidebar conversations */}
          {sidebarCollapsed && (
            <ScrollArea className="flex-1 px-2 py-2">
              <div className="space-y-1">
                {Array.isArray(conversations) && conversations.slice(0, 10).map((conv: any) => (
                  <Button
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversation(conv.id);
                      if (window.innerWidth < 1024) setShowSidebar(false);
                    }}
                    variant="ghost"
                    className={`w-full p-3 rounded-lg transition-colors ${
                      selectedConversation === conv.id
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <MessageSquare className="w-5 h-5" />
                  </Button>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Bottom User Section - Only in expanded mode */}
          {!sidebarCollapsed && (
            <div className="p-4 border-t border-gray-700 space-y-3 flex-shrink-0">
              {/* Category Selection */}
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Chat Categories</h4>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      variant={selectedCategory === category.id ? 'default' : 'outline'}
                      size="sm"
                      className={`text-xs py-2 ${
                        selectedCategory === category.id
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'border-gray-600 hover:bg-gray-800 text-gray-300'
                      }`}
                    >
                      <category.icon className="w-4 h-4 mr-1" />
                      {category.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* User Actions */}
              <div className="space-y-2">
                {/* Username Creation - Show only if no profile */}
                {!userProfile && (
                  <Button
                    onClick={() => setShowUsernameDialog(true)}
                    variant="outline"
                    className="w-full border-gray-600 hover:bg-gray-800 hover:border-purple-500 py-2"
                  >
                    <User className="w-4 h-4 mr-2 text-purple-400" />
                    <span className="text-sm">Create Username</span>
                  </Button>
                )}

                {/* Wallet Connection */}
                <div className="relative">
                  <Button
                    onClick={() => setShowWalletMenu(!showWalletMenu)}
                    variant="outline"
                    className="w-full border-gray-600 hover:bg-gray-800 hover:border-green-500 py-2 justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-300">
                        {userProfile ? userProfile.username : `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-green-400" />
                  </Button>
                  
                  {/* Wallet Menu */}
                  {showWalletMenu && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                      <div className="p-3 border-b border-gray-700">
                        {userProfile ? (
                          <>
                            <div className="text-xs text-gray-400 mb-1">Profile</div>
                            <div className="text-sm font-semibold text-white">{userProfile.displayName || userProfile.username}</div>
                            <div className="text-xs text-gray-400 mb-2">@{userProfile.username}</div>
                            <div className="text-xs text-gray-500 font-mono break-all">{walletAddress}</div>
                          </>
                        ) : (
                          <>
                            <div className="text-xs text-gray-400 mb-1">Connected Wallet</div>
                            <div className="text-sm font-mono text-white break-all">{walletAddress}</div>
                          </>
                        )}
                      </div>
                      <div className="p-1">
                        {userProfile && (
                          <Button
                            onClick={handleEditProfile}
                            variant="ghost"
                            className="w-full justify-start text-sm hover:bg-gray-700 py-2"
                          >
                            <User className="w-4 h-4 mr-2" />
                            Edit Profile
                          </Button>
                        )}
                        <Button
                          onClick={copyAddressToClipboard}
                          variant="ghost"
                          className="w-full justify-start text-sm hover:bg-gray-700 py-2"
                        >
                          {addressCopied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                          {addressCopied ? 'Copied!' : 'Copy Address'}
                        </Button>
                        <Button
                          onClick={handleDisconnectWallet}
                          variant="ghost"
                          className="w-full justify-start text-sm hover:bg-gray-700 text-red-400 hover:text-red-300 py-2"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Chat Area - Full height */}
      <div className="flex-1 flex flex-col relative">
        {/* Navigation Bar */}
        <div className="p-4 border-b border-gray-700 bg-gray-900/95 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!showSidebar && (
                <Button
                  onClick={() => setShowSidebar(true)}
                  size="sm"
                  variant="ghost"
                  className="p-2"
                >
                  <MessageSquare className="w-5 h-5" />
                </Button>
              )}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold">B</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold">BAM</span>
                  <span className="text-sm text-gray-400">Ecosystem</span>
                </div>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm hover:text-purple-400 transition-colors">Home</Link>
              <Link href="/swap" className="text-sm hover:text-purple-400 transition-colors">Swap</Link>
              <Link href="/ai-chat" className="text-sm text-purple-400">AI Chat</Link>
            </nav>
            
            <div className="flex items-center gap-3">
              {!isVerified ? (
                <Button 
                  onClick={() => setShowVerificationDialog(true)}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Shield className="w-4 h-4 mr-1" />
                  Connect
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Verified</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {showUsernameDialog && !userProfile ? (
            // Registration Required Screen
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Welcome to BAM AIChat</h2>
                <p className="text-gray-400 text-lg mb-6 leading-relaxed">
                  To get started, please create your profile with a username and email address.
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  This is required for all new users to ensure secure access to BAM AIChat features.
                </p>
              </div>
            </div>
          ) : !selectedConversation ? (
            // Welcome Screen - DeepSeek Style  
            <div className="flex-1 flex flex-col">
              <div className="flex-1 flex items-center justify-center p-3 sm:p-8">
                <div className="text-center max-w-2xl w-full">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Welcome to BAM AIChat</h2>
                  <p className="text-gray-400 text-base sm:text-lg mb-6 sm:mb-8 leading-relaxed px-2">
                    AI companion for crypto, business, and general knowledge. From DeFi to cooking recipes - ask anything!
                  </p>
                  
                  {/* Quick Actions - Compact Mobile Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        onClick={() => {
                          if (!userProfile) {
                            setShowUsernameDialog(true);
                            return;
                          }
                          console.log('🔄 Category selected:', category.id);
                          setSelectedCategory(category.id);
                          handleNewConversation();
                        }}
                        disabled={createConversationMutation.isPending}
                        variant="outline"
                        className="p-4 sm:p-6 h-auto border-gray-600 hover:bg-gray-800 hover:border-purple-500 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex flex-col items-center gap-2 sm:gap-3">
                          {createConversationMutation.isPending && selectedCategory === category.id ? (
                            <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                          ) : (
                            <category.icon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                          )}
                          <div className="font-medium text-xs sm:text-sm text-center leading-tight">{category.name}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Chat Input - Sticky at Bottom - Compact Mobile */}
              <div className="sticky bottom-0 left-0 right-0 p-3 sm:p-4 border-t border-gray-700 bg-gray-900/95 backdrop-blur-sm flex-shrink-0 z-10">
                <div className="max-w-4xl mx-auto">
                  <div className="flex gap-2 sm:gap-3">
                    <Textarea
                      ref={messageInputRef}
                      value={messageInput}
                      onChange={handleInputChange}
                      placeholder="Message BAM AIChat"
                      className="flex-1 bg-gray-800 border-gray-600 text-white text-sm sm:text-base py-3 px-3 sm:px-4 rounded-xl min-h-[44px] sm:min-h-[48px] max-h-[200px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (messageInput.trim()) {
                            handleNewConversation();
                          }
                        }
                        if (e.key === 'Enter' && e.shiftKey) {
                          // Allow Shift+Enter for new lines
                          setTimeout(adjustTextareaHeight, 0);
                        }
                      }}
                      rows={1}
                      style={{ lineHeight: '1.5' }}
                    />
                    <Button
                      onClick={() => {
                        if (!userProfile) {
                          setShowUsernameDialog(true);
                          return;
                        }
                        if (messageInput.trim()) {
                          handleNewConversation();
                        }
                      }}
                      disabled={!messageInput.trim() || createConversationMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 px-3 sm:px-4 py-3 rounded-xl flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      size="lg"
                    >
                      {createConversationMutation.isPending ? (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 mt-2 text-center">
                    BAM AIChat can make mistakes. Check important info.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Chat Interface
            <div className="flex-1 flex flex-col min-h-0">
              {/* Chat Header - DeepSeek Style */}
              <div className="p-4 border-b border-gray-700 bg-gray-900/95 backdrop-blur-sm flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setShowSidebar(true)}
                    size="sm"
                    variant="ghost"
                    className="lg:hidden p-2"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg truncate">
                      {conversationData?.conversation?.title || 'New Conversation'}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge className="bg-purple-600 text-white text-sm px-2 py-1">
                        {conversationData?.conversation?.category || selectedCategory}
                      </Badge>
                      <span className="text-sm text-gray-400">
                        {conversationData?.messages?.length || 0} messages
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages - DeepSeek Style */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0 scroll-smooth">
                <div className="max-w-4xl mx-auto space-y-6">
                  {loadingConversation ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400" />
                    </div>
                  ) : (
                    conversationData?.messages?.map((message: any) => (
                      <div
                        key={message.id}
                        className={`group relative flex gap-1 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 break-words overflow-hidden ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-800 text-gray-100'
                          }`}
                        >
                          <div className="text-base leading-relaxed break-words overflow-hidden">
                            {(() => {
                              let content = message.content;
                              
                              // Preserve code blocks first
                              const codeBlocks: string[] = [];
                              content = content.replace(/```[\s\S]*?```/g, (match: string, index: number) => {
                                const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
                                codeBlocks.push(match);
                                return placeholder;
                              });
                              
                              // Preserve inline code
                              const inlineCodes: string[] = [];
                              content = content.replace(/`([^`]+)`/g, (match: string, code: string) => {
                                const placeholder = `__INLINE_CODE_${inlineCodes.length}__`;
                                inlineCodes.push(match);
                                return placeholder;
                              });
                              
                              // Format headers and lists with contextual emojis (only if not in code)
                              content = content
                                // Headers
                                .replace(/^# (.+)/gm, '🔷 $1')
                                .replace(/^## (.+)/gm, '◆ $1')
                                .replace(/^### (.+)/gm, '▪ $1')
                                // Lists
                                .replace(/^- (.+)/gm, '• $1')
                                .replace(/^\* (.+)/gm, '• $1')
                                .replace(/^\d+\. (.+)/gm, '🔹 $1')
                                
                                // Bold formatting
                                .replace(/\*\*([^*]+)\*\*/g, '$1')
                                .replace(/\*([^*]+)\*/g, '$1')
                                
                                // Clean up extra newlines
                                .replace(/\n{3,}/g, '\n\n')
                                .trim();
                              
                              // Restore code blocks with proper formatting and syntax highlighting
                              codeBlocks.forEach((block, index) => {
                                const languageMatch = block.match(/^```(\w+)/);
                                const language = languageMatch ? languageMatch[1] : '';
                                const formatted = block
                                  .replace(/^```(\w+)?\n?/, '') // Remove opening ```
                                  .replace(/\n?```$/, '') // Remove closing ```
                                  .trim();
                                
                                const codeElement = `<div class="my-3 rounded-lg overflow-hidden border border-gray-600">
                                  <div class="bg-gray-700 px-3 py-1 text-xs text-gray-300 flex items-center gap-2">
                                    <span class="text-blue-400">💻</span>
                                    <span>${language || 'Code'}</span>
                                  </div>
                                  <pre class="bg-gray-900 p-3 overflow-x-auto text-sm"><code class="text-green-400 font-mono whitespace-pre">${formatted.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
                                </div>`;
                                
                                content = content.replace(`__CODE_BLOCK_${index}__`, codeElement);
                              });
                              
                              // Restore inline code with styling
                              inlineCodes.forEach((code, index) => {
                                const cleanCode = code.replace(/`([^`]+)`/, '$1');
                                const styledCode = `<code class="bg-gray-700 text-blue-300 px-1.5 py-0.5 rounded text-sm font-mono">${cleanCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>`;
                                content = content.replace(`__INLINE_CODE_${index}__`, styledCode);
                              });
                              
                              // Convert line breaks to HTML
                              content = content.replace(/\n/g, '<br>');
                              
                              return <div dangerouslySetInnerHTML={{ __html: content }} />;
                            })()}
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-600/30">
                            <div className="text-sm opacity-70">
                              {new Date(message.createdAt).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                            {/* Copy button - positioned below message */}
                            <button
                              onClick={() => copyMessageToClipboard(message.id, message.content)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 hover:bg-gray-600/50 rounded-md flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200"
                              title="Copy message"
                            >
                              {copiedMessageId === message.id ? (
                                <>
                                  <Check className="w-3 h-3 text-green-400" />
                                  <span className="text-green-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input - Sticky at Bottom */}
              <div className="sticky bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-gray-900/95 backdrop-blur-sm flex-shrink-0 z-10">
                <div className="max-w-4xl mx-auto">
                  <div className="flex gap-3">
                    <Textarea
                      ref={messageInputRef}
                      value={messageInput}
                      onChange={handleInputChange}
                      placeholder="Message BAM AIChat"
                      className="flex-1 bg-gray-800 border-gray-600 text-white text-base py-3 px-4 rounded-xl min-h-[48px] max-h-[200px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                        if (e.key === 'Enter' && e.shiftKey) {
                          // Allow Shift+Enter for new lines
                          setTimeout(adjustTextareaHeight, 0);
                        }
                      }}
                      rows={1}
                      style={{ lineHeight: '1.5' }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || sendMessageMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-xl flex-shrink-0"
                      size="lg"
                    >
                      {sendMessageMutation.isPending ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 mt-2 text-center">
                    BAM AIChat can make mistakes. Check important info.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Username Creation Dialog - Mandatory for new users */}
      <Dialog open={showUsernameDialog} onOpenChange={(open) => {
        // Only allow closing if user already has profile (editing scenario)
        if (!open && userProfile) {
          setShowUsernameDialog(false);
          setUsernameError(null);
        }
      }}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {userProfile ? 'Edit Profile' : 'Complete Registration'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {userProfile 
                ? 'Update your BAM AIChat profile information'
                : 'Create your profile to access BAM AIChat features'
              }
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

            <div>
              <label className="text-sm font-medium text-gray-300">Email Address *</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="mt-1 bg-gray-800 border-gray-600 text-white"
              />
              <div className="text-xs text-gray-400 mt-1">
                Required for account security and updates
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300">Country *</label>
              <div className="relative" ref={countryDropdownRef}>
                <Input
                  value={countrySearch}
                  onChange={(e) => {
                    setCountrySearch(e.target.value);
                    setCountry('');
                    setShowCountryDropdown(true);
                  }}
                  onFocus={() => setShowCountryDropdown(true)}
                  placeholder="Search for your country..."
                  className="mt-1 bg-gray-800 border-gray-600 text-white"
                />
                {showCountryDropdown && countrySearch && (
                  <div className="absolute z-10 w-full bg-gray-800 border border-gray-600 rounded-md mt-1 max-h-48 overflow-y-auto">
                    {searchCountries(countrySearch).slice(0, 10).map((c) => (
                      <div
                        key={c.code}
                        className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-white"
                        onClick={() => {
                          setCountry(c.code);
                          setCountrySearch(c.name);
                          setShowCountryDropdown(false);
                        }}
                      >
                        {c.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Required for compliance and regional support
              </div>
            </div>
            {usernameError && (
              <div className="text-red-400 text-sm">{usernameError}</div>
            )}
          </div>
          
          {/* Dialog Footer with buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-700 mt-4">
            {userProfile && (
              <Button
                onClick={() => {
                  setShowUsernameDialog(false);
                  setUsernameError(null);
                }}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={handleCreateUsername}
              disabled={!username.trim() || username.length < 3 || !email.trim() || !country || createUsernameMutation.isPending}
              className={`${userProfile ? 'flex-1' : 'w-full'} bg-purple-600 hover:bg-purple-700`}
            >
              {createUsernameMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                userProfile ? 'Update Profile' : 'Complete Registration'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      {showEditProfileDialog && (
        <Dialog open={showEditProfileDialog} onOpenChange={setShowEditProfileDialog}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                <User className="w-5 h-5 text-purple-400" />
                Edit Profile
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Username</label>
                <Input
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="Enter username"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  maxLength={20}
                  disabled={!canChangeUsername()}
                />
                {canChangeUsername() ? (
                  <div className="text-xs text-gray-500">3-20 characters</div>
                ) : (
                  <div className="text-xs text-amber-400">
                    Username can be changed again in {getDaysUntilUsernameChange()} days ({getNextUsernameChangeDate()?.toLocaleDateString()})
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Display Name (Optional)</label>
                <Input
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder="Enter display name"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  maxLength={50}
                />
                <div className="text-xs text-gray-500">How others see your name</div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Email Address</label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
                <div className="text-xs text-gray-500">For account security and updates</div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Country</label>
                <div className="relative" ref={editCountryDropdownRef}>
                  <Input
                    value={editCountrySearch}
                    onChange={(e) => {
                      setEditCountrySearch(e.target.value);
                      setEditCountry('');
                      setShowEditCountryDropdown(true);
                    }}
                    onFocus={() => setShowEditCountryDropdown(true)}
                    placeholder="Search for your country..."
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  />
                  {showEditCountryDropdown && editCountrySearch && (
                    <div className="absolute z-10 w-full bg-gray-800 border border-gray-600 rounded-md mt-1 max-h-48 overflow-y-auto">
                      {searchCountries(editCountrySearch).slice(0, 10).map((c) => (
                        <div
                          key={c.code}
                          className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-white"
                          onClick={() => {
                            setEditCountry(c.code);
                            setEditCountrySearch(c.name);
                            setShowEditCountryDropdown(false);
                          }}
                        >
                          {c.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">For compliance and regional support</div>
              </div>
              
              {editProfileError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <div className="flex items-start gap-2 text-red-400">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{editProfileError}</span>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setShowEditProfileDialog(false)}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateProfile}
                  disabled={updateProfileMutation.isPending || !editUsername.trim() || (!canChangeUsername() && editUsername !== userProfile?.username)}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                >
                  {updateProfileMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </div>
                  ) : (
                    'Update Profile'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}