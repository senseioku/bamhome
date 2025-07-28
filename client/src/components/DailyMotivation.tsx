import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Zap, Target, Crown, Rocket, DollarSign, AlertTriangle, Users, Trophy } from 'lucide-react';

const MOTIVATION_MESSAGES = [
  {
    id: 1,
    emoji: "🚨",
    message: "The biggest DeFi players are moving to BAM. Are you in—or will you be left behind?",
    hashtags: "#BAM #DeFi",
    icon: AlertTriangle,
    color: "red",
    bgGradient: "from-red-500/20 via-orange-500/20 to-yellow-500/20"
  },
  {
    id: 2,
    emoji: "⏳",
    message: "BAM's APY is a ticking bomb. When it blows, only the early believers win.",
    hashtags: "#BAM #YieldFarming",
    icon: Target,
    color: "orange",
    bgGradient: "from-orange-500/20 via-red-500/20 to-pink-500/20"
  },
  {
    id: 3,
    emoji: "🐋",
    message: "Smart money is stacking BAM. The question is—are YOU smart money?",
    hashtags: "#BAM #WhaleAlert",
    icon: TrendingUp,
    color: "blue",
    bgGradient: "from-blue-500/20 via-cyan-500/20 to-teal-500/20"
  },
  {
    id: 4,
    emoji: "🤫",
    message: "They don't want you to know about BAM. But the insiders are already loading up.",
    hashtags: "#BAMAlpha",
    icon: Users,
    color: "purple",
    bgGradient: "from-purple-500/20 via-indigo-500/20 to-blue-500/20"
  },
  {
    id: 5,
    emoji: "⚔️",
    message: "BAM isn't just a token. It's a movement. Which side are you on?",
    hashtags: "#BAMGang",
    icon: Zap,
    color: "yellow",
    bgGradient: "from-yellow-500/20 via-orange-500/20 to-red-500/20"
  },
  {
    id: 6,
    emoji: "🔐",
    message: "VIP slots for BAM's elite tier are filling fast. Will you make the cut?",
    hashtags: "#BAMVIP",
    icon: Crown,
    color: "yellow",
    bgGradient: "from-yellow-500/20 via-amber-500/20 to-orange-500/20"
  },
  {
    id: 7,
    emoji: "📰",
    message: "BAM is the DeFi project that's too big to ignore. The media just doesn't know it yet.",
    hashtags: "#BAM #Next100x",
    icon: TrendingUp,
    color: "green",
    bgGradient: "from-green-500/20 via-emerald-500/20 to-teal-500/20"
  },
  {
    id: 8,
    emoji: "🚀",
    message: "BAM isn't pumping. It's just getting started.",
    hashtags: "#BAM #ToTheMoon",
    icon: Rocket,
    color: "blue",
    bgGradient: "from-blue-500/20 via-purple-500/20 to-pink-500/20"
  },
  {
    id: 9,
    emoji: "💎",
    message: "You had two choices: Buy BAM early or explain why you didn't.",
    hashtags: "#BAM #NoRegrets",
    icon: Trophy,
    color: "cyan",
    bgGradient: "from-cyan-500/20 via-blue-500/20 to-indigo-500/20"
  },
  {
    id: 10,
    emoji: "🔥",
    message: "BAM insiders are quietly accumulating. The question isn't IF it pumps - but WHEN the masses find out.",
    hashtags: "#BAMAlphaLeak",
    icon: AlertTriangle,
    color: "red",
    bgGradient: "from-red-500/20 via-pink-500/20 to-purple-500/20"
  },
  {
    id: 11,
    emoji: "📊",
    message: "95% of traders will miss the BAM rocket. Which group are YOU in?",
    hashtags: "#BAMorRegret",
    icon: TrendingUp,
    color: "green",
    bgGradient: "from-green-500/20 via-teal-500/20 to-cyan-500/20"
  },
  {
    id: 12,
    emoji: "👑",
    message: "BAM VIPs are making more in yields than most make in salaries. The door's still open... for now.",
    hashtags: "#BAMElite",
    icon: Crown,
    color: "yellow",
    bgGradient: "from-yellow-500/20 via-gold-500/20 to-amber-500/20"
  },
  {
    id: 13,
    emoji: "⚡",
    message: "BAM isn't competing with other DEXs - it's REPLACING them.",
    hashtags: "#BAMTakeover",
    icon: Zap,
    color: "purple",
    bgGradient: "from-purple-500/20 via-violet-500/20 to-indigo-500/20"
  },
  {
    id: 14,
    emoji: "⏰",
    message: "The BAM window of opportunity is closing faster than you think. Tick tock.",
    hashtags: "#BAMFOMO",
    icon: Target,
    color: "orange",
    bgGradient: "from-orange-500/20 via-amber-500/20 to-yellow-500/20"
  },
  {
    id: 15,
    emoji: "🎯",
    message: "They called BAM a scam... until the charts shut them up.",
    hashtags: "#BAMProvedThemWrong",
    icon: TrendingUp,
    color: "green",
    bgGradient: "from-green-500/20 via-lime-500/20 to-emerald-500/20"
  },
  {
    id: 16,
    emoji: "💰",
    message: "BAM early adopters vs. BAM skeptics. The wealth gap is forming in real time.",
    hashtags: "#BAMWealthWave",
    icon: DollarSign,
    color: "green",
    bgGradient: "from-green-500/20 via-emerald-500/20 to-teal-500/20"
  },
  {
    id: 17,
    emoji: "🔥",
    message: "BAM isn't just pumping - it's rewriting DeFi rules while it moons.",
    hashtags: "#BAMRevolution",
    icon: Rocket,
    color: "red",
    bgGradient: "from-red-500/20 via-orange-500/20 to-yellow-500/20"
  },
  {
    id: 18,
    emoji: "⚖️",
    message: "One year from now, you'll either be thanking yourself for buying BAM... or explaining why you didn't.",
    hashtags: "#BAMUltimatum",
    icon: Target,
    color: "purple",
    bgGradient: "from-purple-500/20 via-pink-500/20 to-red-500/20"
  },
  {
    id: 19,
    emoji: "🧠",
    message: "Smart money doesn't wait for confirmation. It creates it. BAM is that play.",
    hashtags: "#BAMSmartMoney",
    icon: TrendingUp,
    color: "blue",
    bgGradient: "from-blue-500/20 via-indigo-500/20 to-purple-500/20"
  },
  {
    id: 20,
    emoji: "🏆",
    message: "BAM isn't for everyone. It's for winners.",
    hashtags: "#BAMWinning",
    icon: Trophy,
    color: "yellow",
    bgGradient: "from-yellow-500/20 via-orange-500/20 to-red-500/20"
  }
];

interface DailyMotivationProps {
  onClose: () => void;
}

export const DailyMotivation: React.FC<DailyMotivationProps> = ({ onClose }) => {
  const [currentMessage, setCurrentMessage] = useState<typeof MOTIVATION_MESSAGES[0] | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Get random message
    const randomIndex = Math.floor(Math.random() * MOTIVATION_MESSAGES.length);
    const selectedMessage = MOTIVATION_MESSAGES[randomIndex];
    setCurrentMessage(selectedMessage);
    
    // Show animation
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  if (!currentMessage) return null;

  const IconComponent = currentMessage.icon;

  return (
    <div className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className={`relative max-w-md w-full transform transition-all duration-500 ${
        isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      }`}>
        {/* Main Card */}
        <div className={`relative bg-gradient-to-br ${currentMessage.bgGradient} backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl overflow-hidden`}>
          {/* Animated Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10 pointer-events-none"></div>
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse"></div>
          
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
          >
            <X className="w-4 h-4 text-white/80" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
              <IconComponent className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">Daily Alpha</div>
              <div className="text-sm text-yellow-300">Exclusive Insight</div>
            </div>
          </div>

          {/* Message */}
          <div className="mb-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl" role="img" aria-label="emoji">
                {currentMessage.emoji}
              </span>
              <div>
                <p className="text-white text-base leading-relaxed font-medium mb-2">
                  {currentMessage.message}
                </p>
                <div className="text-yellow-300 text-sm font-semibold">
                  {currentMessage.hashtags}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full bg-white/10 rounded-full h-1">
              <div 
                className="h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full animate-pulse"
                style={{ width: '75%' }}
              ></div>
            </div>
            <div className="text-xs text-white/60 mt-1">Building momentum...</div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Let's Build! 🚀
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition-colors"
            >
              Later
            </button>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="text-xs text-white/50 text-center">
              💡 New alpha drops daily • Join the movement
            </div>
          </div>
        </div>

        {/* Glow Effect */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-2xl blur-xl"></div>
      </div>
    </div>
  );
};

export const useDailyMotivation = () => {
  const [showMotivation, setShowMotivation] = useState(false);

  useEffect(() => {
    // Show random message every time user visits/reloads the page
    const timer = setTimeout(() => {
      setShowMotivation(true);
    }, 3500); // Show after 3.5 seconds (after page loader)

    return () => clearTimeout(timer);
  }, []); // Empty dependency array means this runs on every mount (page visit/reload)

  const hideMotivation = () => {
    setShowMotivation(false);
  };

  return {
    showMotivation,
    hideMotivation,
    DailyMotivationComponent: showMotivation ? (
      <DailyMotivation onClose={hideMotivation} />
    ) : null
  };
};