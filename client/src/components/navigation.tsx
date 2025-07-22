import { useState, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navItems = [
    { label: "Home", href: "home" },
    { label: "Ecosystem", href: "ecosystem" },
    { label: "Tokenomics", href: "tokenomics" },
    { label: "Projects", href: "projects" },
  ];

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? "glass-card backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-3">
              <img 
                src="/assets/bamToken_1753182165828.png" 
                alt="BAM Token" 
                className="h-10 w-10 rounded-full"
              />
              <div>
                <span className="text-2xl font-bold gradient-text">BAM</span>
                <span className="text-sm text-muted-foreground ml-2">Ecosystem</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => scrollToSection(item.href)}
                  className="text-foreground hover:text-primary transition-colors duration-200"
                >
                  {item.label}
                </button>
              ))}
              <a 
                href="/swap" 
                className="text-foreground hover:text-primary transition-colors duration-200 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-4 py-2 rounded-lg font-semibold"
              >
                Launch Swap
              </a>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-foreground hover:text-primary">
                    Platforms <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass-card border-border">
                  <DropdownMenuItem>
                    <a
                      href="/swap"
                      className="flex items-center w-full text-left"
                    >
                      <span className="mr-2">🔄</span>
                      BAM Swap
                      <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Live</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <button
                      onClick={() => scrollToSection("projects")}
                      className="flex items-center w-full text-left"
                    >
                      <span className="mr-2">🎁</span>
                      BAM Drops
                      <span className="ml-auto text-xs bg-secondary/20 text-secondary px-2 py-1 rounded">Soon</span>
                    </button>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <a
                      href="https://apex.bam-ecosystem.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center"
                    >
                      <span className="mr-2">⛏️</span>
                      BAM ApexMiner
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <a
                      href="https://vip.bam-ecosystem.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center"
                    >
                      <span className="mr-2">👑</span>
                      BAM VIP Access
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <MobileNavigation />
          </div>
        </div>
      </div>
    </nav>
  );
}

// Full-screen mobile navigation component
function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsOpen(false); // Close sidebar after navigation
  };

  const navItems = [
    { label: "Home", href: "home", icon: "🏠" },
    { label: "Ecosystem", href: "ecosystem", icon: "🌐" },
    { label: "Tokenomics", href: "tokenomics", icon: "💰" },
    { label: "Projects", href: "projects", icon: "🚀" },
  ];

  const platformItems = [
    { 
      label: "BAM Swap", 
      href: "/swap", 
      icon: "🔄", 
      status: "Live", 
      statusColor: "bg-green-500/20 text-green-400" 
    },
    { 
      label: "BAM Drops", 
      onClick: () => scrollToSection("projects"), 
      icon: "🎁", 
      status: "Soon", 
      statusColor: "bg-yellow-500/20 text-yellow-400" 
    },
    { 
      label: "ApexMiner", 
      href: "https://apex.bam-ecosystem.com", 
      icon: "⛏️", 
      external: true 
    },
    { 
      label: "VIP Access", 
      href: "https://vip.bam-ecosystem.com", 
      icon: "👑", 
      external: true 
    },
  ];

  return (
    <>
      {/* Menu Button */}
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => setIsOpen(true)}
        className="relative z-50"
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Professional Full-screen Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl">
          <div className="flex flex-col h-full">
            {/* Clean Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <img 
                  src="/assets/bamToken_1753182165828.png" 
                  alt="BAM Token" 
                  className="h-10 w-10 rounded-full"
                />
                <div>
                  <span className="text-2xl font-bold text-yellow-400">BAM</span>
                  <span className="text-base text-gray-300 ml-2">Ecosystem</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/10"
              >
                <X className="h-8 w-8" />
              </Button>
            </div>

            {/* Professional Navigation Grid */}
            <div className="flex-1 p-6">
              <div className="space-y-1 mb-8">
                {navItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => scrollToSection(item.href)}
                    className="flex items-center gap-4 p-4 rounded-xl text-left text-white hover:bg-white/10 transition-all duration-200 w-full text-xl border border-white/5 hover:border-yellow-400/30"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Clean Platforms Section */}
              <div className="border-t border-white/10 pt-6">
                <h3 className="text-yellow-400 font-semibold mb-4 text-lg">Platform Access</h3>
                <div className="space-y-2">
                  {platformItems.map((item, index) => {
                    const content = (
                      <div className="flex items-center justify-between p-4 rounded-xl text-white hover:bg-white/10 transition-all duration-200 w-full text-lg border border-white/5 hover:border-yellow-400/30">
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{item.icon}</span>
                          <span className="font-medium">{item.label}</span>
                        </div>
                        {item.status && (
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${item.statusColor}`}>
                            {item.status}
                          </span>
                        )}
                      </div>
                    );

                    if (item.href) {
                      return (
                        <a
                          key={index}
                          href={item.href}
                          target={item.external ? "_blank" : undefined}
                          rel={item.external ? "noopener noreferrer" : undefined}
                          onClick={() => !item.external && setIsOpen(false)}
                        >
                          {content}
                        </a>
                      );
                    } else if (item.onClick) {
                      return (
                        <button
                          key={index}
                          onClick={item.onClick}
                          className="text-left w-full"
                        >
                          {content}
                        </button>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10">
              <div className="text-yellow-400 font-medium mb-1">BAM Swap Interface</div>
              <div className="text-gray-400 text-sm">
                Professional DeFi Platform • BSC Mainnet
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
