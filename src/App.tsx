import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Snowflake, Sparkles, Clock, Compass, Layers, CheckCircle } from "lucide-react";

interface Particle {
  id: string;
  type: "snowflake" | "balloon";
  startX: number; // 0 to 100vw
  startY?: number; // optional starting peak (for immediate feedback)
  size: number;
  duration: number; // speed
  drift: number; // horizontal sway amplitude
  color?: string; // balloon color
  initialRotate?: number; // snowflake rotation
  deltaRotate?: number; // snowflake rotate delta over time
}

// Pastel hues for formal and sophisticated balloons
const BALLOON_COLORS = [
  "#38bdf8", // Sky blue
  "#fb7185", // Coral rose
  "#34d399", // Soft emerald
  "#facc15", // Warm amber
  "#c084fc", // Lavender purple
  "#f472b6", // Pastel pink
];

export default function App() {
  // Particle pipeline state
  const [particles, setParticles] = useState<Particle[]>([]);

  // Timer trackers (ms remaining)
  const [snowTimeRemaining, setSnowTimeRemaining] = useState<number>(0);
  const [balloonTimeRemaining, setBalloonTimeRemaining] = useState<number>(0);

  // References for timeouts & interval clearing to prevent leaks or orphaned timers
  const snowIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const snowCountdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const snowTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const balloonIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const balloonCountdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const balloonTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to remove individual particle from state when its animation completes
  const removeParticle = useCallback((id: string) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Generate an individual snowflake
  const createSnowflake = useCallback((immediate = false): Particle => {
    return {
      id: `snow-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`,
      type: "snowflake",
      startX: Math.random() * 100, // random percentage X position
      startY: immediate ? Math.random() * 60 - 10 : -10, // scattered downward if immediate
      size: Math.floor(Math.random() * 12) + 20, // 20px to 32px (medium size range)
      duration: Math.random() * 2 + 3.5, // 3.5 to 5.5 seconds drift duration
      drift: Math.random() * 8 + 4, // 4vw to 12vw amplitude
      initialRotate: Math.random() * 360,
      deltaRotate: (Math.random() - 0.5) * 180, // rotate clockwise or counter-clockwise
    };
  }, []);

  // Generate an individual balloon
  const createBalloon = useCallback((immediate = false): Particle => {
    return {
      id: `balloon-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`,
      type: "balloon",
      startX: Math.random() * 90 + 5, // don't push edge-aligned balloons right against side borders (5% to 95%)
      startY: immediate ? Math.random() * 60 + 40 : 110, // scattered upward if immediate
      size: Math.floor(Math.random() * 10) + 42, // Width: 42px to 52px (medium size range)
      duration: Math.random() * 2 + 3.5, // 3.5 to 5.5 seconds ascension duration
      drift: Math.random() * 6 + 3, // 3vw to 9vw scale
      color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
    };
  }, []);

  // --- SNOWFLAKES ACTION TRIGGER ---
  const handleTriggerSnowflakes = () => {
    // 1. Clear any active snowflake timers/loops to reset seamlessly
    if (snowIntervalRef.current) clearInterval(snowIntervalRef.current);
    if (snowCountdownIntervalRef.current) clearInterval(snowCountdownIntervalRef.current);
    if (snowTimeoutRef.current) clearTimeout(snowTimeoutRef.current);

    // 2. Set complete active countdown (5000ms)
    setSnowTimeRemaining(5000);

    // 3. Immediately spawn an initial cluster (8 snowflakes) for instant tactile feedback
    const initialCluster: Particle[] = [];
    for (let i = 0; i < 8; i++) {
      initialCluster.push(createSnowflake(true));
    }
    setParticles((prev) => [...prev, ...initialCluster]);

    // 4. Set continuous production interval (spawn new snowflake every 150ms)
    snowIntervalRef.current = setInterval(() => {
      setParticles((prev) => [...prev, createSnowflake(false)]);
    }, 150);

    // 5. Set HUD/button countdown timer handler (ticks every 100ms for UI luxury feel)
    snowCountdownIntervalRef.current = setInterval(() => {
      setSnowTimeRemaining((prev) => {
        if (prev <= 100) {
          if (snowCountdownIntervalRef.current) clearInterval(snowCountdownIntervalRef.current);
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    // 6. Set hard terminal timeout at exactly 5 seconds to halt production
    snowTimeoutRef.current = setTimeout(() => {
      if (snowIntervalRef.current) clearInterval(snowIntervalRef.current);
      snowIntervalRef.current = null;
    }, 5000);
  };

  // --- BALLOONS ACTION TRIGGER ---
  const handleTriggerBalloons = () => {
    // 1. Clear any active balloon timers/loops to reset seamlessly
    if (balloonIntervalRef.current) clearInterval(balloonIntervalRef.current);
    if (balloonCountdownIntervalRef.current) clearInterval(balloonCountdownIntervalRef.current);
    if (balloonTimeoutRef.current) clearTimeout(balloonTimeoutRef.current);

    // 2. Set complete active countdown (5000ms)
    setBalloonTimeRemaining(5000);

    // 3. Immediately spawn an initial cluster (6 balloons) for instant feedback
    const initialCluster: Particle[] = [];
    for (let i = 0; i < 6; i++) {
      initialCluster.push(createBalloon(true));
    }
    setParticles((prev) => [...prev, ...initialCluster]);

    // 4. Set continuous production interval (spawn new balloon every 180ms)
    balloonIntervalRef.current = setInterval(() => {
      setParticles((prev) => [...prev, createBalloon(false)]);
    }, 180);

    // 5. Set UI countdown timer handler (ticks every 100ms)
    balloonCountdownIntervalRef.current = setInterval(() => {
      setBalloonTimeRemaining((prev) => {
        if (prev <= 100) {
          if (balloonCountdownIntervalRef.current) clearInterval(balloonCountdownIntervalRef.current);
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    // 6. Set terminal timeout at exactly 5 seconds to stop spawning
    balloonTimeoutRef.current = setTimeout(() => {
      if (balloonIntervalRef.current) clearInterval(balloonIntervalRef.current);
      balloonIntervalRef.current = null;
    }, 5000);
  };

  // Clean up all timeouts and intervals on unmount to prevent background processing memory leaks
  useEffect(() => {
    return () => {
      if (snowIntervalRef.current) clearInterval(snowIntervalRef.current);
      if (snowCountdownIntervalRef.current) clearInterval(snowCountdownIntervalRef.current);
      if (snowTimeoutRef.current) clearTimeout(snowTimeoutRef.current);

      if (balloonIntervalRef.current) clearInterval(balloonIntervalRef.current);
      if (balloonCountdownIntervalRef.current) clearInterval(balloonCountdownIntervalRef.current);
      if (balloonTimeoutRef.current) clearTimeout(balloonTimeoutRef.current);
    };
  }, []);

  const isSnowActive = snowTimeRemaining > 0;
  const isBalloonActive = balloonTimeRemaining > 0;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-tr from-slate-50 via-zinc-100 to-slate-100 flex flex-col justify-between font-sans text-slate-800">
      
      {/* ----------------- CORE AMBIENT CANVAS BACKGROUND ----------------- */}
      <div 
        className="absolute inset-0 pointer-events-none select-none z-0" 
        id="animation-canvas-viewport"
      >
        <AnimatePresence>
          {particles.map((p) => {
            if (p.type === "snowflake") {
              return (
                <motion.div
                  key={p.id}
                  className="absolute pointer-events-none select-none text-sky-400/80 drop-shadow-[0_2px_4px_rgba(186,230,253,0.3)] z-10"
                  initial={{
                    y: p.startY !== undefined ? `${p.startY}vh` : "-80px",
                    x: `calc(${p.startX}vw - 50%)`,
                    opacity: 0,
                    rotate: p.initialRotate ?? 0,
                  }}
                  animate={{
                    y: "105vh",
                    x: [
                      `calc(${p.startX}vw - 50%)`,
                      `calc(${p.startX + p.drift}vw - 50%)`,
                      `calc(${p.startX - p.drift}vw - 50%)`,
                      `calc(${p.startX}vw - 50%)`,
                    ],
                    opacity: [0, 0.85, 0.85, 0],
                    rotate: (p.initialRotate ?? 0) + (p.deltaRotate ?? 0),
                  }}
                  transition={{
                    y: { duration: p.duration, ease: "linear" },
                    x: { duration: p.duration, ease: "easeInOut" },
                    opacity: { duration: p.duration, ease: "linear" },
                    rotate: { duration: p.duration, ease: "linear" },
                  }}
                  onAnimationComplete={() => removeParticle(p.id)}
                  style={{
                    width: p.size,
                    height: p.size,
                  }}
                  id={`particle-${p.id}`}
                >
                  <Snowflake className="w-full h-full stroke-[1.5]" />
                </motion.div>
              );
            } else {
              // Beautiful shiny vector balloon render
              return (
                <motion.div
                  key={p.id}
                  className="absolute pointer-events-none select-none z-10"
                  initial={{
                    y: p.startY !== undefined ? `${p.startY}vh` : "110vh",
                    x: `calc(${p.startX}vw - 50%)`,
                    opacity: 0,
                  }}
                  animate={{
                    y: "-15vh",
                    x: [
                      `calc(${p.startX}vw - 50%)`,
                      `calc(${p.startX + p.drift}vw - 50%)`,
                      `calc(${p.startX - p.drift}vw - 50%)`,
                      `calc(${p.startX}vw - 50%)`,
                    ],
                    opacity: [0, 0.9, 0.9, 0],
                  }}
                  transition={{
                    y: { duration: p.duration, ease: "linear" },
                    x: { duration: p.duration, ease: "easeInOut" },
                    opacity: { duration: p.duration, ease: "linear" },
                  }}
                  onAnimationComplete={() => removeParticle(p.id)}
                  style={{
                    width: p.size,
                    height: p.size * 1.8, // proportional balloon height
                  }}
                  id={`particle-${p.id}`}
                >
                  <svg viewBox="0 0 40 80" className="w-full h-full filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.12)]">
                    {/* Balloon string */}
                    <path
                      d="M20,44 Q24,54 18,62 T20,80"
                      fill="none"
                      stroke="#868df3"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      className="opacity-70"
                    />
                    {/* Balloon connection knot */}
                    <polygon points="20,41 16,45 24,45" fill={p.color} />
                    {/* Balloon solid colorful body */}
                    <ellipse cx="20" cy="22" rx="16" ry="20" fill={p.color} />
                    {/* Spherical physical glossy white highlight */}
                    <ellipse
                      cx="14"
                      cy="14"
                      rx="4"
                      ry="7"
                      fill="rgba(255, 255, 255, 0.38)"
                      transform="rotate(-15 14 14)"
                    />
                  </svg>
                </motion.div>
              );
            }
          })}
        </AnimatePresence>
      </div>

      {/* ----------------- APPLICATION HEADER (FORMAL) ----------------- */}
      <header className="w-full max-w-7xl mx-auto px-8 pt-8 z-20 flex justify-between items-center relative">
        <div className="flex items-center space-x-3" id="brand-indicator">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white font-mono text-sm shadow-md font-bold">
            V
          </div>
          <div>
            <span className="text-xs tracking-widest text-zinc-400 font-mono font-medium block uppercase">
              Co-Processor Sandbox
            </span>
            <h1 className="text-sm font-semibold text-zinc-900 tracking-tight">
              Visual Effects Application
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-zinc-500 bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-full border border-zinc-200/50 shadow-sm" id="live-indicator">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>System Compliant</span>
        </div>
      </header>

      {/* ----------------- CONTROL CONSOLE CARD (CENTRAL VIEW) ----------------- */}
      <main className="flex-1 flex items-center justify-center p-6 z-20 relative">
        <div 
          className="w-full max-w-2xl bg-white/80 backdrop-blur-xl border border-zinc-200/80 rounded-3xl p-8 md:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.05)] transition-all duration-500 hover:border-zinc-300"
          id="formal-console-card"
        >
          {/* Header Description Section */}
          <div className="mb-8 pb-6 border-b border-zinc-100" id="console-header">
            <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight font-sans">
              Simulation Console
            </h2>
            <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">
              Activate real-time modular visual particle emitters. Click each button below to trigger high-fidelity medium-sized physics streams rendering on the outer viewport.
            </p>
          </div>

          {/* Interactive controls grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="controls-panel-grid">
            
            {/* SNOWFLAKES CONTROL MODULE CARD */}
            <div 
              className={`group flex flex-col justify-between p-6 rounded-2xl border transition-all duration-300 ${
                isSnowActive 
                  ? "bg-sky-50/40 border-sky-200/80 shadow-inner" 
                  : "bg-zinc-50/50 border-zinc-200/60 hover:bg-white hover:border-sky-300 hover:shadow-md"
              }`}
              id="snowflake-module-card"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-xl transition-colors duration-300 ${
                    isSnowActive ? "bg-sky-100 text-sky-600" : "bg-zinc-100 text-zinc-500 group-hover:bg-sky-50 group-hover:text-sky-500"
                  }`}>
                    <Snowflake className={`w-5 h-5 ${isSnowActive ? "animate-[spin_4s_linear_infinite]" : ""}`} />
                  </div>
                  {isSnowActive && (
                    <span className="text-xs font-mono font-semibold px-2 py-1 rounded bg-sky-100/80 text-sky-700 animate-pulse">
                      {(snowTimeRemaining / 1000).toFixed(1)}s remaining
                    </span>
                  )}
                </div>

                <h3 className="text-base font-medium text-zinc-900 font-sans">
                  Snowflake Cascade
                </h3>
                <p className="text-xs text-zinc-500 mt-1 leading-normal mb-6">
                  Generates a crisp falling drift of medium crystal flakes cascading downwards. Spawning persists for exactly 5 seconds.
                </p>
              </div>

              <div className="w-full">
                {/* Active linear countdown indicators */}
                <div className="h-1 w-full bg-zinc-200/50 rounded-full overflow-hidden mb-3.5 opacity-100 transition-opacity">
                  <div 
                    className="h-full bg-sky-500 transition-all duration-100 ease-linear"
                    style={{ width: `${(snowTimeRemaining / 5000) * 100}%` }}
                  />
                </div>

                <button
                  id="btn-trigger-snowflakes"
                  onClick={handleTriggerSnowflakes}
                  className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs tracking-wide uppercase transition-all duration-300 active:scale-95 cursor-pointer flex items-center justify-center space-x-1.5 ${
                    isSnowActive 
                      ? "bg-sky-600 hover:bg-sky-700 text-white shadow-sm" 
                      : "bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm"
                  }`}
                >
                  <span>{isSnowActive ? "Restart Snowflakes" : "Snowflakes"}</span>
                </button>
              </div>
            </div>

            {/* BALLOONS CONTROL MODULE CARD */}
            <div 
              className={`group flex flex-col justify-between p-6 rounded-2xl border transition-all duration-300 ${
                isBalloonActive 
                  ? "bg-rose-50/40 border-rose-200/80 shadow-inner" 
                  : "bg-zinc-50/50 border-zinc-200/60 hover:bg-white hover:border-rose-300 hover:shadow-md"
              }`}
              id="balloon-module-card"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-xl transition-colors duration-300 ${
                    isBalloonActive ? "bg-rose-100 text-rose-600" : "bg-zinc-100 text-zinc-500 group-hover:bg-rose-50 group-hover:text-rose-500"
                  }`}>
                    {/* Inline clean Balloon emblem representation using native compass/shapes */}
                    <Compass className="w-5 h-5" />
                  </div>
                  {isBalloonActive && (
                    <span className="text-xs font-mono font-semibold px-2 py-1 rounded bg-rose-100/80 text-rose-700 animate-pulse">
                      {(balloonTimeRemaining / 1000).toFixed(1)}s remaining
                    </span>
                  )}
                </div>

                <h3 className="text-base font-medium text-zinc-900 font-sans">
                  Balloon Ascension
                </h3>
                <p className="text-xs text-zinc-500 mt-1 leading-normal mb-6">
                  Launches a playful helium flight of medium festive colorful balloons rising upwards. Spawning persists for exactly 5 seconds.
                </p>
              </div>

              <div className="w-full">
                {/* Active linear countdown indicators */}
                <div className="h-1 w-full bg-zinc-200/50 rounded-full overflow-hidden mb-3.5 opacity-100 transition-opacity">
                  <div 
                    className="h-full bg-rose-400 transition-all duration-100 ease-linear"
                    style={{ width: `${(balloonTimeRemaining / 5000) * 100}%` }}
                  />
                </div>

                <button
                  id="btn-trigger-balloons"
                  onClick={handleTriggerBalloons}
                  className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs tracking-wide uppercase transition-all duration-300 active:scale-95 cursor-pointer flex items-center justify-center space-x-1.5 ${
                    isBalloonActive 
                      ? "bg-rose-600 hover:bg-rose-700 text-white shadow-sm" 
                      : "bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm"
                  }`}
                >
                  <span>{isBalloonActive ? "Restart Balloons" : "Balloons"}</span>
                </button>
              </div>
            </div>

          </div>

          {/* Current Concurrent Screen Activity Monitor Status */}
          <div className="mt-8 pt-5 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400 font-mono" id="simulation-footer-hud">
            <div className="flex items-center space-x-2">
              <Layers className="w-3.5 h-3.5" />
              <span>Active Entities: {particles.length}</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isSnowActive ? "bg-sky-400 animate-ping" : "bg-zinc-300"}`} />
                Snow: {isSnowActive ? "Active" : "Idle"}
              </span>
              <span className="flex items-center">
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isBalloonActive ? "bg-rose-400 animate-ping" : "bg-zinc-300"}`} />
                Balloons: {isBalloonActive ? "Active" : "Idle"}
              </span>
            </div>
          </div>

        </div>
      </main>

      {/* ----------------- SUBTLE PAGE FOOTER ----------------- */}
      <footer className="w-full max-w-7xl mx-auto px-8 pb-8 z-20 text-center relative" id="sandbox-footer">
        <p className="text-[10px] tracking-widest text-zinc-400 font-mono uppercase">
          Formal Animation Pipeline • GPU Accelerated CSS Canvas
        </p>
      </footer>
      
    </div>
  );
}
