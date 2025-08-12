import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, Home, ArrowLeftRight, Bot, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Navigation = () => {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    {
      name: 'Home',
      path: '/',
      icon: Home,
      description: 'BAM Ecosystem Overview'
    },
    {
      name: 'BAM Swap',
      path: '/swap',
      icon: ArrowLeftRight,
      description: 'Token Exchange Platform'
    },
    {
      name: 'BAM AIChat',
      path: '/ai-chat',
      icon: Bot,
      description: 'AI-Powered Chat Assistant'
    }
  ];

  const isActivePath = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center justify-between w-full max-w-7xl mx-auto px-6 py-4 bg-black/50 backdrop-blur-sm border-b border-amber-500/20">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-lg">B</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-amber-400">BAM Ecosystem</h1>
            <p className="text-xs text-gray-400">Build And Multiply</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);
            
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant="ghost"
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
                      : "text-gray-300 hover:text-amber-400 hover:bg-amber-500/10"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </div>

        {/* External Links */}
        <div className="flex items-center gap-2">
          <a 
            href="https://bam-ecosystem.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-amber-400 transition-colors"
          >
            <Button variant="ghost" size="sm" className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Website
            </Button>
          </a>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="lg:hidden">
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/50 backdrop-blur-sm border-b border-amber-500/20">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">B</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-amber-400">BAM</h1>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-300 hover:text-amber-400"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="fixed top-0 right-0 w-64 h-full bg-gray-900 border-l border-amber-500/20 shadow-xl">
              <div className="flex items-center justify-between p-4 border-b border-amber-500/20">
                <h2 className="text-lg font-semibold text-amber-400">Navigation</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-300 hover:text-amber-400"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="p-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActivePath(item.path);
                  
                  return (
                    <Link key={item.path} href={item.path}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-3 h-12 text-left",
                          isActive 
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
                            : "text-gray-300 hover:text-amber-400 hover:bg-amber-500/10"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Icon className="w-5 h-5" />
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs opacity-70">{item.description}</div>
                        </div>
                      </Button>
                    </Link>
                  );
                })}
                
                <div className="pt-4 border-t border-amber-500/20">
                  <a 
                    href="https://bam-ecosystem.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" className="w-full justify-start gap-3 h-10 text-gray-300 hover:text-amber-400">
                      <ExternalLink className="w-4 h-4" />
                      Visit Website
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navigation;