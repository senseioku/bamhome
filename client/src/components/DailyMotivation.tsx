import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Zap, Target, Crown, Rocket, DollarSign, AlertTriangle, Users, Trophy, Coffee, Shield, Brain, Timer, Hammer, Twitter } from 'lucide-react';

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
  // Aggressive Crypto Motivation Series
  {
    id: 20,
    emoji: "🔥",
    message: "While you're sleeping, someone else is buying the dip. While you're doubting, someone else is BUILDING WEALTH. The crypto market doesn't wait for the weak. WAKE UP, STACK SATS, AND DOMINATE!",
    hashtags: "#WakeUpAndDominate #BAM",
    icon: Zap,
    color: "red",
    bgGradient: "from-red-500/20 via-orange-500/20 to-yellow-500/20"
  },
  {
    id: 21,
    emoji: "⚡",
    message: "Stop making excuses about 'not having enough money' for crypto. You have money for coffee, Netflix, and takeout, but not for your FREEDOM? Cut the BS and start building your portfolio TODAY!",
    hashtags: "#NoExcusesOnlyResults #BAM",
    icon: Coffee,
    color: "orange",
    bgGradient: "from-orange-500/20 via-red-500/20 to-pink-500/20"
  },
  {
    id: 22,
    emoji: "🛡️",
    message: "Fear keeps you poor while courage makes you RICH. Every red candle is an opportunity, every crash is a GIFT. While others panic sell, YOU buy and hold like a SAVAGE!",
    hashtags: "#FearIsTheMindKiller #BAM",
    icon: Shield,
    color: "purple",
    bgGradient: "from-purple-500/20 via-indigo-500/20 to-blue-500/20"
  },
  {
    id: 23,
    emoji: "💎",
    message: "Paper hands create REGRET. Diamond hands create GENERATIONAL WEALTH. Your future self is either thanking you or cursing you for the decisions you make TODAY. HOLD LIKE YOUR LIFE DEPENDS ON IT!",
    hashtags: "#DiamondHandsOnly #BAM",
    icon: Trophy,
    color: "cyan",
    bgGradient: "from-cyan-500/20 via-blue-500/20 to-indigo-500/20"
  },
  {
    id: 24,
    emoji: "⏱️",
    message: "Every day you wait is another day closer to missing the next 100x. While you're 'researching' and overthinking, the train is LEAVING THE STATION. Stop being a spectator, START BEING A PLAYER!",
    hashtags: "#TimeIsYourEnemy #BAM",
    icon: Timer,
    color: "red",
    bgGradient: "from-red-500/20 via-pink-500/20 to-purple-500/20"
  },
  {
    id: 25,
    emoji: "🚨",
    message: "Staying in your comfort zone with fiat is FINANCIAL SUICIDE. Inflation is eating your money alive while crypto creates MILLIONAIRES. Get uncomfortable or stay BROKE forever!",
    hashtags: "#ComfortZoneIsDangerZone #BAM",
    icon: AlertTriangle,
    color: "yellow",
    bgGradient: "from-yellow-500/20 via-orange-500/20 to-red-500/20"
  },
  {
    id: 26,
    emoji: "🦈",
    message: "Small fish get eaten, SHARKS rule the ocean. Stop thinking in pennies, start thinking in PERCENTAGES. 1000% gains don't happen to people who play it safe. BE RUTHLESS!",
    hashtags: "#ThinkLikeAShark #BAM",
    icon: TrendingUp,
    color: "blue",
    bgGradient: "from-blue-500/20 via-cyan-500/20 to-teal-500/20"
  },
  {
    id: 27,
    emoji: "🧠",
    message: "Poor mindset = Poor portfolio. Rich mindset = Rich portfolio. Stop thinking like a victim, start thinking like a PREDATOR. The market rewards the bold, not the TIMID!",
    hashtags: "#YourMindsetIsYourWealth #BAM",
    icon: Brain,
    color: "purple",
    bgGradient: "from-purple-500/20 via-violet-500/20 to-indigo-500/20"
  },
  {
    id: 28,
    emoji: "🍽️",
    message: "Every dollar you spend on garbage today is a THOUSAND dollars you won't have tomorrow. Stop living paycheck to paycheck, start living CRYPTO to CRYPTO!",
    hashtags: "#SacrificeTodayFeastTomorrow #BAM",
    icon: DollarSign,
    color: "green",
    bgGradient: "from-green-500/20 via-emerald-500/20 to-teal-500/20"
  },
  {
    id: 29,
    emoji: "👑",
    message: "99% of people will never understand crypto. 99% will stay poor. YOU have the opportunity to be the 1% that gets it. Don't waste it being AVERAGE!",
    hashtags: "#BeThe1Percent #BAM",
    icon: Crown,
    color: "yellow",
    bgGradient: "from-yellow-500/20 via-amber-500/20 to-orange-500/20"
  },
  {
    id: 30,
    emoji: "⚔️",
    message: "Discipline in DCA creates FINANCIAL FREEDOM. Discipline in HODLING creates WEALTH. Discipline separates the winners from the whiners. BE DISCIPLINED OR BE BROKE!",
    hashtags: "#DisciplineEqualsFredom #BAM",
    icon: Target,
    color: "blue",
    bgGradient: "from-blue-500/20 via-indigo-500/20 to-purple-500/20"
  },
  {
    id: 31,
    emoji: "⚡",
    message: "Ideas without ACTION are worthless. You can spend 10 years 'learning' about crypto or 10 minutes BUYING your first coin. Stop planning, START EXECUTING!",
    hashtags: "#SpeedOfImplementation #BAM",
    icon: Zap,
    color: "orange",
    bgGradient: "from-orange-500/20 via-yellow-500/20 to-red-500/20"
  },
  {
    id: 32,
    emoji: "🎲",
    message: "The biggest risk is NOT taking any risk. Playing it safe is playing it POOR. You weren't born to be mediocre - you were born to be LEGENDARY!",
    hashtags: "#RiskItForTheBiscuit #BAM",
    icon: Target,
    color: "red",
    bgGradient: "from-red-500/20 via-orange-500/20 to-yellow-500/20"
  },
  {
    id: 33,
    emoji: "🌙",
    message: "While you sleep, the crypto market is making millionaires in Asia. While you work your 9-5, DeFi is generating passive income. Your money should work HARDER than you do!",
    hashtags: "#MoneyNeverSleeps #BAM",
    icon: Rocket,
    color: "purple",
    bgGradient: "from-purple-500/20 via-pink-500/20 to-red-500/20"
  },
  {
    id: 34,
    emoji: "🐑",
    message: "Everyone is buying stocks and bonds like it's 1995. YOU'RE buying the future. Separate yourself from the herd or get SLAUGHTERED with them!",
    hashtags: "#SeparateYourself #BAM",
    icon: Users,
    color: "blue",
    bgGradient: "from-blue-500/20 via-cyan-500/20 to-teal-500/20"
  },
  {
    id: 35,
    emoji: "📈",
    message: "Compound interest is the 8th wonder of the world. Compound crypto gains are the 9th. Every day you're not compounding is a day you're LOSING to someone who is!",
    hashtags: "#CompoundOrDie #BAM",
    icon: TrendingUp,
    color: "green",
    bgGradient: "from-green-500/20 via-lime-500/20 to-emerald-500/20"
  },
  {
    id: 36,
    emoji: "👶",
    message: "This isn't about quick gains, this is about GENERATIONAL WEALTH. Your grandchildren will either thank you for being early or question why you were LATE to the biggest wealth transfer in history!",
    hashtags: "#ThinkGenerational #BAM",
    icon: Crown,
    color: "gold",
    bgGradient: "from-yellow-500/20 via-amber-500/20 to-orange-500/20"
  },
  {
    id: 37,
    emoji: "🐻",
    message: "Bear markets create MILLIONAIRES, bull markets reveal them. While others retreat, you ATTACK. While others cry, you BUY. Stay in attack mode ALWAYS!",
    hashtags: "#AttackModeAlways #BAM",
    icon: Hammer,
    color: "red",
    bgGradient: "from-red-500/20 via-pink-500/20 to-purple-500/20"
  },
  {
    id: 38,
    emoji: "🌍",
    message: "While you're making excuses, a 20-year-old in Singapore just made their first million in crypto. Your competition isn't local anymore - it's GLOBAL. Step up or step aside!",
    hashtags: "#YourCompetitionIsGlobal #BAM",
    icon: Users,
    color: "cyan",
    bgGradient: "from-cyan-500/20 via-blue-500/20 to-indigo-500/20"
  },
  {
    id: 39,
    emoji: "🏆",
    message: "You have two choices: Be remembered as the person who talked about crypto, or the person who ACTED on it. Your legacy starts with your next trade. MAKE IT COUNT!",
    hashtags: "#LegacyModeActivated #BAM",
    icon: Trophy,
    color: "gold",
    bgGradient: "from-yellow-500/20 via-gold-500/20 to-amber-500/20"
  },
  {
    id: 40,
    emoji: "🔬",
    message: "DYOR (Do Your Own Research) but don't let research become PARALYSIS. Knowledge without action is just expensive entertainment. Research smart, act SMARTER!",
    hashtags: "#ResearchSmartActSmarter #BAM",
    icon: Brain,
    color: "purple",
    bgGradient: "from-purple-500/20 via-violet-500/20 to-indigo-500/20"
  },
  // Brutally Savage Crypto Motivation Series
  {
    id: 41,
    emoji: "💀",
    message: "Bitcoin went from $1 to $69,000 and you MISSED IT. ETH went from $8 to $4,800 and you WATCHED. How many more lifechanging opportunities will you let slip through your fingers while you 'wait for the perfect moment'? THE PERFECT MOMENT WAS YESTERDAY!",
    hashtags: "#RealityCheck #BAM #YoureRunningOutOfTime",
    icon: Timer,
    color: "red",
    bgGradient: "from-red-600/30 via-red-500/20 to-orange-500/20"
  },
  {
    id: 42,
    emoji: "☠️",
    message: "Your broke friends telling you crypto is 'too risky' are the same people working dead-end jobs and complaining about rent. Stop taking financial advice from people who are FINANCIALLY FAILED. Surround yourself with winners or stay a LOSER!",
    hashtags: "#YourBrokeFriendsArePoison #BAM",
    icon: Users,
    color: "red",
    bgGradient: "from-red-500/20 via-pink-500/20 to-purple-500/20"
  },
  {
    id: 43,
    emoji: "🎭",
    message: "You choose mediocrity every time you pick Netflix over researching altcoins. You choose poverty every time you buy Starbucks instead of stacking crypto. Your life is the SUM of your choices - and right now, your choices SUCK!",
    hashtags: "#MediocrityIsAChoice #BAM",
    icon: Target,
    color: "orange",
    bgGradient: "from-orange-500/20 via-red-500/20 to-pink-500/20"
  },
  {
    id: 44,
    emoji: "⚔️",
    message: "The crypto market is a GLADIATOR ARENA. The weak get liquidated, the strong get RICH. Every pump separates the prepared from the unprepared. Every dump separates the believers from the PRETENDERS. Which are you?",
    hashtags: "#TheWeakGetLiquidated #BAM #GladiatorArena",
    icon: Hammer,
    color: "red",
    bgGradient: "from-red-600/30 via-orange-500/20 to-yellow-500/20"
  },
  {
    id: 45,
    emoji: "⛓️",
    message: "Your boss got rich while you traded your TIME for pennies. You're making SOMEONE ELSE wealthy while your own portfolio looks pathetic. Every hour at that job is an hour NOT building your crypto empire. WAKE UP, SLAVE!",
    hashtags: "#Your9to5IsFinancialPrison #BAM #WakeUpSlave",
    icon: AlertTriangle,
    color: "red",
    bgGradient: "from-red-500/20 via-orange-500/20 to-yellow-500/20"
  },
  {
    id: 46,
    emoji: "🤡",
    message: "'I can't afford crypto' - Meanwhile you spent $200 this month on subscriptions you barely use. Stop being a VICTIM of your own bad financial decisions. You're not broke, you're just STUPID with money!",
    hashtags: "#StopBeingAVictim #BAM #StupidWithMoney",
    icon: DollarSign,
    color: "orange",
    bgGradient: "from-orange-500/20 via-red-500/20 to-pink-500/20"
  },
  {
    id: 47,
    emoji: "🐺",
    message: "Following the crowd got you NOWHERE. When everyone said crypto was dead at $3,200 Bitcoin, that was your chance to buy GENERATIONAL wealth. Stop following sheep to the slaughter, BE THE WOLF!",
    hashtags: "#TheHerdGetsSlaughtered #BAM #BeTheWolf",
    icon: Users,
    color: "blue",
    bgGradient: "from-blue-500/20 via-cyan-500/20 to-teal-500/20"
  },
  {
    id: 48,
    emoji: "👴",
    message: "Your parents told you to 'get a good job and save money in the bank.' Look how that worked out - they're still working at 65! Their financial advice created their financial PRISON. Break the cycle or repeat their MISTAKES!",
    hashtags: "#YourParentsWereWrong #BAM #BreakTheCycle",
    icon: Shield,
    color: "purple",
    bgGradient: "from-purple-500/20 via-indigo-500/20 to-blue-500/20"
  },
  {
    id: 49,
    emoji: "🗡️",
    message: "You want gentle advice? Go to a therapist. You want life-changing wealth? EMBRACE THE BRUTALITY of crypto volatility. Soft people make soft money. Hard people make STUPID money. Which are you?",
    hashtags: "#SoftPeopleMakeSoftMoney #BAM #EmbraceTheBrutality",
    icon: Zap,
    color: "red",
    bgGradient: "from-red-600/30 via-pink-500/20 to-purple-500/20"
  },
  {
    id: 50,
    emoji: "⚰️",
    message: "'I'll buy when it dips more' - It pumped 500%. 'I'll wait for regulation' - You missed the 10x. 'I need to research more' - Analysis paralysis killed your wealth. You're not dying from bad investments, you're dying from NO INVESTMENTS!",
    hashtags: "#DeathByAThousandExcuses #BAM #AnalysisParalysis",
    icon: Brain,
    color: "red",
    bgGradient: "from-red-500/20 via-orange-500/20 to-yellow-500/20"
  },
  {
    id: 51,
    emoji: "🔥",
    message: "The same people laughing at your crypto 'gambling' are the ones who will beg you for loans in 5 years. Remember their faces when they called you crazy - because they'll be the same faces asking for HANDOUTS when you're financially free!",
    hashtags: "#SavageTruth #BAM #RememberTheirFaces",
    icon: Trophy,
    color: "gold",
    bgGradient: "from-yellow-500/20 via-orange-500/20 to-red-500/20"
  },
  {
    id: 52,
    emoji: "💸",
    message: "In 10 years, there will be two types of people: Those who understood crypto and got rich, and those who didn't and stayed POOR. The choice is yours, but the window is CLOSING. Stop reading motivational quotes and START BUYING THE FUTURE!",
    hashtags: "#FinalBrutalReality #BAM #BuyTheFuture #WindowIsClosing",
    icon: Rocket,
    color: "red",
    bgGradient: "from-red-600/30 via-orange-500/20 to-yellow-500/20"
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

interface BamHolderData {
  holderCount: number;
  isEstimate?: boolean;
  source?: string;
  lastUpdated: string;
}

export const DailyMotivation: React.FC<DailyMotivationProps> = ({ onClose }) => {
  const [currentMessage, setCurrentMessage] = useState<typeof MOTIVATION_MESSAGES[0] | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [bamHolderData, setBamHolderData] = useState<BamHolderData | null>(null);

  // Fetch BAM holder data
  const fetchBAMHolderData = async () => {
    try {
      const response = await fetch('/api/bam/holders');
      const data = await response.json();
      
      if (data.success) {
        setBamHolderData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch BAM holder data:', error);
    }
  };

  useEffect(() => {
    // Get random message
    const randomIndex = Math.floor(Math.random() * MOTIVATION_MESSAGES.length);
    const selectedMessage = MOTIVATION_MESSAGES[randomIndex];
    setCurrentMessage(selectedMessage);
    
    // Fetch holder data
    fetchBAMHolderData();
    
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
    <div className={`fixed inset-0 z-[10000] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm transition-all duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className={`relative max-w-sm w-full transform transition-all duration-500 ${
        isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      }`}>
        {/* Main Card - Compact */}
        <div className={`relative bg-gradient-to-br ${currentMessage.bgGradient} backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-2xl overflow-hidden`}>
          {/* Animated Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10 pointer-events-none"></div>
          <div className="absolute -top-6 -right-6 w-12 h-12 bg-white/10 rounded-full blur-lg animate-pulse"></div>
          
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
          >
            <X className="w-3 h-3 text-white/80" />
          </button>

          {/* Header - Compact */}
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
              <IconComponent className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Daily Alpha</div>
              <div className="text-xs text-yellow-300">Exclusive Insight</div>
            </div>
          </div>

          {/* Message - Compact */}
          <div className="mb-3">
            <div className="flex items-start gap-2">
              <span className="text-lg flex-shrink-0" role="img" aria-label="emoji">
                {currentMessage.emoji}
              </span>
              <div className="min-w-0">
                <p className="text-white text-sm leading-snug font-medium mb-1">
                  {currentMessage.message}
                </p>
                <div className="text-yellow-300 text-xs font-semibold">
                  {currentMessage.hashtags}
                </div>
              </div>
            </div>
          </div>

          {/* BAM Holder Data Section - Ultra Compact */}
          {bamHolderData && (
            <div className="mb-3 p-1.5 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg border border-green-500/30">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3 text-green-400 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold text-white">BAM Community</span>
                    <div className="text-xs text-green-200">
                      Growing community strength
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-400 leading-none">
                    {bamHolderData.holderCount.toLocaleString()}+
                  </div>
                  <div className="text-xs text-green-300">
                    {bamHolderData.isEstimate ? 'Est. Holders' : 'Active Holders'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons - Compact */}
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="flex-1 py-2 px-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold rounded-lg transition-all duration-200 text-sm"
            >
              Let's Build! 🚀
            </button>
            <button
              onClick={handleClose}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition-colors text-sm"
            >
              Close
            </button>
          </div>

          {/* Social Link Footer */}
          <div className="mt-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-center">
              <a
                href="https://x.com/bamecosystem"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs transition-colors group"
              >
                <Twitter className="w-3 h-3 group-hover:scale-110 transition-transform" />
                <span>Follow @bamecosystem</span>
              </a>
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