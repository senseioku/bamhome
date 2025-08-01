import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Menu, Brain, Sparkles, Home, Globe, TrendingUp, Briefcase } from "lucide-react";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 glass-card backdrop-blur-xl border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <img 
              src="/assets/bamToken_1752877645023.png" 
              alt="BAM Token" 
              className="h-8 w-8 rounded-full"
            />
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold gradient-text">BAM</span>
              <span className="text-xs text-gray-400">Ecosystem</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <a href="/#home" className="text-gray-300 hover:text-primary transition-colors">Home</a>
            <a href="/#ecosystem" className="text-gray-300 hover:text-primary transition-colors">Ecosystem</a>
            <a href="/#tokenomics" className="text-gray-300 hover:text-primary transition-colors">Tokenomics</a>
            <a href="/#projects" className="text-gray-300 hover:text-primary transition-colors">Projects</a>
            <div className="w-px h-6 bg-gray-600"></div>
            
            {/* BAM AIGPT Link */}
            <Link href="/ai-chat">
              <span className="text-gray-300 hover:text-primary transition-colors flex items-center gap-2">
                <Brain className="w-4 h-4" />
                BAM AIGPT
                <span className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  NEW
                </span>
              </span>
            </Link>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-gray-900 border-gray-700">
                <div className="flex flex-col space-y-6 mt-8">
                  <div className="text-lg font-semibold text-white mb-4">BAM Ecosystem</div>
                  
                  <a href="/#home" className="flex items-center gap-3 text-gray-300 hover:text-primary transition-colors py-3 border-b border-gray-700">
                    <Home className="w-5 h-5" />
                    <span>Home</span>
                  </a>
                  
                  <a href="/#ecosystem" className="flex items-center gap-3 text-gray-300 hover:text-primary transition-colors py-3 border-b border-gray-700">
                    <Globe className="w-5 h-5" />
                    <span>Ecosystem</span>
                  </a>
                  
                  <a href="/#tokenomics" className="flex items-center gap-3 text-gray-300 hover:text-primary transition-colors py-3 border-b border-gray-700">
                    <TrendingUp className="w-5 h-5" />
                    <span>Tokenomics</span>
                  </a>
                  
                  <a href="/#projects" className="flex items-center gap-3 text-gray-300 hover:text-primary transition-colors py-3 border-b border-gray-700">
                    <Briefcase className="w-5 h-5" />
                    <span>Projects</span>
                  </a>
                  
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="text-yellow-400 font-semibold mb-2">Platform Access</div>
                    
                    <Link href="/swap">
                      <SheetClose asChild>
                        <div className="flex items-center justify-between py-3 text-gray-300 hover:text-primary transition-colors border-b border-gray-700">
                          <span>BAM Swap</span>
                          <span className="bg-gradient-to-r from-green-400 to-green-600 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                            Live
                          </span>
                        </div>
                      </SheetClose>
                    </Link>
                    
                    <div className="flex items-center justify-between py-3 text-gray-500 border-b border-gray-700">
                      <span>BAM Drops</span>
                      <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        Soon
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between py-3 text-gray-500 border-b border-gray-700">
                      <span>BAM Play 2 Earn</span>
                      <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        Soon
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between py-3 text-gray-500 border-b border-gray-700">
                      <span>BAM ApexMiner</span>
                      <span className="bg-gradient-to-r from-green-400 to-green-600 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                        Live
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between py-3 text-gray-500 border-b border-gray-700">
                      <span>BAM VIP Access</span>
                      <span className="bg-gradient-to-r from-green-400 to-green-600 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                        Live
                      </span>
                    </div>
                    
                    <Link href="/ai-chat">
                      <SheetClose asChild>
                        <div className="flex items-center justify-between py-3 text-gray-300 hover:text-primary transition-colors">
                          <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4" />
                            <span>BAM AIGPT</span>
                          </div>
                          <span className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            NEW
                          </span>
                        </div>
                      </SheetClose>
                    </Link>
                  </div>
                  
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <Button
                      onClick={() => window.open("https://apex.bam-ecosystem.com", "_blank")}
                      className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold"
                    >
                      Connect Wallet
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}