import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles } from "lucide-react";

export default function Navigation() {
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

          {/* Mobile Navigation - Simple placeholder */}
          <div className="md:hidden">
          </div>
        </div>
      </div>
    </nav>
  );
}