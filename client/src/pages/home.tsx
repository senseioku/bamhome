import { useState, useEffect } from "react";
import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import EcosystemOverview from "@/components/ecosystem-overview";
import TokenomicsSection from "@/components/tokenomics-section";
import ProjectsSection from "@/components/projects-section";
import RoadmapSection from "@/components/roadmap-section";
import CTASection from "@/components/cta-section";
import Footer from "@/components/footer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Rocket, Zap, Star, TrendingUp, Gamepad2, Crown } from "lucide-react";

export default function Home() {
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  // Show announcement modal on first visit (with session storage to not spam)
  useEffect(() => {
    const hasSeenAnnouncement = sessionStorage.getItem('bam-announcement-seen-v3');
    if (!hasSeenAnnouncement) {
      const timer = setTimeout(() => {
        setShowAnnouncement(true);
      }, 1500); // Show after 1.5 seconds for better UX
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseAnnouncement = () => {
    setShowAnnouncement(false);
    // Update session storage key to force showing the updated announcement
    sessionStorage.setItem('bam-announcement-seen-v3', 'true');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <HeroSection />
      <EcosystemOverview />
      <TokenomicsSection />
      <ProjectsSection />
      <RoadmapSection />
      <CTASection />
      <Footer />
      
      {/* Announcement Modal */}
      <Dialog open={showAnnouncement} onOpenChange={(open) => !open && handleCloseAnnouncement()}>
        <DialogContent className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border-2 border-amber-500/30 text-white max-w-[95vw] sm:max-w-md mx-auto rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="relative">
            <Button
              onClick={handleCloseAnnouncement}
              variant="ghost"
              size="sm"
              className="absolute -top-2 -right-2 h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
            <DialogTitle className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Rocket className="h-6 w-6 text-amber-400 animate-pulse" />
                <span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  MAJOR BAM ECOSYSTEM UPDATE!
                </span>
                <Rocket className="h-6 w-6 text-amber-400 animate-pulse" />
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 px-1">
            {/* Revolution Header */}
            <div className="text-center">
              <h3 className="text-lg font-bold text-amber-400 mb-3">
                The Revolution is HERE!
              </h3>
            </div>

            {/* Coming Soon Section */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-5 w-5 text-amber-400" />
                <span className="font-semibold text-amber-400">COMING SOON:</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>BAM Staking LIVE</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>Play & Earn Games Launch</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>Elite IT Development Team Onboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>Global Marketing Blitz</span>
                </div>
              </div>
            </div>

            {/* Liquidity Injection */}
            <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg p-4 border border-green-500/30">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                <span className="font-bold text-green-400">💰 LIQUIDITY INJECTION ACTIVE!</span>
              </div>
              <p className="text-sm text-gray-200">
                Check your Trading & News sections NOW to see real income flowing in!
              </p>
            </div>

            {/* BAMers Playground Play & Earn */}
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 border border-blue-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Gamepad2 className="h-5 w-5 text-blue-400" />
                <span className="font-bold text-blue-400">🎮 BAMers Playground Play & Earn (Beta)</span>
              </div>
              <p className="text-sm text-gray-200">
                The ultimate gaming experience is now LIVE! Start earning while you play!
              </p>
            </div>

            {/* BAM Staking Live */}
            <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-lg p-4 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-purple-400" />
                <span className="font-bold text-purple-400">👑 BAM Staking Live in VIP Lounge</span>
              </div>
              <p className="text-sm text-gray-200">
                Exclusive staking rewards are now available! Join the VIP Lounge and maximize your earnings.
              </p>
            </div>

            {/* ApexMiner Update */}
            <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 rounded-lg p-4 border border-orange-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-orange-400" />
                <span className="font-bold text-orange-400">📢 APEXMINER UPDATE⚠️</span>
              </div>
              <p className="text-sm text-gray-200">
                ❌ Plan 3 entries will soon retire while those activated continues to enjoy until max capping reached.
              </p>
            </div>

            {/* Main Message */}
            <div className="text-center bg-gray-800/30 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="h-5 w-5 text-amber-400" />
                <span className="font-bold text-amber-400">We're not just building - We're MULTIPLYING!</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed mb-3">
                The BAM Ecosystem is evolving into something EXTRAORDINARY. While you enjoy current benefits, 
                our team is working 24/7 behind the scenes to deliver next-level features that will change everything!
              </p>
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-4 py-1">
                ⚡ Stay Active. Stay Ready. BIG things coming!
              </Badge>
            </div>

            {/* Hashtags */}
            <div className="text-center text-xs text-gray-400 space-y-1">
              <div className="flex flex-wrap justify-center gap-2">
                <span className="text-amber-400">#BAMEcosystem</span>
                <span className="text-amber-400">#BuildAndMultiply</span>
                <span className="text-amber-400">#CryptoRevolution</span>
              </div>
              <p className="italic text-amber-400 mt-3 font-medium">
                *The wait will be worth it! 🔥*
              </p>
            </div>

            {/* Action Button */}
            <div className="text-center pt-2">
              <Button
                onClick={handleCloseAnnouncement}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold px-8 py-2 rounded-full shadow-lg transform transition-all duration-200 hover:scale-105"
              >
                Let's Build Together!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
