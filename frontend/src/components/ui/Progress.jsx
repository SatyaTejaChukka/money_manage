import React from 'react';

export function Progress({ value, max = 100, variant = 'default', size = 'md', showLabel = false, className = '' }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const variants = {
    default: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-500',
    error: 'bg-red-600',
    gradient: 'gradient-primary',
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className={`h-full transition-all duration-500 ease-out ${variants[variant]} rounded-full`}
          style={{ width: `${percentage}%` }}
        >
          {showLabel && size !== 'sm' && (
            <span className="flex items-center justify-end pr-2 h-full text-xs font-medium text-white">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      </div>
      {showLabel && size === 'sm' && (
        <span className="text-xs text-gray-600 mt-1 block text-right">{Math.round(percentage)}%</span>
      )}
    </div>
  );
}
