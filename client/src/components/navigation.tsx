import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Menu, X, ArrowLeft, Brain, Sparkles } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActiveRoute = (path: string) => {
    if (path === '/') return location === '/';
    return location.startsWith(path);
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass-card backdrop-blur-xl border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Back to Home */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-gray-300 hover:text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
            <div className="flex items-center gap-3">
              <img 
                src="/assets/bamToken_1752877645023.png" 
                alt="BAM Token" 
                className="h-8 w-8 rounded-full"
              />
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold gradient-text">BAM</span>
                <span className="text-xs text-gray-400">Ecosystem</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <a href="/#home" className="text-gray-300 hover:text-primary transition-colors">Home</a>
            <a href="/#ecosystem" className="text-gray-300 hover:text-primary transition-colors">Ecosystem</a>
            <a href="/#tokenomics" className="text-gray-300 hover:text-primary transition-colors">Tokenomics</a>
            <a href="/#projects" className="text-gray-300 hover:text-primary transition-colors">Projects</a>
            <div className="w-px h-6 bg-gray-600"></div>
            
            {/* BAM AIGPT Link */}
            <Link href="/ai-chat">
              <span className={`transition-colors flex items-center gap-2 ${
                isActiveRoute('/ai-chat') 
                  ? 'text-primary font-medium' 
                  : 'text-gray-300 hover:text-primary'
              }`}>
                <Brain className="w-4 h-4" />
                BAM AIGPT
                <span className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  NEW
                </span>
              </span>
            </Link>

            {/* Current Page Indicator */}
            {isActiveRoute('/swap') && (
              <span className="text-primary font-medium">Swap</span>
            )}
            {isActiveRoute('/ai-chat') && !location.includes('/swap') && (
              <span className="text-primary font-medium">AI Chat</span>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 bg-gray-900 border-gray-700">
                <div className="flex flex-col space-y-4 mt-8">
                  <div className="text-lg font-semibold text-white mb-4">Navigation</div>
                  
                  <a href="/#home" className="text-gray-300 hover:text-primary transition-colors py-2">
                    Home
                  </a>
                  <a href="/#ecosystem" className="text-gray-300 hover:text-primary transition-colors py-2">
                    Ecosystem
                  </a>
                  <a href="/#tokenomics" className="text-gray-300 hover:text-primary transition-colors py-2">
                    Tokenomics
                  </a>
                  <a href="/#projects" className="text-gray-300 hover:text-primary transition-colors py-2">
                    Projects
                  </a>
                  
                  <div className="border-t border-gray-700 my-4"></div>
                  
                  <Link href="/ai-chat">
                    <SheetClose asChild>
                      <div className={`flex items-center gap-3 py-2 transition-colors ${
                        isActiveRoute('/ai-chat') 
                          ? 'text-primary font-medium' 
                          : 'text-gray-300 hover:text-primary'
                      }`}>
                        <Brain className="w-4 h-4" />
                        BAM AIGPT
                        <span className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          NEW
                        </span>
                      </div>
                    </SheetClose>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}