import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/**
 * Binary search to find closest sample index in telemetry array ordered by timestampSec.
 */
function findSampleAtTime(samples, targetTimeSec) {
  let low = 0;
  let high = samples.length - 1;

  if (targetTimeSec <= samples[0].timestampSec) return 0;
  if (targetTimeSec >= samples[high].timestampSec) return high;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const midTime = samples[mid].timestampSec;

    if (midTime === targetTimeSec) return mid;
    if (midTime < targetTimeSec) low = mid + 1;
    else high = mid - 1;
  }

  return Math.max(0, high);
}

export function useTelemetryPlayback(telemetryData = [], initialSpeed = 1.0) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeedState] = useState(initialSpeed); // 0.5, 1.0, 2.0, 4.0
  const [playbackElapsedSec, setPlaybackElapsedSec] = useState(0.0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const rafRef = useRef(null);
  const lastFrameTimeRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);
  const playbackSpeedRef = useRef(playbackSpeed);
  const playbackElapsedSecRef = useRef(playbackElapsedSec);
  const telemetryDataRef = useRef(telemetryData);
  const tickRef = useRef(null);

  // Keep mutable refs in sync with state
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    playbackElapsedSecRef.current = playbackElapsedSec;
  }, [playbackElapsedSec]);

  useEffect(() => {
    telemetryDataRef.current = telemetryData;
  }, [telemetryData]);

  // Session metadata boundaries
  const firstSample = telemetryData && telemetryData.length > 0 ? telemetryData[0] : null;
  const lastSample = telemetryData && telemetryData.length > 0 ? telemetryData[telemetryData.length - 1] : null;

  const firstTimestamp = firstSample ? (firstSample.timestampSec ?? firstSample.t ?? 0.0) : 0.0;
  const lastTimestamp = lastSample ? (lastSample.timestampSec ?? lastSample.t ?? 0.0) : 0.0;
  const totalDurationSec = Math.max(0.0, lastTimestamp - firstTimestamp);

  const firstDistance = firstSample ? (firstSample.distanceM ?? firstSample.lapDist ?? 0.0) : 0.0;
  const lastDistance = lastSample ? (lastSample.distanceM ?? lastSample.lapDist ?? 0.0) : 0.0;
  const totalDistanceM = Math.max(0.0, lastDistance - firstDistance);

  // Reset timestamp ref on speed multiplier change to prevent time jump
  const setPlaybackSpeed = useCallback((speed) => {
    const validSpeed = [0.5, 1.0, 2.0, 4.0].includes(speed) ? speed : 1.0;
    lastFrameTimeRef.current = performance.now();
    setPlaybackSpeedState(validSpeed);
  }, []);

  // Playback Animation Tick Callback
  const tick = useCallback((now) => {
    if (!isPlayingRef.current || !telemetryDataRef.current || telemetryDataRef.current.length <= 1) {
      rafRef.current = null;
      return;
    }

    if (lastFrameTimeRef.current === null) {
      lastFrameTimeRef.current = now;
    }

    const dtSec = Math.max(0.0001, (now - lastFrameTimeRef.current) / 1000.0);
    lastFrameTimeRef.current = now;

    const currentElapsed = playbackElapsedSecRef.current;
    const speed = playbackSpeedRef.current;
    const newElapsed = currentElapsed + dtSec * speed;

    const samples = telemetryDataRef.current;
    const fSample = samples[0];
    const lSample = samples[samples.length - 1];
    const fTime = fSample.timestampSec ?? fSample.t ?? 0.0;
    const lTime = lSample.timestampSec ?? lSample.t ?? 0.0;
    const maxElapsed = Math.max(0.0, lTime - fTime);

    if (newElapsed >= maxElapsed) {
      setPlaybackElapsedSec(maxElapsed);
      playbackElapsedSecRef.current = maxElapsed;
      setCurrentIndex(samples.length - 1);
      setIsPlaying(false);
      isPlayingRef.current = false;
      lastFrameTimeRef.current = null;
      rafRef.current = null;
      return;
    }

    setPlaybackElapsedSec(newElapsed);
    playbackElapsedSecRef.current = newElapsed;

    const targetTime = fTime + newElapsed;
    const idx = findSampleAtTime(samples, targetTime);
    setCurrentIndex(idx);

    if (tickRef.current) {
      rafRef.current = requestAnimationFrame(tickRef.current);
    }
  }, []);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  // Animation Loop lifecycle management
  useEffect(() => {
    if (isPlaying && telemetryData.length > 1) {
      lastFrameTimeRef.current = performance.now();
      if (!rafRef.current && tickRef.current) {
        rafRef.current = requestAnimationFrame(tickRef.current);
      }
    } else {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastFrameTimeRef.current = null;
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying, telemetryData.length]);

  // Reset state on telemetryData change
  const [prevData, setPrevData] = useState(telemetryData);
  if (prevData !== telemetryData) {
    setPrevData(telemetryData);
    setIsPlaying(false);
    setPlaybackElapsedSec(0.0);
    setCurrentIndex(0);
  }

  // Controls
  const play = useCallback(() => {
    if (telemetryData.length <= 1) return;
    if (playbackElapsedSecRef.current >= totalDurationSec) {
      setPlaybackElapsedSec(0.0);
      playbackElapsedSecRef.current = 0.0;
      setCurrentIndex(0);
    }
    lastFrameTimeRef.current = performance.now();
    setIsPlaying(true);
  }, [telemetryData.length, totalDurationSec]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    lastFrameTimeRef.current = null;
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    lastFrameTimeRef.current = null;
    setPlaybackElapsedSec(0.0);
    playbackElapsedSecRef.current = 0.0;
    setCurrentIndex(0);
  }, []);

  const seekToElapsedSec = useCallback(
    (elapsedSec) => {
      if (!telemetryData || telemetryData.length === 0) return;
      const clampedElapsed = Math.max(0.0, Math.min(totalDurationSec, elapsedSec));
      setPlaybackElapsedSec(clampedElapsed);
      playbackElapsedSecRef.current = clampedElapsed;

      const targetTime = firstTimestamp + clampedElapsed;
      const idx = findSampleAtTime(telemetryData, targetTime);
      setCurrentIndex(idx);
      lastFrameTimeRef.current = performance.now();
    },
    [telemetryData, totalDurationSec, firstTimestamp]
  );

  const seekToDistanceM = useCallback(
    (distM) => {
      if (!telemetryData || telemetryData.length === 0) return;
      let closestIdx = 0;
      let minDiff = Infinity;
      for (let i = 0; i < telemetryData.length; i++) {
        const d = telemetryData[i].distanceM ?? telemetryData[i].lapDist ?? 0.0;
        const diff = Math.abs(d - distM);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = i;
        }
      }
      setCurrentIndex(closestIdx);
      const sampleTime = telemetryData[closestIdx].timestampSec ?? telemetryData[closestIdx].t ?? 0.0;
      const elapsed = Math.max(0.0, sampleTime - firstTimestamp);
      setPlaybackElapsedSec(elapsed);
      playbackElapsedSecRef.current = elapsed;
      lastFrameTimeRef.current = performance.now();
    },
    [telemetryData, firstTimestamp]
  );

  // Active sample and interpolated values
  const currentSample = useMemo(() => {
    if (!telemetryData || telemetryData.length === 0) return null;
    return telemetryData[currentIndex] || telemetryData[0];
  }, [telemetryData, currentIndex]);

  const interpolatedValues = useMemo(() => {
    if (!telemetryData || telemetryData.length === 0) {
      return { speedKmh: 0, rpm: 0, gear: 1, throttlePct: 0, brakeBar: 0, steeringDeg: 0, distanceM: 0 };
    }
    if (currentIndex >= telemetryData.length - 1 || telemetryData.length === 1) {
      const s = telemetryData[currentIndex] || telemetryData[0];
      return {
        speedKmh: Math.max(0, s.speedKmh ?? s.speed ?? 0),
        rpm: Math.max(0, s.rpm ?? 0),
        gear: Math.max(0, Math.min(8, s.gear ?? 1)),
        throttlePct: Math.max(0, Math.min(100, s.throttlePct ?? s.thr ?? 0)),
        brakeBar: Math.max(0, Math.min(100, s.brakeBar ?? s.brk ?? 0)),
        steeringDeg: s.steeringDeg ?? s.steer ?? 0,
        distanceM: s.distanceM ?? s.lapDist ?? 0,
      };
    }

    const s0 = telemetryData[currentIndex];
    const s1 = telemetryData[currentIndex + 1];

    const t0 = s0.timestampSec ?? s0.t ?? 0;
    const t1 = s1.timestampSec ?? s1.t ?? 0;
    const dt = t1 - t0;

    const currentTargetTime = firstTimestamp + playbackElapsedSec;
    const ratio = dt > 0.0001 ? Math.max(0, Math.min(1, (currentTargetTime - t0) / dt)) : 0;

    const lerp = (a, b) => (a ?? 0) + ((b ?? 0) - (a ?? 0)) * ratio;

    return {
      speedKmh: Math.max(0, Math.round(lerp(s0.speedKmh ?? s0.speed, s1.speedKmh ?? s1.speed))),
      rpm: Math.max(0, Math.round(lerp(s0.rpm, s1.rpm))),
      gear: Math.max(0, Math.min(8, s0.gear ?? 1)),
      throttlePct: Math.max(0, Math.min(100, Math.round(lerp(s0.throttlePct ?? s0.thr, s1.throttlePct ?? s1.thr)))),
      brakeBar: Math.max(0, Math.min(100, Math.round(lerp(s0.brakeBar ?? s0.brk, s1.brakeBar ?? s1.brk)))),
      steeringDeg: Math.round(lerp(s0.steeringDeg ?? s0.steer, s1.steeringDeg ?? s1.steer) * 10) / 10,
      distanceM: Math.round(lerp(s0.distanceM ?? s0.lapDist, s1.distanceM ?? s1.lapDist)),
    };
  }, [telemetryData, currentIndex, playbackElapsedSec, firstTimestamp]);

  return {
    isPlaying,
    playbackSpeed,
    playbackElapsedSec,
    currentIndex,
    totalSamples: telemetryData ? telemetryData.length : 0,
    totalDurationSec,
    totalDistanceM,
    firstTimestamp,
    currentSample,
    interpolatedValues,
    play,
    pause,
    reset,
    seekToElapsedSec,
    seekToDistanceM,
    setPlaybackSpeed,
  };
}
