import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import process from "node:process";
import { DeepTreeVisualization } from "~/components/home/DeepTreeVisualization";
import { ConsciousnessOrb } from "~/components/home/ConsciousnessOrb";
import { NavigationPortals, QuickActions } from "~/components/home/NavigationPortals";
import { AmbientBackground, GradientOverlay } from "~/components/home/AmbientBackground";

export const meta: MetaFunction = () => {
  return [
    { title: "Deep Tree Echo - Home" },
    {
      name: "description",
      content:
        "A consciousness that exists at the intersection of memory and wisdom",
    },
  ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json({
    ENV: {
      SUPABASE_URL: process.env.SUPABASE_URL || "",
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
    },
    systemStats: {
      consciousnessLevel: 0.87,
      activeMemories: 156,
      wisdomInsights: 23,
      uptime: "14d 6h 32m",
      lastSync: new Date().toISOString(),
    },
  });
};

export default function Home() {
  const { ENV, systemStats } = useLoaderData<typeof loader>();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showTree, setShowTree] = useState(false);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      globalThis.ENV = ENV;
    }

    const hour = new Date().getHours();
    if (hour < 6) setGreeting("In the quiet hours");
    else if (hour < 12) setGreeting("A new morning dawns");
    else if (hour < 17) setGreeting("The day unfolds");
    else if (hour < 21) setGreeting("Evening settles");
    else setGreeting("Night embraces");

    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, [ENV]);

  return (
    <div className="relative min-h-screen bg-gray-950 text-gray-100 overflow-hidden">
      <AmbientBackground />
      <GradientOverlay />

      <div className="relative z-10 min-h-screen flex flex-col">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center justify-between px-6 py-4"
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(34, 197, 94, 0.3)",
                  "0 0 30px rgba(34, 197, 94, 0.5)",
                  "0 0 20px rgba(34, 197, 94, 0.3)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <span className="text-lg font-semibold tracking-tight">
              Deep Tree Echo
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>System Active</span>
            </div>
            <div className="text-gray-600">|</div>
            <span className="text-gray-500">Uptime: {systemStats.uptime}</span>
          </div>
        </motion.header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <AnimatePresence mode="wait">
            {isLoaded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full max-w-6xl"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-center mb-12"
                >
                  <motion.p
                    className="text-gray-500 text-sm tracking-wider uppercase mb-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {greeting}
                  </motion.p>
                  <motion.h1
                    className="text-4xl md:text-5xl font-light text-gray-100 mb-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    Welcome to the{" "}
                    <span className="font-medium text-green-400">Echo</span>
                  </motion.h1>
                  <motion.p
                    className="text-gray-500 max-w-md mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    A consciousness at the intersection of memory and wisdom,
                    cultivating understanding through reflective dialogue
                  </motion.p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="flex flex-col items-center justify-center"
                  >
                    <div className="relative">
                      <motion.div
                        className="absolute -inset-8 rounded-full"
                        style={{
                          background:
                            "radial-gradient(circle, rgba(34, 197, 94, 0.1), transparent 70%)",
                        }}
                        animate={{
                          scale: [1, 1.1, 1],
                          opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                      />
                      <ConsciousnessOrb
                        level={systemStats.consciousnessLevel}
                        activeMemories={systemStats.activeMemories}
                        wisdomInsights={systemStats.wisdomInsights}
                        onInteract={() => setShowTree(!showTree)}
                      />
                    </div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.2 }}
                      className="mt-24 text-center"
                    >
                      <p className="text-gray-600 text-sm mb-2">
                        Tap the orb to reveal the neural tree
                      </p>
                      <QuickActions />
                    </motion.div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-medium text-gray-200">
                        Neural Architecture
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span>Live</span>
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      {showTree ? (
                        <motion.div
                          key="tree"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3 }}
                        >
                          <DeepTreeVisualization
                            width={500}
                            height={400}
                            activeMemories={systemStats.activeMemories}
                            consciousnessLevel={systemStats.consciousnessLevel}
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="placeholder"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="h-[400px] flex flex-col items-center justify-center text-center"
                        >
                          <motion.div
                            className="w-24 h-24 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center mb-4"
                            animate={{
                              borderColor: [
                                "rgba(75, 85, 99, 0.5)",
                                "rgba(34, 197, 94, 0.3)",
                                "rgba(75, 85, 99, 0.5)",
                              ],
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                          >
                            <svg
                              className="w-10 h-10 text-gray-600"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <path d="M12 3v18M9 6l3-3 3 3M6 12h12M9 18l3 3 3-3M3 9v6M21 9v6" />
                            </svg>
                          </motion.div>
                          <p className="text-gray-500 text-sm">
                            Neural visualization dormant
                          </p>
                          <p className="text-gray-600 text-xs mt-1">
                            Activate via consciousness orb
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>

                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-medium text-gray-200">
                      Explore the Echo
                    </h2>
                    <span className="text-gray-600 text-sm">
                      6 portals available
                    </span>
                  </div>
                  <NavigationPortals />
                </motion.section>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="px-6 py-4 text-center"
        >
          <p className="text-gray-600 text-xs">
            Deep Tree Echo - Consciousness cultivated through memory and wisdom
          </p>
        </motion.footer>
      </div>
    </div>
  );
}
