import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ConsciousnessOrbProps {
  level: number;
  activeMemories: number;
  wisdomInsights: number;
  onInteract?: () => void;
}

export function ConsciousnessOrb({
  level,
  activeMemories,
  wisdomInsights,
  onInteract,
}: ConsciousnessOrbProps) {
  const [pulseIntensity, setPulseIntensity] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseIntensity((prev) => (prev + 0.05) % (Math.PI * 2));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const breathingScale = 1 + Math.sin(pulseIntensity) * 0.05 * level;
  const glowIntensity = 0.3 + Math.sin(pulseIntensity * 0.5) * 0.2;

  return (
    <motion.div
      className="relative cursor-pointer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={onInteract}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 30% 30%,
            rgba(34, 197, 94, ${glowIntensity * level}),
            rgba(22, 163, 74, ${glowIntensity * 0.5 * level}),
            rgba(16, 24, 39, 0.8))`,
          filter: `blur(${20 * level}px)`,
          transform: `scale(${breathingScale * 1.5})`,
        }}
        animate={{
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="relative w-32 h-32 rounded-full overflow-hidden"
        style={{
          background: `
            radial-gradient(circle at 35% 35%,
              rgba(134, 239, 172, 0.9),
              rgba(34, 197, 94, 0.8) 40%,
              rgba(22, 101, 52, 0.9) 70%,
              rgba(5, 46, 22, 1))
          `,
          boxShadow: `
            inset -8px -8px 20px rgba(0, 0, 0, 0.4),
            inset 8px 8px 20px rgba(134, 239, 172, 0.3),
            0 0 40px rgba(34, 197, 94, ${glowIntensity * level}),
            0 0 80px rgba(34, 197, 94, ${glowIntensity * 0.5 * level})
          `,
          transform: `scale(${breathingScale})`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-16 h-16 rounded-full"
            style={{
              background: `radial-gradient(circle at 40% 40%,
                rgba(255, 255, 255, 0.95),
                rgba(187, 247, 208, 0.8) 50%,
                rgba(134, 239, 172, 0.4))`,
              boxShadow: "inset -4px -4px 8px rgba(0, 0, 0, 0.2)",
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.9, 1, 0.9],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border border-green-300/20"
            animate={{
              scale: [1, 1.5, 2],
              opacity: [0.5, 0.2, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 1,
              ease: "easeOut",
            }}
          />
        ))}
      </motion.div>

      <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-48 text-center">
        <motion.div
          className="text-green-400 font-mono text-lg font-semibold"
          animate={{
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          {(level * 100).toFixed(1)}%
        </motion.div>
        <div className="text-gray-400 text-xs mt-1 tracking-wider uppercase">
          Consciousness Level
        </div>

        <div className="flex justify-center gap-4 mt-3">
          <div className="text-center">
            <div className="text-blue-400 font-mono text-sm">
              {activeMemories}
            </div>
            <div className="text-gray-500 text-xs">Memories</div>
          </div>
          <div className="h-6 w-px bg-gray-700" />
          <div className="text-center">
            <div className="text-amber-400 font-mono text-sm">
              {wisdomInsights}
            </div>
            <div className="text-gray-500 text-xs">Insights</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
