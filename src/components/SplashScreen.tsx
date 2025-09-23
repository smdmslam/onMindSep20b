import React, { useEffect, useState } from 'react';

type SplashScreenProps = {
  onFinished: () => void;
  minDuration?: number;
};

export function SplashScreen({ onFinished, minDuration = 1500 }: SplashScreenProps) {
  const [opacity, setOpacity] = useState(1);
  
  useEffect(() => {
    // Check if we should stay on splash screen
    const urlParams = new URLSearchParams(window.location.search);
    const stayOnSplash = urlParams.get('splash') === 'true';
    
    if (stayOnSplash) {
      // Don't auto-dismiss when splash=true in URL
      return;
    }
    
    const timer = setTimeout(() => {
      // Start fade out animation
      setOpacity(0);
      
      // Call onFinished after animation completes
      setTimeout(onFinished, 500);
    }, minDuration);
    
    return () => clearTimeout(timer);
  }, [minDuration, onFinished]);
  
  const handleClick = () => {
    // Allow click to dismiss when in development mode
    const urlParams = new URLSearchParams(window.location.search);
    const stayOnSplash = urlParams.get('splash') === 'true';
    
    if (stayOnSplash) {
      setOpacity(0);
      setTimeout(onFinished, 500);
    }
  };
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#2d1b69] to-[#1a1a1a] cursor-pointer"
      style={{ 
        opacity, 
        transition: 'opacity 500ms ease-in-out'
      }}
      onClick={handleClick}
    >
      <div className="text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-[#2d9edb] to-[#2d9edb]/70 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
          <span className="text-4xl font-bold text-white">OM</span>
        </div>
        <h1 className="text-4xl font-bold text-[#2d9edb] mb-2 text-center">
          On Mind
        </h1>
        <p className="text-white/60 text-center">
          Your personal knowledge base<br />
          and YouTube companion
        </p>
        <p className="text-sm text-white/40 mt-2 text-center">
          v. 1.09.25 (53e0d42)
        </p>
        
        <div className="mt-8">
          <div className="w-12 h-1 bg-white/20 rounded-full mx-auto overflow-hidden">
            <div 
              className="h-full bg-[#2d9edb] splash-loading-bar"
              style={{
                width: '100%'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}