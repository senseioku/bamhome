import { Github, Twitter, MessageCircle, Zap } from "lucide-react";

export default function Footer() {
  const ecosystemLinks = [
    { label: "BAM Token", href: "#" },
    { label: "BAM ApexMiner", href: "https://apex.bam-ecosystem.com" },
    { label: "BAM VIP Access", href: "https://vip.bam-ecosystem.com" },
    { label: "Staking", href: "#" }
  ];

  const productLinks = [
    { label: "BAM DEX", href: "#" },
    { label: "NFT Marketplace", href: "#" },
    { label: "Play 2 Earn", href: "#" },
    { label: "DAO", href: "#" }
  ];

  const socialLinks = [
    { icon: <Twitter className="h-5 w-5" />, href: "#", label: "Twitter" },
    { icon: <MessageCircle className="h-5 w-5" />, href: "#", label: "Telegram" },
    { icon: <Zap className="h-5 w-5" />, href: "#", label: "Discord" },
    { icon: <Github className="h-5 w-5" />, href: "#", label: "GitHub" }
  ];

  return (
    <footer className="bg-card py-12 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <span className="text-2xl font-bold gradient-text">BAM</span>
              <span className="text-sm text-muted-foreground ml-2">Ecosystem</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Building the future of decentralized finance through innovative token utilities and community-driven growth.
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
                  className="text-muted-foreground hover:text-primary text-xl transition-colors"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 BAM Ecosystem. All rights reserved. Built for the community, by the community.</p>
        </div>
      </div>
    </footer>
  );
}
