import React from 'react';
import { Clock, Sparkles, X, Settings, Wrench } from 'lucide-react';

const UnderDevelopmentOverlay = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 rounded-2xl flex flex-col items-center justify-center text-center p-8 max-w-md mx-4 relative shadow-2xl border border-white/10 z-[10000] pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onClose && onClose(); }}
          className="absolute top-4 right-4 z-[10001] text-white/70 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Icon with Animation */}
        <div className="mb-6 relative">
          {/* Main construction icon container */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Rotating gears background */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Settings className="w-24 h-24 text-blue-400/30 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Settings className="w-16 h-16 text-purple-400/40 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
            </div>
            
            {/* Center wrench icon */}
            <div className="relative z-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-6 shadow-lg">
              <Wrench className="w-12 h-12 text-white" />
            </div>
          </div>
          
          {/* Sparkle indicator */}
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce shadow-lg">
            <Sparkles className="w-4 h-4 text-yellow-900" />
          </div>
        </div>

        {/* Message */}
        <div className="max-w-md">
          <div className="flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-blue-300 mr-2" />
            <h3 className="text-2xl font-bold text-white">Under Development</h3>
          </div>
          <p className="text-white/90 text-base leading-relaxed">
            This feature is currently being built and we can't wait to bring it to you soon!
          </p>
          
          {/* Animated dots */}
          <div className="mt-6 flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnderDevelopmentOverlay;