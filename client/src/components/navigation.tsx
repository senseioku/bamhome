import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Menu, X, Home, Globe, TrendingUp, Briefcase, RefreshCw, Gift, Gamepad2, Crown, Brain, BarChart3 } from "lucide-react";

export default function Navigation() {
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

            {/* Mobile Navigation */}
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6 text-gray-300" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="!w-screen !h-screen p-0 bg-gray-900 border-0 !max-w-none !inset-0 !fixed !top-0 !left-0 !right-0 !bottom-0 sm:!w-80 !z-[9999]" style={{width: '100vw', height: '100vh', minHeight: '100vh'}}>
                  <div className="flex flex-col w-screen bg-gray-900/98 backdrop-blur-sm relative z-[10000] !fixed !inset-0 overflow-hidden" style={{width: '100vw', height: '100vh', minHeight: '100vh'}}>
                    {/* Compact Header */}
                    <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800/50 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <img 
                          src="/assets/bamToken_1752877645023.png" 
                          alt="BAM Token" 
                          className="h-4 w-4 rounded-full"
                        />
                        <div>
                          <span className="text-xs font-bold text-yellow-400">BAM</span>
                          <span className="text-xs text-gray-400 ml-1">Ecosystem</span>
                        </div>
                      </div>
                      <SheetClose className="text-gray-400 hover:text-white p-1">
                        <X className="w-4 h-4" />
                      </SheetClose>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto">
                      {/* Navigation Items */}
                      <div className="py-1">
                        <a href="/#home" className="flex items-center gap-3 w-full px-4 py-2.5 text-gray-300 hover:text-white hover:bg-gray-800/70 transition-colors border-b border-gray-800/30">
                          <Home className="w-4 h-4" />
                          <span className="text-sm font-medium">Home</span>
                        </a>
                        <a href="/#ecosystem" className="flex items-center gap-3 w-full px-4 py-2.5 text-gray-300 hover:text-white hover:bg-gray-800/70 transition-colors border-b border-gray-800/30">
                          <Globe className="w-4 h-4" />
                          <span className="text-sm font-medium">Ecosystem</span>
                        </a>
                        <a href="/#tokenomics" className="flex items-center gap-3 w-full px-4 py-2.5 text-gray-300 hover:text-white hover:bg-gray-800/70 transition-colors border-b border-gray-800/30">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-sm font-medium">Tokenomics</span>
                        </a>
                        <a href="/#projects" className="flex items-center gap-3 w-full px-4 py-2.5 text-gray-300 hover:text-white hover:bg-gray-800/70 transition-colors border-b border-gray-800/30">
                          <Briefcase className="w-4 h-4" />
                          <span className="text-sm font-medium">Projects</span>
                        </a>
                      </div>

                      {/* Platform Access Section */}
                      <div className="border-t border-gray-700 bg-gray-800/30">
                        <div className="px-4 py-2">
                          <div className="text-xs font-semibold text-yellow-400">Platform Access</div>
                        </div>
                        <div className="pb-2">
                          <a
                            href="/swap"
                            className="flex items-center justify-between w-full px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800/70 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <RefreshCw className="w-4 h-4" />
                              <span className="text-sm font-medium">BAM Swap</span>
                            </div>
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Live</span>
                          </a>
                          <a
                            href="/ai-chat"
                            className="flex items-center justify-between w-full px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800/70 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Brain className="w-4 h-4" />
                              <span className="text-sm font-medium">BAM AIChat</span>
                            </div>
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Live</span>
                          </a>
                          <a
                            href="/tx-visualizer"
                            className="flex items-center justify-between w-full px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800/70 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <BarChart3 className="w-4 h-4" />
                              <span className="text-sm font-medium">TX Story Visualizer</span>
                            </div>
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">New</span>
                          </a>
                          <a
                            href="/#projects"
                            className="flex items-center justify-between w-full px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800/70 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Gift className="w-4 h-4" />
                              <span className="text-sm font-medium">BAM Drops</span>
                            </div>
                            <span className="text-xs bg-purple-600/50 text-purple-400 px-2 py-0.5 rounded-full">Soon</span>
                          </a>
                          <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); }}
                            className="flex items-center justify-between w-full px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800/70 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Gamepad2 className="w-4 h-4" />
                              <span className="text-sm font-medium">BAM Play 2 Earn</span>
                            </div>
                            <span className="text-xs bg-purple-600/50 text-purple-400 px-2 py-0.5 rounded-full">Soon</span>
                          </a>
                          <a
                            href="https://apex.bam-ecosystem.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between w-full px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800/70 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Crown className="w-4 h-4" />
                              <span className="text-sm font-medium">BAM ApexMiner</span>
                            </div>
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Live</span>
                          </a>
                          <a
                            href="https://vip.bam-ecosystem.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between w-full px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800/70 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Crown className="w-4 h-4" />
                              <span className="text-sm font-medium">BAM VIP Access</span>
                            </div>
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Live</span>
                          </a>
                        </div>
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