import React from 'react';

export default function VerifiedBadge({ className = "w-4 h-4" }) {
  return (
    <div className={`inline-flex items-center justify-center ${className} group relative`} title="Verified Trusted Seller">
      {/* Golden Badge Outer Ring */}
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-600 rounded-full animate-pulse opacity-20 group-hover:opacity-40 transition-opacity"></div>
      
      {/* The Badge Icon (Golden Tick) */}
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        className="w-full h-full drop-shadow-sm"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
          fill="url(#goldGradient)"
          stroke="#92400e" 
          strokeWidth="0.5"
        />
        <path 
          d="M9 12L11 14L15 10" 
          stroke="white" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="goldGradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fbbf24" />
            <stop offset="0.5" stopColor="#f59e0b" />
            <stop offset="1" stopColor="#d97706" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
