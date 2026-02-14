import { useEffect } from 'react';

export function useDeviceShake(onShake, options = {}) {
  const { threshold = 15, cooldownMs = 1200 } = options;

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.DeviceMotionEvent === 'undefined') {
      return undefined;
    }

    let lastX;
    let lastY;
    let lastZ;
    let lastTriggeredAt = 0;

    const handleMotion = (event) => {
      const accel = event.accelerationIncludingGravity;
      if (!accel) {
        return;
      }

      const x = accel.x ?? 0;
      const y = accel.y ?? 0;
      const z = accel.z ?? 0;

      if (lastX !== undefined && lastY !== undefined && lastZ !== undefined) {
        const deltaX = Math.abs(x - lastX);
        const deltaY = Math.abs(y - lastY);
        const deltaZ = Math.abs(z - lastZ);
        const intensity = deltaX + deltaY + deltaZ;
        const now = Date.now();

        if (intensity > threshold && now - lastTriggeredAt > cooldownMs) {
          lastTriggeredAt = now;
          onShake?.();
        }
      }

      lastX = x;
      lastY = y;
      lastZ = z;
    };

    window.addEventListener('devicemotion', handleMotion, { passive: true });
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [onShake, threshold, cooldownMs]);
}
