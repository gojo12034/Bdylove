import { useCallback, useEffect, useRef, useState } from 'react';

export function useBirthdayMusic(source: string) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playMusic = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      await audio.play();
      setError('');
    } catch (playError) {
      if (
        playError instanceof DOMException &&
        playError.name === 'NotAllowedError'
      ) {
        setError('Automatic music was blocked. Tap Play music to start it.');
      } else {
        setError('The uploaded music could not be played. Please try again.');
      }
    }
  }, []);

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      void playMusic();
    } else {
      audio.pause();
    }
  }, [playMusic]);

  useEffect(() => {
    const audio = new Audio(source);
    let disposed = false;
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0.45;
    audioRef.current = audio;

    const handlePlay = () => {
      setIsPlaying(true);
      setError('');
    };
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      setError('The uploaded music file could not be loaded.');
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);
    void audio.play().catch((playError: unknown) => {
      if (disposed) return;
      if (
        playError instanceof DOMException &&
        playError.name === 'NotAllowedError'
      ) {
        setError('Automatic music was blocked. Tap Play music to start it.');
      } else {
        setError('The uploaded music could not be played. Please try again.');
      }
    });

    return () => {
      disposed = true;
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      if (audioRef.current === audio) audioRef.current = null;
    };
  }, [source]);

  return { isPlaying, error, toggleMusic };
}
