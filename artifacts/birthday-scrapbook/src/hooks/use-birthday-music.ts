import { useCallback, useEffect, useRef, useState } from 'react';

const beatSeconds = 0.72;
const melody = [72, 76, 79, 84, 81, 79, 76, 74, 72, 79, 76, 72];
const chordRoots = [48, 53, 55, 48];

function midiToFrequency(note: number) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function playTone(
  context: AudioContext,
  destination: AudioNode,
  frequency: number,
  startAt: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine',
) {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  envelope.gain.setValueAtTime(0.0001, startAt);
  envelope.gain.linearRampToValueAtTime(volume, startAt + 0.045);
  envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  oscillator.connect(envelope);
  envelope.connect(destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

export function useBirthdayMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');
  const contextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const beatIndexRef = useRef(0);

  const stopMusic = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const context = contextRef.current;
    const masterGain = masterGainRef.current;
    if (context && masterGain && context.state !== 'closed') {
      const now = context.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setTargetAtTime(0.0001, now, 0.045);
    }
    setIsPlaying(false);
  }, []);

  const startMusic = useCallback(async () => {
    try {
      if (typeof window.AudioContext !== 'function') {
        setError('Music playback is not available in this browser.');
        return;
      }

      const context =
        contextRef.current ?? new window.AudioContext({ latencyHint: 'interactive' });
      contextRef.current = context;

      if (!masterGainRef.current) {
        const masterGain = context.createGain();
        masterGain.gain.setValueAtTime(0.0001, context.currentTime);
        masterGain.connect(context.destination);
        masterGainRef.current = masterGain;
      }

      await context.resume();
      setError('');

      const now = context.currentTime;
      const masterGain = masterGainRef.current;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(Math.max(masterGain.gain.value, 0.0001), now);
      masterGain.gain.linearRampToValueAtTime(0.28, now + 0.2);

      let nextBeatAt = now + 0.05;
      const scheduleAhead = () => {
        while (nextBeatAt < context.currentTime + 0.16) {
          const step = beatIndexRef.current % melody.length;
          const measure = Math.floor(step / 3) % chordRoots.length;
          const root = chordRoots[measure];

          if (step % 3 === 0) {
            [root, root + 4, root + 7].forEach((note, chordTone) => {
              playTone(
                context,
                masterGain,
                midiToFrequency(note + (chordTone === 2 ? 12 : 0)),
                nextBeatAt,
                beatSeconds * 2.75,
                0.018,
              );
            });
            playTone(
              context,
              masterGain,
              midiToFrequency(root - 12),
              nextBeatAt,
              beatSeconds * 0.82,
              0.038,
              'triangle',
            );
          }

          playTone(
            context,
            masterGain,
            midiToFrequency(melody[step]),
            nextBeatAt,
            beatSeconds * 0.68,
            0.095,
          );
          if (step % 3 === 2) {
            playTone(
              context,
              masterGain,
              midiToFrequency(melody[step] + 12),
              nextBeatAt,
              beatSeconds * 0.9,
              0.022,
            );
          }

          beatIndexRef.current += 1;
          nextBeatAt += beatSeconds;
        }
      };

      scheduleAhead();
      timerRef.current = window.setInterval(scheduleAhead, 45);
      setIsPlaying(true);
    } catch {
      stopMusic();
      setError('The birthday music could not be started. Please try again.');
    }
  }, [stopMusic]);

  const toggleMusic = useCallback(() => {
    if (isPlaying) {
      stopMusic();
    } else {
      void startMusic();
    }
  }, [isPlaying, startMusic, stopMusic]);

  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
      if (contextRef.current && contextRef.current.state !== 'closed') {
        void contextRef.current.close();
      }
    },
    [],
  );

  return { isPlaying, error, toggleMusic };
}
