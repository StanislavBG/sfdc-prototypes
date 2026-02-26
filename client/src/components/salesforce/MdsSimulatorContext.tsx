import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface MdsSimulatorContextValue {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  triggerDelay: (callback: () => void) => void;
}

const MdsSimulatorContext = createContext<MdsSimulatorContextValue>({
  enabled: false,
  setEnabled: () => {},
  triggerDelay: (cb) => cb(),
});

export function useMdsSimulator() {
  return useContext(MdsSimulatorContext);
}

// Fullscreen blocking overlay with countdown
function MdsDelayOverlay({ secondsLeft }: { secondsLeft: number }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
      <div className="bg-white rounded-xl shadow-2xl px-10 py-8 flex flex-col items-center gap-4 min-w-[320px]">
        {/* Spinner with brain */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-[3px] border-[var(--sf-blue)]/20 border-t-[var(--sf-blue)] animate-spin" />
          <div className="absolute inset-2 rounded-full border-[3px] border-[#FF4A00]/20 border-b-[#FF4A00] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          <span className="text-2xl">🧠</span>
        </div>
        {/* Countdown */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="flex gap-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--sf-blue)] animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--sf-blue)] animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--sf-blue)] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs font-medium text-[var(--sf-blue)]">Processing...</span>
          </div>
          <div className="text-lg font-bold text-[var(--sf-text-primary)]">MDS Simulator</div>
          <div className="text-sm text-[var(--sf-text-tertiary)] mt-1">
            Simulating latency — <span className="font-semibold text-[#FF4A00] tabular-nums">{secondsLeft}s</span> remaining
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-[#E5E5E5] rounded-full overflow-hidden mt-1">
          <div
            className="h-full bg-gradient-to-r from-[var(--sf-blue)] to-[#FF4A00] rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${Math.max(5, 100 - (secondsLeft / 15) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function MdsSimulatorProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [delayActive, setDelayActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const callbackRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const triggerDelay = useCallback((callback: () => void) => {
    if (!enabled) {
      callback();
      return;
    }
    // Random 5–15 seconds
    const totalSeconds = Math.floor(Math.random() * 11) + 5;
    callbackRef.current = callback;
    setSecondsLeft(totalSeconds);
    setDelayActive(true);
  }, [enabled]);

  // Countdown timer
  useEffect(() => {
    if (!delayActive) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setDelayActive(false);
          callbackRef.current?.();
          callbackRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [delayActive]);

  return (
    <MdsSimulatorContext.Provider value={{ enabled, setEnabled, triggerDelay }}>
      {children}
      {delayActive && <MdsDelayOverlay secondsLeft={secondsLeft} />}
    </MdsSimulatorContext.Provider>
  );
}
