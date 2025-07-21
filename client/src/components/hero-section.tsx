import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Rocket, TrendingUp, Star, CheckCircle } from "lucide-react";
import { web3Utils } from "@/lib/web3";
import { TOKEN_ADDRESSES } from "@/lib/contracts";
import { useState } from "react";

export default function HeroSection() {
  const [showAddTokenNotification, setShowAddTokenNotification] = useState(false);
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const addBAMTokenToWallet = async () => {
    try {
      const provider = await web3Utils.getProvider();
      if (!provider) {
        alert('Please install MetaMask or another Web3 wallet to add BAM token');
        return;
      }

      const result = await web3Utils.addTokenToWallet(
        TOKEN_ADDRESSES.BAM,
        'BAM',
        18,
        `${window.location.origin}/assets/bamToken_1752877645023.png`
      );
      
      if (result) {
        setShowAddTokenNotification(true);
        setTimeout(() => setShowAddTokenNotification(false), 3000);
      }
    } catch (error: any) {
      console.error('Failed to add BAM token:', error);
      alert('Failed to add BAM token to wallet. Please make sure you have a Web3 wallet installed.');
    }
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center particle-bg overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background opacity-90"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-20 animate-pulse-slow"
             style={{ backgroundColor: 'hsl(45, 90%, 55%, 0.15)' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-20 animate-float"
             style={{ backgroundColor: 'hsl(38, 85%, 50%, 0.15)' }}></div>
        <div className="absolute top-1/2 right-1/3 w-32 h-32 rounded-full opacity-20 animate-pulse-slow"
             style={{ backgroundColor: 'hsl(51, 100%, 65%, 0.15)' }}></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-16">
        <div className="animate-float">
          <div className="flex justify-center mb-8">
            <img 
              src="/assets/bamToken_1752877645023.png" 
              alt="BAM Token Logo" 
              className="h-24 w-24 md:h-32 md:w-32 rounded-full shadow-2xl"
            />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="gradient-text">Build And Multiply</span>
            <br />
            <span className="text-foreground">Wealth Together</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            <span className="text-primary font-semibold">BAM Token—Where Communities Build and Multiply Wealth Together.</span>
            <br />
            Community-driven wealth multiplier on BSC combining staking, DeFi utility, and collective growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="btn-gradient text-white font-semibold text-lg px-8 py-4 rounded-full hover:shadow-lg transition-all duration-300"
              onClick={() => window.open("https://apex.bam-ecosystem.com", "_blank")}
            >
              <Rocket className="mr-2 h-5 w-5" />
              Launch App
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-primary bg-primary/10 text-primary font-semibold text-lg px-8 py-4 rounded-full hover:bg-primary hover:text-white transition-all duration-300"
              onClick={() => scrollToSection("tokenomics")}
            >
              <TrendingUp className="mr-2 h-5 w-5" />
              View Tokenomics
            </Button>
            <Button 
              onClick={addBAMTokenToWallet}
              variant="outline"
              size="sm"
              className="border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 font-medium px-4 py-2 rounded-full transition-all duration-300 text-xs"
            >
              <Star className="mr-1 h-3 w-3" />
              Add BAM Token
            </Button>
          </div>

          {/* Success Notification */}
          {showAddTokenNotification && (
            <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
              <div className="bg-green-500/90 border border-green-400 rounded-lg p-3 backdrop-blur-sm">
                <div className="flex items-center space-x-2 text-white">
                  <CheckCircle className="w-4 h-4" />
                  <div className="text-sm">
                    <div className="font-medium">BAM Token Added!</div>
                    <div className="text-xs opacity-90">Check your wallet assets</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <Card className="glass-card border-border">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">100B</div>
              <div className="text-muted-foreground">Total Supply</div>
            </CardContent>
          </Card>
          <Card className="glass-card border-border">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-secondary mb-2">8+</div>
              <div className="text-muted-foreground">Ecosystem Projects</div>
            </CardContent>
          </Card>
          <Card className="glass-card border-border">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold" style={{ color: "hsl(45, 90%, 55%)" }}>24/7</div>
              <div className="text-muted-foreground">Mining Operations</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
