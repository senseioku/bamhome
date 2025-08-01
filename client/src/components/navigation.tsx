import { Link } from "wouter";

export default function Navigation() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass-card backdrop-blur-xl border-b border-gray-800">
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
              <span className="text-xl font-bold gradient-text">BAM</span>
              <span className="text-xs text-gray-400 -mt-1">Ecosystem</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('home')}
              className="text-gray-300 hover:text-primary transition-colors"
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('ecosystem')}
              className="text-gray-300 hover:text-primary transition-colors"
            >
              Ecosystem
            </button>
            <button 
              onClick={() => scrollToSection('tokenomics')}
              className="text-gray-300 hover:text-primary transition-colors"
            >
              Tokenomics
            </button>
            <button 
              onClick={() => scrollToSection('projects')}
              className="text-gray-300 hover:text-primary transition-colors"
            >
              Projects
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}