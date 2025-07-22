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
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="glass-card border-border w-80 p-6">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border">
                    <img 
                      src="/assets/bamToken_1753182165828.png" 
                      alt="BAM Token" 
                      className="h-8 w-8 rounded-full"
                    />
                    <div>
                      <span className="text-lg font-bold gradient-text">BAM</span>
                      <span className="text-sm text-muted-foreground ml-2">Ecosystem</span>
                    </div>
                  </div>

                  {/* Navigation Items */}
                  <div className="flex flex-col space-y-3 mb-6">
                    {navItems.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => scrollToSection(item.href)}
                        className="flex items-center gap-3 p-3 rounded-lg text-left text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                      >
                        <span className="text-lg">
                          {item.label === "Home" ? "🏠" : 
                           item.label === "Ecosystem" ? "🌐" :
                           item.label === "Tokenomics" ? "💰" : "🚀"}
                        </span>
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Platforms Section */}
                  <div className="border-t border-border pt-6">
                    <div className="text-sm font-semibold text-muted-foreground mb-4 px-3">Platforms</div>
                    <div className="space-y-2">
                      <a
                        href="/swap"
                        className="flex items-center justify-between p-3 rounded-lg text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">🔄</span>
                          <span>BAM Swap</span>
                        </div>
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Live</span>
                      </a>
                      <button
                        onClick={() => scrollToSection("projects")}
                        className="flex items-center justify-between p-3 rounded-lg text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 w-full text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">🎁</span>
                          <span>BAM Drops</span>
                        </div>
                        <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded">Soon</span>
                      </button>
                      <a
                        href="https://apex.bam-ecosystem.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                      >
                        <span className="text-lg">⛏️</span>
                        <span>BAM ApexMiner</span>
                      </a>
                      <a
                        href="https://vip.bam-ecosystem.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                      >
                        <span className="text-lg">👑</span>
                        <span>BAM VIP Access</span>
                      </a>
                    </div>
                  </div>

                  {/* Current Page Indicator */}
                  <div className="mt-auto pt-6 border-t border-border">
                    <div className="text-sm text-muted-foreground mb-2">Current: Swap</div>
                    <div className="text-xs text-muted-foreground">
                      Connected wallet will appear here when available
                    </div>
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
