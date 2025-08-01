import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, TrendingUp, Brain, Sparkles } from "lucide-react";

export default function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <img 
              src="/assets/bamToken_1752877645023.png" 
              alt="BAM Token" 
              className="h-10 w-10 rounded-full"
            />
            <div>
              <div className="text-xl font-bold text-white">BAM</div>
              <div className="text-xs text-gray-400 -mt-1">Ecosystem</div>
            </div>
          </Link>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/swap">
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                <RefreshCw className="w-4 h-4 mr-2" />
                BAM Swap
              </Button>
            </Link>
            <Link href="/ai-chat">
              <Button variant="ghost" className="text-gray-300 hover:text-white relative">
                <Brain className="w-4 h-4 mr-2" />
                BAM AIGPT
                <Badge className="ml-2 bg-purple-600 text-white text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  NEW
                </Badge>
              </Button>
            </Link>
          </div>

          {/* Mobile Navigation - Simple */}
          <div className="md:hidden flex items-center space-x-2">
            <Link href="/swap">
              <Button size="sm" variant="ghost" className="text-gray-300">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/ai-chat">
              <Button size="sm" variant="ghost" className="text-gray-300 relative">
                <Brain className="w-4 h-4" />
                <Badge className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs px-1">
                  AI
                </Badge>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}