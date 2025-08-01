import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, X, Home, RefreshCw, Brain, Sparkles, TrendingUp } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'BAM Swap', href: '/swap', icon: RefreshCw },
    { name: 'BAM AIGPT', href: '/ai-chat', icon: Brain, isNew: true },
  ];

  const isActiveRoute = (href: string) => {
    if (href === '/') {
      return location === '/';
    }
    return location.startsWith(href);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <img 
              src="/assets/bamToken_1752877645023.png" 
              alt="BAM Token" 
              className="h-10 w-10 rounded-full"
            />
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                BAM
              </span>
              <span className="text-xs text-gray-400 -mt-1">Ecosystem</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = isActiveRoute(item.href);
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className={`gap-2 relative ${
                      isActive 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                    {item.isNew && (
                      <Badge className="ml-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        NEW
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-300 hover:text-white"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-700 py-4">
            <div className="space-y-2">
              {navigation.map((item) => {
                const isActive = isActiveRoute(item.href);
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      className={`w-full justify-start gap-3 ${
                        isActive 
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' 
                          : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.name}
                      {item.isNew && (
                        <Badge className="ml-auto bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          NEW
                        </Badge>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}