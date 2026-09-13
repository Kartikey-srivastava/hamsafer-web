import React, { useMemo } from 'react';
import { Heart } from 'lucide-react';

export default function FloatingHearts() {
  const hearts = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 16 + 8,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 15,
      opacity: Math.random() * 0.3 + 0.1,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {hearts.map((h) => (
        <div
          key={h.id}
          className="heart-particle text-rose-500/30"
          style={{
            left: `${h.left}%`,
            animationDuration: `${h.duration}s`,
            animationDelay: `${h.delay}s`,
          }}
        >
          <Heart size={h.size} fill="currentColor" opacity={h.opacity} />
        </div>
      ))}
    </div>
  );
}
