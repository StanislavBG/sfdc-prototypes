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
    <div className="sf-mds-overlay">
      <div className="sf-mds-card">
        {/* Spinner with brain */}
        <div className="sf-mds-spinner-wrap">
          <div className="sf-mds-spinner-outer" />
          <div className="sf-mds-spinner-inner" />
          <span style={{ fontSize: '24px' }}>🧠</span>
        </div>
        {/* Countdown */}
        <div className="slds-text-center">
          <div className="slds-grid slds-grid_vertical-align-center slds-grid_align-center slds-gap_x-small slds-m-bottom_xxx-small">
            <div className="slds-grid slds-gap_xxx-small">
              <div className="sf-mds-dot" />
              <div className="sf-mds-dot" style={{ animationDelay: '150ms' }} />
              <div className="sf-mds-dot" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="slds-text-size_small slds-font-weight_medium slds-text-brand">Processing...</span>
          </div>
          <div className="slds-text-size_large slds-font-weight_bold slds-text-neutral-base">MDS Simulator</div>
          <div className="slds-text-size_medium slds-text-neutral-7 slds-m-top_xx-small">
            Simulating latency — <span className="slds-font-weight_semibold" style={{ color: '#FF4A00', fontVariantNumeric: 'tabular-nums' }}>{secondsLeft}s</span> remaining
          </div>
        </div>
        {/* Progress bar */}
        <div className="sf-mds-progress-track">
          <div
            className="sf-mds-progress-fill"
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
