import React from 'react';

export default function Logo({ size = 32, className = '' }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g transform="translate(4, 8) rotate(-15)">
        {/* Main bill body */}
        <rect x="0" y="0" width="24" height="14" rx="2" fill="#10B981" />
        {/* Inner border */}
        <rect x="2" y="2" width="20" height="10" rx="1" stroke="white" strokeWidth="1" strokeDasharray="2 1" />
        {/* Center circle */}
        <circle cx="12" cy="7" r="3" fill="white" />
        {/* Corner details */}
        <circle cx="4" cy="4" r="0.5" fill="white" />
        <circle cx="20" cy="4" r="0.5" fill="white" />
        <circle cx="4" cy="10" r="0.5" fill="white" />
        <circle cx="20" cy="10" r="0.5" fill="white" />
      </g>
      
      {/* Wings / Speed lines */}
      <path d="M3 24 Q 0 20 4 16" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M8 28 Q 4 25 7 21" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" fill="none" />
      
      <path d="M29 8 Q 32 12 28 16" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M24 4 Q 28 7 25 11" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}
