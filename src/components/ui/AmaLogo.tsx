import React from 'react';

interface AmaLogoProps {
  size?: number | string;
  className?: string;
  animate?: boolean;
}

export const AmaLogo: React.FC<AmaLogoProps> = ({
  size = 32,
  className = '',
  animate = false,
}) => {
  const customUrl = localStorage.getItem('ama_custom_logo_url');

  if (customUrl) {
    return (
      <img
        src={customUrl}
        alt="AMA Logo"
        style={{ width: size, height: size }}
        className={`rounded-full object-cover shrink-0 ${animate ? 'hover:scale-105 transition-transform' : ''} ${className}`}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-xl bg-gradient-to-tr from-[#9e0c1b] via-[#e61026] to-[#ff3b4e] border border-amber-400/40 shadow-md shadow-red-600/20 flex items-center justify-center shrink-0 select-none ${
        animate ? 'hover:scale-105 transition-transform duration-200' : ''
      } ${className}`}
    >
      <span className="font-extrabold text-white tracking-tighter text-[13px] leading-none font-sans drop-shadow-sm">
        AMA
      </span>
    </div>
  );
};
