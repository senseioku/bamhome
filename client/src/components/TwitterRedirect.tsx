import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Twitter, Smartphone } from 'lucide-react';

interface TwitterRedirectProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TwitterRedirect: React.FC<TwitterRedirectProps> = ({ isOpen, onClose }) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (isOpen && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isOpen && countdown === 0) {
      // Auto-redirect to web version after countdown
      window.open('https://x.com/bamecosystem', '_blank');
      onClose();
    }
  }, [isOpen, countdown, onClose]);

  useEffect(() => {
    if (isOpen) {
      setCountdown(5); // Reset countdown when modal opens
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAppRedirect = () => {
    // Try to open the app
    window.location.href = 'twitter://user?screen_name=bamecosystem';
    
    // Close modal after attempting redirect
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleWebRedirect = () => {
    window.open('https://x.com/bamecosystem', '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-500/30 rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="p-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full">
              <Twitter className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <h3 className="text-xl font-bold text-white mb-2">Follow BAM Ecosystem</h3>
          <p className="text-gray-300 text-sm mb-6">
            Choose how you'd like to open our X (Twitter) profile
          </p>

          <div className="space-y-3">
            <button
              onClick={handleAppRedirect}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200"
            >
              <Smartphone className="w-5 h-5" />
              Open in X App
            </button>

            <button
              onClick={handleWebRedirect}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-medium rounded-lg transition-all duration-200"
            >
              <ExternalLink className="w-5 h-5" />
              Open in Browser
            </button>
          </div>

          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-200 text-xs">
              Auto-opening in browser in {countdown}s...
            </p>
          </div>

          <p className="text-gray-400 text-xs mt-3">
            @bamecosystem • Follow for latest updates
          </p>
        </div>
      </div>
    </div>
  );
};