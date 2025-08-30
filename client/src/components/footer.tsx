import { Github, Twitter, MessageCircle, Zap } from "lucide-react";

export default function Footer() {
  const handleTwitterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Try to open X app first, fallback to web
    const appUrl = "twitter://user?screen_name=bamecosystem";
    const webUrl = "https://x.com/bamecosystem";
    
    // For mobile devices, try app first
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      window.location.href = appUrl;
      
      // Fallback to web after a short delay if app doesn't open
      setTimeout(() => {
        window.open(webUrl, '_blank');
      }, 500);
    } else {
      // For desktop, open in new tab
      window.open(webUrl, '_blank');
    }
  };
  const ecosystemLinks = [
    { label: "BAM Token", href: "#" },
    { label: "BAM ApexMiner", href: "https://apex.bam-ecosystem.com" },
    { label: "BAM VIP Access", href: "https://vip.bam-ecosystem.com" },
    { label: "Community Staking", href: "#" }
  ];

  const productLinks = [
    { label: "BAM Swap", href: "#" },
    { label: "NFT Marketplace", href: "#" },
    { label: "Play 2 Earn", href: "#" },
    { label: "BAM DAO", href: "#" }
  ];

  const socialLinks = [
    { icon: <Twitter className="h-5 w-5" />, href: "#", label: "Twitter", onClick: handleTwitterClick },
    { icon: <MessageCircle className="h-5 w-5" />, href: "#", label: "Telegram" },
    { icon: <Zap className="h-5 w-5" />, href: "#", label: "Discord" },
    { icon: <Github className="h-5 w-5" />, href: "#", label: "GitHub" }
  ];

  return (
    <footer className="bg-card py-12 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4 gap-3">
              <img 
                src="/assets/bamToken_1752877645023.png" 
                alt="BAM Token" 
                className="h-8 w-8 rounded-full"
              />
              <div>
                <span className="text-2xl font-bold gradient-text">BAM</span>
                <span className="text-sm text-muted-foreground ml-2">Ecosystem</span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              Where Communities Build and Multiply Wealth Together. Creating collective prosperity through community-driven DeFi strategies and shared growth.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Ecosystem</h4>
            <ul className="space-y-2">
              {ecosystemLinks.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href} 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Products</h4>
            <ul className="space-y-2">
              {productLinks.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href} 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Community</h4>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  onClick={social.onClick}
                  className="text-muted-foreground hover:text-primary text-xl transition-colors"
                  aria-label={social.label}
                  target={social.href.startsWith('http') ? '_blank' : undefined}
                  rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 BAM Ecosystem. All rights reserved. Where Communities Build and Multiply Wealth Together.</p>
        </div>
      </div>
    </footer>
  );
}
