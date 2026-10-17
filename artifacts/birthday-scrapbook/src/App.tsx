import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { useBirthdayMusic } from '@/hooks/use-birthday-music';

type PublicPhoto = {
  src: string;
  name: string;
  title: string;
};

type PublicVideo = {
  src: string;
  name: string;
  title: string;
};

type ZoomMedia =
  | { kind: 'photo'; src: string; alt: string; title: string }
  | { kind: 'video'; src: string; poster: string; title: string };

function isPublicPhoto(value: unknown): value is PublicPhoto {
  if (typeof value !== 'object' || value === null) return false;
  const photo = value as Record<string, unknown>;
  return (
    typeof photo.src === 'string' &&
    typeof photo.name === 'string' &&
    typeof photo.title === 'string'
  );
}

function isPublicVideo(value: unknown): value is PublicVideo {
  if (typeof value !== 'object' || value === null) return false;
  const video = value as Record<string, unknown>;
  return (
    typeof video.src === 'string' &&
    typeof video.name === 'string' &&
    typeof video.title === 'string'
  );
}

function publicAssetUrl(src: string) {
  return `${import.meta.env.BASE_URL}${src.replace(/^\/+/, '')}`;
}

const memories = [
  // EDIT TEXT: Replace these story numbers, titles, sentences, and captions.
  {
    number: '01 / The little things',
    title: 'A day worth keeping',
    text: 'Some days do not need a reason to become a favorite. This is a place for the ordinary, lovely moments that somehow stay with you.',
    caption: 'Replace this sample caption with a detail only the two of you remember.',
    // SAMPLE IMAGE — replace /sample-memory-2.jpg with your own photo; this illustration is not the recipient.
    image: '/sample-memory-2.jpg',
    alt: 'Illustrative sample photo of a smiling couple sharing coffee at a small outdoor table',
  },
  {
    number: '02 / Out somewhere',
    title: 'The long way home',
    text: 'A winding road, a playlist that got repeated, and nowhere in particular we had to be. I would take the scenic route with you every time.',
    caption: 'Swap in a real adventure and the sentence you always say about it.',
    // SAMPLE IMAGE — replace /sample-memory-3.jpg with your own photo; this illustration is not the recipient.
    image: '/sample-memory-3.jpg',
    alt: 'Illustrative sample photo of a couple walking hand in hand along a coastal path at golden hour',
  },
  {
    number: '03 / A favorite afternoon',
    title: 'Nothing on the calendar',
    text: 'The best plans are sometimes no plans at all. A slow afternoon with you has a way of making the whole world feel softer around the edges.',
    caption: 'Add a private in-joke, a favorite café, or the story behind this day.',
    // SAMPLE IMAGE — replace /sample-memory-4.jpg with your own photo; this illustration is not the recipient.
    image: '/sample-memory-4.jpg',
    alt: 'Illustrative sample close-up of two hands resting together among small wildflowers',
  },
  {
    number: '04 / Still my favorite',
    title: 'Here, with you',
    text: 'If I could keep one feeling in a little glass jar, it would be this: being beside you, listening to you laugh, and knowing I get to call you mine.',
    caption: 'Replace this with the words you want her to remember.',
    // SAMPLE IMAGE — replace /sample-memory-1.jpg with your own photo; this illustration is not the recipient.
    image: '/sample-memory-1.jpg',
    alt: 'Illustrative sample photo of two people walking hand in hand on a beach at sunset',
  },
];

function Heart({ className = '' }: { className?: string }) {
  return (
    <span className={`float-heart ${className}`} aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        <path d="M16 27s-11-6.8-11-15a6.2 6.2 0 0 1 11-3.9A6.2 6.2 0 0 1 27 12c0 8.2-11 15-11 15Z" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    </span>
  );
}

function App() {
  const { isPlaying, error: musicError, toggleMusic } = useBirthdayMusic(
    publicAssetUrl('/sample-music.mp3'),
  );
  const [publicPhotos, setPublicPhotos] = useState<PublicPhoto[]>([]);
  const [publicVideos, setPublicVideos] = useState<PublicVideo[]>([]);
  const [photoLoadError, setPhotoLoadError] = useState('');
  const [activeMedia, setActiveMedia] = useState<ZoomMedia | null>(null);
  const photoCloseButtonRef = useRef<HTMLButtonElement>(null);
  const photoTriggerRef = useRef<HTMLButtonElement | null>(null);

  function openPhoto(
    event: MouseEvent<HTMLButtonElement>,
    photo: { src: string; alt: string; title: string },
  ) {
    photoTriggerRef.current = event.currentTarget;
    setActiveMedia({ kind: 'photo', ...photo });
  }

  function openVideo(event: MouseEvent<HTMLButtonElement>, video: PublicVideo) {
    photoTriggerRef.current = event.currentTarget;
    setActiveMedia({
      kind: 'video',
      src: publicAssetUrl(video.src),
      poster: publicAssetUrl('/sample-memory-7.jpg'),
      title: video.title,
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function loadPublicPhotos() {
      try {
        const [photoResponse, videoResponse] = await Promise.all([
          fetch(publicAssetUrl('photos.json'), { cache: 'no-store' }),
          fetch(publicAssetUrl('videos.json'), { cache: 'no-store' }),
        ]);
        if (!photoResponse.ok || !videoResponse.ok) {
          throw new Error('The public media lists could not be loaded');
        }
        const [photoData, videoData]: [unknown, unknown] = await Promise.all([
          photoResponse.json(),
          videoResponse.json(),
        ]);
        if (
          !Array.isArray(photoData) ||
          !photoData.every(isPublicPhoto) ||
          !Array.isArray(videoData) ||
          !videoData.every(isPublicVideo)
        ) {
          throw new Error('A public media list has an invalid format');
        }
        if (!cancelled) {
          const alreadyShown = new Set(
            memories.map((memory) => memory.image.replace(/^\/+/, '')),
          );
          alreadyShown.add('sample-memory-1.jpg');
          setPublicPhotos(
            photoData.filter(
              (photo) => !alreadyShown.has(decodeURIComponent(photo.src)),
            ),
          );
          setPublicVideos(videoData);
        }
      } catch {
        if (!cancelled) {
          setPhotoLoadError(
            'Photos or videos could not be loaded. Check the public folder and refresh the page.',
          );
        }
      }
    }

    void loadPublicPhotos();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>('.reveal');
    if (!('IntersectionObserver' in window)) {
      targets.forEach((target) => target.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            currentObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [publicPhotos.length, publicVideos.length]);

  useEffect(() => {
    if (!activeMedia) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveMedia(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    photoCloseButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      photoTriggerRef.current?.focus();
    };
  }, [activeMedia]);

  return (
    <>
    <main className="scrapbook">
      <div className="ambient-birthday" aria-hidden="true">
        <span className="ambient-shape ambient-heart ambient-heart-one">♡</span>
        <span className="ambient-shape ambient-star ambient-star-one">✦</span>
        <span className="ambient-shape ambient-heart ambient-heart-two">♡</span>
        <span className="ambient-shape ambient-star ambient-star-two">✧</span>
        <span className="ambient-shape ambient-heart ambient-heart-three">♡</span>
        <span className="ambient-shape ambient-orb ambient-orb-one" />
        <span className="ambient-shape ambient-orb ambient-orb-two" />
      </div>
      <a className="skip-link" href="#memories">Skip to the memories</a>
      <header className="topbar">
        <div className="brand">
          <svg className="brand-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M16 27s-11-6.8-11-15a6.2 6.2 0 0 1 11-3.9A6.2 6.2 0 0 1 27 12c0 8.2-11 15-11 15Z" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span>A little book of us</span>
        </div>
        <span className="topbar-note">Made for your birthday</span>
        <div className="music-control">
          <button
            className="music-button"
            type="button"
            onClick={toggleMusic}
            aria-pressed={isPlaying}
            aria-label={isPlaying ? 'Pause the birthday music' : 'Play the birthday music'}
            data-testid="button-music-toggle"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 18V5l12-2v13M9 18c0 1.1-1.3 2-3 2s-3-.9-3-2 1.3-2 3-2 3 .9 3 2Zm12-2c0 1.1-1.3 2-3 2s-3-.9-3-2 1.3-2 3-2 3 .9 3 2ZM9 8l12-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{isPlaying ? 'Pause music' : 'Play music'}</span>
          </button>
          <span className="music-status" role="status" aria-live="polite">{musicError}</span>
        </div>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          {/* EDIT TEXT: Update the short intro, headline, and description here. */}
          <span className="eyebrow">For the one who makes every day brighter</span>
          <h1 id="hero-title">Today is<br />all <em>about you.</em></h1>
          <p className="hero-description">A few favorite moments, a whole lot of love, and one more reason to celebrate the person you are.</p>
          <a className="hero-link" href="#memories">
            Turn the page
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 3v13m0 0 5-5m-5 5-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>
        </div>
        <div className="hero-art">
          <Heart className="heart-one" /><Heart className="heart-two" /><Heart className="heart-three" />
          <button
            className="hero-photo photo-trigger"
            type="button"
            onClick={(event) => openPhoto(event, {
              src: publicAssetUrl('/sample-memory-1.jpg'),
              alt: 'Illustrative sample photo of two people walking hand in hand on a beach at sunset',
              title: 'Our favorite kind of day',
            })}
            aria-label="Enlarge the cover photo"
          >
            <span className="tape" aria-hidden="true" />
            {/* SAMPLE IMAGE — replace /sample-memory-1.jpg with your own photograph; this illustration is not the recipient. */}
            <img src={publicAssetUrl('/sample-memory-1.jpg')} alt="Illustrative sample photo of two people walking hand in hand on a beach at sunset" />
            <span className="photo-zoom-hint">Tap to zoom</span>
            <span className="photo-label">our favorite kind of day</span>
          </button>
          <div className="floating-stamp" aria-hidden="true">you make<br />life lovely</div>
        </div>
      </section>

      <p className="intro-note reveal">For all the little moments that became <span>our favorite memories.</span></p>

      <section className="memory-section" id="memories" aria-labelledby="memory-heading">
        <div className="section-heading reveal">
          <span className="section-kicker">A few pages from my favorite story</span>
          <h2 id="memory-heading">The moments I keep</h2>
          <p>Tap a photo to see it up close. New photos in the public folder appear here automatically.</p>
        </div>
        {photoLoadError && <p className="photo-load-error" role="alert">{photoLoadError}</p>}
        {memories.map((memory) => (
          <article className="memory reveal" key={memory.number}>
            <button
              className="memory-art photo-trigger"
              type="button"
              onClick={(event) => openPhoto(event, {
                src: publicAssetUrl(memory.image),
                alt: memory.alt,
                title: memory.title,
              })}
              aria-label={`Enlarge photo: ${memory.title}`}
            >
              <img src={publicAssetUrl(memory.image)} alt={memory.alt} loading="lazy" />
              <span className="photo-zoom-hint">Tap to zoom</span>
            </button>
            <div className="memory-copy">
              <span className="memory-index">{memory.number}</span>
              <h3>{memory.title}</h3>
              <p>{memory.text}</p>
              <p className="memory-caption">{memory.caption}</p>
            </div>
          </article>
        ))}
        {publicPhotos.map((photo, index) => {
          const number = String(memories.length + index + 1).padStart(2, '0');
          return (
            <article className="memory reveal" key={photo.src}>
              <button
                className="memory-art photo-trigger"
                type="button"
                onClick={(event) => openPhoto(event, {
                  src: publicAssetUrl(photo.src),
                  alt: `Added scrapbook photo: ${photo.title}`,
                  title: photo.title,
                })}
                aria-label={`Enlarge photo: ${photo.title}`}
              >
                <img
                  src={publicAssetUrl(photo.src)}
                  alt={`Added scrapbook photo: ${photo.title}`}
                  loading="lazy"
                />
                <span className="photo-zoom-hint">Tap to zoom</span>
              </button>
              <div className="memory-copy">
                <span className="memory-index">{number} / Added photo</span>
                <h3>{photo.title}</h3>
                <p>A favorite moment added to this birthday scrapbook.</p>
                <p className="memory-caption">{photo.title}</p>
              </div>
            </article>
          );
        })}
        {publicVideos.map((video, index) => {
          const number = String(
            memories.length + publicPhotos.length + index + 1,
          ).padStart(2, '0');
          return (
            <article className="memory reveal memory-video" key={video.src}>
              <button
                className="memory-art memory-video-art video-trigger"
                type="button"
                onClick={(event) => openVideo(event, video)}
                aria-label={`Open video: ${video.title}`}
              >
                <img src={publicAssetUrl('/sample-memory-7.jpg')} alt={`Preview for video: ${video.title}`} loading="lazy" />
                <span className="video-play-mark" aria-hidden="true">▶</span>
                <span className="photo-zoom-hint">Tap to watch</span>
              </button>
              <div className="memory-copy">
                <span className="memory-index">{number} / A moving memory</span>
                <h3>{video.title}</h3>
                <p>A little piece of this story, in motion. Press play to watch.</p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="birthday-note" aria-labelledby="letter-heading">
        <div className="letter-card reveal">
          {/* EDIT TEXT: Replace the greeting, recipient, letter, and sign-off. */}
          <svg className="letter-flourish" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M16 27s-11-6.8-11-15a6.2 6.2 0 0 1 11-3.9A6.2 6.2 0 0 1 27 12c0 8.2-11 15-11 15Z" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          <p className="letter-to">To my favorite person,</p>
          <h2 id="letter-heading">Happy birthday,<br />Ashley</h2>
          <p>Another year of you in this world is a gift to everyone lucky enough to know you. Thank you for your kind heart, your bright laugh, and the way you make even the quietest moments feel like home. I hope this next trip around the sun brings you all the tenderness and joy you give so freely to everyone around you.</p>
          <p className="letter-signoff">All my love,<br />Billy</p>
          <span className="letter-small"></span>
        </div>
      </section>
      <footer className="footer">
        {/* EDIT LINK: Replace the destination and visible button label here. */}
        <a
          className="birthday-cta"
          href="https://for-bday.onrender.com/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Click to open your special birthday link in a new tab"
        >
          Click
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M11 3h6v6m0-6-8 8M15 11v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
        <span>A small keepsake for a very big love.</span>
      </footer>
    </main>
    {activeMedia && createPortal(
      <div
        className="photo-lightbox"
        role="dialog"
        aria-modal="true"
        aria-label={`${activeMedia.kind === 'video' ? 'Enlarged video' : 'Enlarged photo'}: ${activeMedia.title}`}
        onClick={() => setActiveMedia(null)}
      >
        <button
          className="lightbox-close"
          type="button"
          ref={photoCloseButtonRef}
          onClick={() => setActiveMedia(null)}
          aria-label="Close enlarged media"
        >
          <span aria-hidden="true">×</span>
        </button>
        <figure className="lightbox-frame" onClick={(event) => event.stopPropagation()}>
          {activeMedia.kind === 'photo' ? (
            <img src={activeMedia.src} alt={activeMedia.alt} />
          ) : (
            <video
              src={activeMedia.src}
              poster={activeMedia.poster}
              controls
              autoPlay
              playsInline
              aria-label={`Play video: ${activeMedia.title}`}
            />
          )}
          <figcaption>{activeMedia.title}</figcaption>
        </figure>
        <p className="lightbox-instruction">Press Esc or click outside the photo to close</p>
      </div>,
      document.body,
    )}
    </>
  );
}

export default App;
