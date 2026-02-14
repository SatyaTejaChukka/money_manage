import React from 'react';

export function OrbGlow({ size, glowColor, rippleKey, state }) {
  const ringSize = Math.round(size + 34);

  return (
    <>
      <div
        className="absolute rounded-full blur-2xl opacity-80 pointer-events-none"
        style={{
          width: ringSize,
          height: ringSize,
          background: `radial-gradient(circle, ${glowColor}55 0%, transparent 70%)`,
          boxShadow: `0 0 60px ${glowColor}66`,
        }}
      />
      <div
        className="absolute rounded-full border pointer-events-none"
        style={{
          width: ringSize + 12,
          height: ringSize + 12,
          borderColor: `${glowColor}66`,
        }}
      />
      <div
        key={rippleKey}
        className="absolute rounded-full border animate-orb-ripple pointer-events-none"
        style={{
          width: ringSize,
          height: ringSize,
          borderColor: `${glowColor}77`,
          opacity: state === 'careful' ? 0.45 : 0.7,
        }}
      />
    </>
  );
}
