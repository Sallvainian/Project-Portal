import { useMemo } from "react";

/** Decorative drifting particles rendered behind the app (bundle `t1`). */
export default function FloatingParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 25 }, (_, id) => ({
        id,
        size: Math.random() * 5 + 4,
        left: Math.random() * 100,
        duration: Math.random() * 15 + 20,
        delay: Math.random() * -25,
        opacity: Math.random() * 0.3 + 0.7,
      })),
    [],
  );

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute bottom-0 rounded-full bg-gradient-to-t from-blue-300 via-purple-300 to-pink-300 dark:from-cyan-200 dark:via-violet-200 dark:to-fuchsia-200 animate-float-up"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: `${p.left}%`,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            boxShadow:
              "0 0 16px currentColor, 0 0 32px currentColor, 0 0 48px currentColor",
            filter: "brightness(1.5)",
          }}
        />
      ))}
    </div>
  );
}
