import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, Home, Globe, TrendingUp, Briefcase, RefreshCw, Gift, Gamepad2, Crown, Brain } from "lucide-react";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Transparent Navigation Header */}
      <nav className="fixed top-0 w-full z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <img 
                src="/assets/bamToken_1752877645023.png" 
                alt="BAM Token" 
                className="h-10 w-10 rounded-full"
              />
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-yellow-400">BAM</span>
                <span className="text-sm text-gray-300">Ecosystem</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('home')}
                className="text-gray-300 hover:text-yellow-400 transition-colors"
              >
                Home
              </button>
              <button 
                onClick={() => scrollToSection('ecosystem')}
                className="text-gray-300 hover:text-yellow-400 transition-colors"
              >
                Ecosystem
              </button>
              <button 
                onClick={() => scrollToSection('tokenomics')}
                className="text-gray-300 hover:text-yellow-400 transition-colors"
              >
                Tokenomics
              </button>
              <button 
                onClick={() => scrollToSection('projects')}
                className="text-gray-300 hover:text-yellow-400 transition-colors"
              >
                Projects
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-300 hover:text-white"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Full Screen Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden bg-gray-900">
          <div className="flex flex-col h-full p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <img 
                  src="/assets/bamToken_1752877645023.png" 
                  alt="BAM Token" 
                  className="h-8 w-8 rounded-full"
                />
                <div>
                  <span className="text-lg font-bold text-yellow-400">BAM</span>
                  <span className="text-sm text-gray-300 ml-2">Ecosystem</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="flex-1 space-y-1">
              <button 
                onClick={() => {
                  scrollToSection('home');
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full text-left py-4 text-gray-300 hover:text-yellow-400 transition-colors border-b border-gray-700"
              >
                <Home className="w-5 h-5" />
                <span>Home</span>
              </button>
              
              <button 
                onClick={() => {
                  scrollToSection('ecosystem');
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full text-left py-4 text-gray-300 hover:text-yellow-400 transition-colors border-b border-gray-700"
              >
                <Globe className="w-5 h-5" />
                <span>Ecosystem</span>
              </button>
              
              <button 
                onClick={() => {
                  scrollToSection('tokenomics');
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full text-left py-4 text-gray-300 hover:text-yellow-400 transition-colors border-b border-gray-700"
              >
                <TrendingUp className="w-5 h-5" />
                <span>Tokenomics</span>
              </button>
              
              <button 
                onClick={() => {
                  scrollToSection('projects');
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full text-left py-4 text-gray-300 hover:text-yellow-400 transition-colors border-b border-gray-700"
              >
                <Briefcase className="w-5 h-5" />
                <span>Projects</span>
              </button>
              
              <div className="pt-6">
                <div className="text-yellow-400 font-semibold mb-4">Platform Access</div>
                
                <Link href="/swap">
                  <div 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between py-4 text-gray-300 hover:text-yellow-400 transition-colors border-b border-gray-700 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      <span>BAM Swap</span>
                    </div>
                    <span className="bg-gradient-to-r from-green-400 to-green-600 text-black text-xs font-bold px-2 py-1 rounded-full">
                      Live
                    </span>
                  </div>
                </Link>
                
                <Link href="/ai-chat">
                  <div 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between py-4 text-gray-300 hover:text-yellow-400 transition-colors border-b border-gray-700 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      <span>BAM AIGPT</span>
                    </div>
                    <span className="bg-gradient-to-r from-green-400 to-green-600 text-black text-xs font-bold px-2 py-1 rounded-full">
                      Live
                    </span>
                  </div>
                </Link>
                
                <div className="flex items-center justify-between py-4 text-gray-500 border-b border-gray-700">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    <span>BAM Drops</span>
                  </div>
                  <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Soon
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-4 text-gray-500 border-b border-gray-700">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4" />
                    <span>BAM Play 2 Earn</span>
                  </div>
                  <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Soon
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-4 text-gray-500 border-b border-gray-700">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    <span>BAM ApexMiner</span>
                  </div>
                  <span className="bg-gradient-to-r from-green-400 to-green-600 text-black text-xs font-bold px-2 py-1 rounded-full">
                    Live
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-4 text-gray-500">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    <span>BAM VIP Access</span>
                  </div>
                  <span className="bg-gradient-to-r from-green-400 to-green-600 text-black text-xs font-bold px-2 py-1 rounded-full">
                    Live
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}