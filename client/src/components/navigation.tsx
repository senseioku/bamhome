import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Menu, X, Home, Globe, TrendingUp, Briefcase, RefreshCw, Gift, Gamepad2, Crown } from "lucide-react";

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

            {/* Desktop Navigation - Hidden for cleaner look */}
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
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 bg-gray-900 border-gray-700">
                  <div className="flex flex-col space-y-6 mt-8">
                    <div className="flex items-center gap-3 mb-6">
                      <img 
                        src="/assets/bamToken_1752877645023.png" 
                        alt="BAM Token" 
                        className="h-8 w-8 rounded-full"
                      />
                      <div>
                        <span className="text-lg font-bold text-yellow-400">BAM</span>
                        <span className="text-sm text-gray-300 ml-2">Ecosystem</span>
                      </div>
                      <SheetClose asChild>
                        <Button variant="ghost" size="sm" className="ml-auto text-gray-400 hover:text-white">
                          <X className="w-5 h-5" />
                        </Button>
                      </SheetClose>
                    </div>
                    
                    <button 
                      onClick={() => {
                        scrollToSection('home');
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 text-gray-300 hover:text-yellow-400 transition-colors py-3 border-b border-gray-700"
                    >
                      <Home className="w-5 h-5" />
                      <span>Home</span>
                    </button>
                    
                    <button 
                      onClick={() => {
                        scrollToSection('ecosystem');
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 text-gray-300 hover:text-yellow-400 transition-colors py-3 border-b border-gray-700"
                    >
                      <Globe className="w-5 h-5" />
                      <span>Ecosystem</span>
                    </button>
                    
                    <button 
                      onClick={() => {
                        scrollToSection('tokenomics');
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 text-gray-300 hover:text-yellow-400 transition-colors py-3 border-b border-gray-700"
                    >
                      <TrendingUp className="w-5 h-5" />
                      <span>Tokenomics</span>
                    </button>
                    
                    <button 
                      onClick={() => {
                        scrollToSection('projects');
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 text-gray-300 hover:text-yellow-400 transition-colors py-3 border-b border-gray-700"
                    >
                      <Briefcase className="w-5 h-5" />
                      <span>Projects</span>
                    </button>
                    
                    <div className="bg-gray-800 rounded-lg p-4 mt-4">
                      <div className="text-yellow-400 font-semibold mb-3">Platform Access</div>
                      
                      <Link href="/swap">
                        <SheetClose asChild>
                          <div className="flex items-center justify-between py-3 text-gray-300 hover:text-yellow-400 transition-colors border-b border-gray-700">
                            <div className="flex items-center gap-2">
                              <RefreshCw className="w-4 h-4" />
                              <span>BAM Swap</span>
                            </div>
                            <span className="bg-gradient-to-r from-green-400 to-green-600 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                              Live
                            </span>
                          </div>
                        </SheetClose>
                      </Link>
                      
                      <div className="flex items-center justify-between py-3 text-gray-500 border-b border-gray-700">
                        <div className="flex items-center gap-2">
                          <Gift className="w-4 h-4" />
                          <span>BAM Drops</span>
                        </div>
                        <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          Soon
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between py-3 text-gray-500 border-b border-gray-700">
                        <div className="flex items-center gap-2">
                          <Gamepad2 className="w-4 h-4" />
                          <span>BAM Play 2 Earn</span>
                        </div>
                        <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          Soon
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between py-3 text-gray-500 border-b border-gray-700">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4" />
                          <span>BAM ApexMiner</span>
                        </div>
                        <span className="bg-gradient-to-r from-green-400 to-green-600 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                          Live
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between py-3 text-gray-500">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4" />
                          <span>BAM VIP Access</span>
                        </div>
                        <span className="bg-gradient-to-r from-green-400 to-green-600 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                          Live
                        </span>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}