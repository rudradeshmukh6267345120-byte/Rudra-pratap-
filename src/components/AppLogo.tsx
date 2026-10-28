import React from 'react';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  glow?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  className = '',
  glow = false,
}) => {
  const sizeMap = {
    xs: 'w-6 h-6 rounded-md',
    sm: 'w-9 h-9 rounded-xl',
    md: 'w-11 h-11 rounded-2xl',
    lg: 'w-16 h-16 rounded-2xl',
    xl: 'w-24 h-24 rounded-3xl',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden bg-black select-none ${sizeMap[size]} ${
        glow ? 'shadow-[0_0_20px_rgba(255,255,255,0.25)]' : ''
      } ${className}`}
    >
      <img
        src="/logo.png"
        alt="Glass Widgets"
        className="w-full h-full object-contain pointer-events-none"
        loading="eager"
      />
    </div>
  );
};
