import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Info, Lightbulb, TrendingUp, Shield, Zap, ArrowRight, CheckCircle } from 'lucide-react';

interface LearningTip {
  id: string;
  title: string;
  content: string;
  icon: React.ReactNode;
  category: 'basics' | 'defi' | 'security' | 'trading';
  trigger: string;
  delay?: number;
}

interface ContextualLearningProps {
  trigger?: string;
  onClose?: () => void;
}

const learningTips: LearningTip[] = [
  {
    id: 'wallet-connect',
    title: 'Secure Wallet Connection',
    content: 'We verify wallet ownership through signature verification to protect against unauthorized access and ensure you truly control your wallet.',
    icon: <Shield className="w-5 h-5 text-blue-400" />,
    category: 'security',
    trigger: 'wallet-connect',
    delay: 1000
  },
  {
    id: 'presale-explanation',
    title: 'Presale 3 - Final Opportunity',
    content: 'This is the last presale phase before DEX launch. BAM tokens are priced at $0.0000025 with purchase limits of 5-100 USDT to ensure fair distribution.',
    icon: <TrendingUp className="w-5 h-5 text-yellow-400" />,
    category: 'basics',
    trigger: 'presale-info',
    delay: 500
  },
  {
    id: 'gas-fees',
    title: 'Understanding Gas Fees',
    content: 'Gas fees are network transaction costs on BSC. Our platform optimizes gas usage, but you\'ll need BNB for transaction fees (typically $0.10-0.50).',
    icon: <Zap className="w-5 h-5 text-green-400" />,
    category: 'defi',
    trigger: 'transaction-start',
    delay: 800
  },
  {
    id: 'purchase-limits',
    title: 'One-Time Purchase Limit',
    content: 'Each wallet can purchase BAM tokens only once during presale to ensure fair distribution. Choose your amount carefully (5-100 USDT range).',
    icon: <Info className="w-5 h-5 text-orange-400" />,
    category: 'trading',
    trigger: 'purchase-validation',
    delay: 600
  },
  {
    id: 'price-calculation',
    title: 'Token Price Calculation',
    content: 'BAM price is fixed at $0.0000025 per token. 1 USDT = 400,000 BAM tokens. This rate is guaranteed throughout Presale 3.',
    icon: <Lightbulb className="w-5 h-5 text-purple-400" />,
    category: 'basics',
    trigger: 'price-info',
    delay: 400
  },
  {
    id: 'chainlink-oracle',
    title: 'Real-Time Price Feeds',
    content: 'We use Chainlink oracles for accurate BNB/USD pricing, ensuring you get fair exchange rates for BNB→BAM purchases.',
    icon: <TrendingUp className="w-5 h-5 text-cyan-400" />,
    category: 'defi',
    trigger: 'price-update',
    delay: 1200
  }
];

export const ContextualLearning: React.FC<ContextualLearningProps> = ({ trigger, onClose }) => {
  const [currentTip, setCurrentTip] = useState<LearningTip | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (trigger) {
      const tip = learningTips.find(t => t.trigger === trigger);
      if (tip) {
        const timer = setTimeout(() => {
          setCurrentTip(tip);
          setIsVisible(true);
          setIsAnimating(true);
          
          // Progress animation
          const progressTimer = setInterval(() => {
            setProgress(prev => {
              if (prev >= 100) {
                clearInterval(progressTimer);
                return 100;
              }
              return prev + 2;
            });
          }, 100);

          return () => clearInterval(progressTimer);
        }, tip.delay || 500);

        return () => clearTimeout(timer);
      }
    }
  }, [trigger]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      setCurrentTip(null);
      setProgress(0);
      onClose?.();
    }, 300);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'basics': return 'from-blue-500/20 to-blue-600/10';
      case 'defi': return 'from-green-500/20 to-green-600/10';
      case 'security': return 'from-red-500/20 to-red-600/10';
      case 'trading': return 'from-yellow-500/20 to-yellow-600/10';
      default: return 'from-gray-500/20 to-gray-600/10';
    }
  };

  if (!isVisible || !currentTip) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className={`
        max-w-md w-full glassmorphism border-amber-500/40 
        transform transition-all duration-500 ease-out
        ${isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}
      `}>
        <CardContent className="p-0">
          {/* Header with progress bar */}
          <div className="relative">
            <div className={`bg-gradient-to-r ${getCategoryColor(currentTip.category)} p-4 rounded-t-xl`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {currentTip.icon}
                  <span className="text-sm font-medium text-gray-300 uppercase tracking-wide">
                    {currentTip.category} tip
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="p-1 h-auto text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-700/50 rounded-full h-1 mb-2">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-amber-500 h-1 rounded-full transition-all duration-100 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
              {currentTip.title}
              <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </h3>
            
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              {currentTip.content}
            </p>

            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={handleClose}
                className="text-gray-400 hover:text-white text-sm"
              >
                Got it!
              </Button>
              
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <CheckCircle className="w-3 h-3" />
                <span>Learning tip</span>
              </div>
            </div>
          </div>

          {/* Bottom accent */}
          <div className="h-1 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 rounded-b-xl" />
        </CardContent>
      </Card>
    </div>
  );
};

// Hook for triggering contextual learning
export const useContextualLearning = () => {
  const [activeTrigger, setActiveTrigger] = useState<string | null>(null);

  const showTip = (trigger: string) => {
    setActiveTrigger(trigger);
  };

  const hideTip = () => {
    setActiveTrigger(null);
  };

  return {
    activeTrigger,
    showTip,
    hideTip,
    ContextualLearningComponent: activeTrigger ? (
      <ContextualLearning trigger={activeTrigger} onClose={hideTip} />
    ) : null
  };
};

export default ContextualLearning;