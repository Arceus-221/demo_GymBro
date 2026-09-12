import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Countdown driven by Date.now() deltas rather than accumulated setInterval
 * ticks — backgrounding the app would otherwise desync the timer (Phase 3 §2.3).
 */
export function useRestTimer() {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const endsAtRef = useRef(null);
  const intervalRef = useRef(null);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    endsAtRef.current = null;
    setIsRunning(false);
    setSecondsLeft(0);
  }, []);

  const start = useCallback((durationSeconds) => {
    clearInterval(intervalRef.current);
    endsAtRef.current = Date.now() + durationSeconds * 1000;
    setSecondsLeft(durationSeconds);
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      const remaining = Math.ceil((endsAtRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        endsAtRef.current = null;
        setIsRunning(false);
        setSecondsLeft(0);
      } else {
        setSecondsLeft(remaining);
      }
    }, 250);
  }, []);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return { secondsLeft, isRunning, start, stop };
}
