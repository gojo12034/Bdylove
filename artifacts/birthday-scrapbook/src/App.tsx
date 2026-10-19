import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
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

type Memory = {
  number: string;
  chapter: string;
  title: string;
  text: string;
  caption: string;
  image?: string;
  alt?: string;
};

type BirthdayCopy = {
  brandName: string;
  topNote: string;
  music: { playLabel: string; pauseLabel: string };
  photoHint: string;
  media: {
    addedPhotoChapter: string;
    addedPhotoDescription: string;
    videoChapter: string;
    videoDescription: string;
    videoHint: string;
    photoLoadError: string;
  };
  hero: {
    eyebrow: string;
    headlineStart: string;
    headlineAccent: string;
    description: string;
    linkLabel: string;
    photo: string;
    photoAlt: string;
    photoTitle: string;
    photoLabel: string;
  };
  intro: { before: string; highlight: string };
  memoriesHeading: { kicker: string; title: string; description: string };
  memories: Memory[];
  letter: {
    to: string;
    titleStart: string;
    titleRecipient: string;
    paragraph: string;
    signoff: string;
    signoffName: string;
    small: string;
  };
  button: { href: string; label: string; ariaLabel: string; footerNote: string };
};

function hasTextFields(value: unknown, fields: string[]): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return fields.every((field) => typeof record[field] === 'string');
}

function isBirthdayCopy(value: unknown): value is BirthdayCopy {
  if (typeof value !== 'object' || value === null) return false;
  const copy = value as Record<string, unknown>;
  return (
    hasTextFields(copy, ['brandName', 'topNote', 'photoHint']) &&
    hasTextFields(copy.music, ['playLabel', 'pauseLabel']) &&
    hasTextFields(copy.media, [
      'addedPhotoChapter',
      'addedPhotoDescription',
      'videoChapter',
      'videoDescription',
      'videoHint',
      'photoLoadError',
    ]) &&
    hasTextFields(copy.hero, [
      'eyebrow',
      'headlineStart',
      'headlineAccent',
      'description',
      'linkLabel',
      'photo',
      'photoAlt',
      'photoTitle',
      'photoLabel',
    ]) &&
    hasTextFields(copy.intro, ['before', 'highlight']) &&
    hasTextFields(copy.memoriesHeading, ['kicker', 'title', 'description']) &&
    Array.isArray(copy.memories) &&
    copy.memories.length >= 8 &&
    copy.memories.every(
      (memory) =>
        typeof memory === 'object' &&
        memory !== null &&
        hasTextFields(memory, [
          'number',
          'chapter',
          'title',
          'text',
          'caption',
        ]) &&
        (memory.image === undefined || typeof memory.image === 'string') &&
        (memory.alt === undefined || typeof memory.alt === 'string'),
    ) &&
    hasTextFields(copy.letter, [
      'to',
      'titleStart',
      'titleRecipient',
      'paragraph',
      'signoff',
      'signoffName',
      'small',
    ]) &&
    hasTextFields(copy.button, [
      'href',
      'label',
      'ariaLabel',
      'footerNote',
    ])
  );
}

function normalizedAssetName(src: string) {
  try {
    return decodeURIComponent(src).replace(/^\/+/, '');
  } catch {
    return src.replace(/^\/+/, '');
  }
}

function TypingText({ text }: { text: string }) {
  return (
    <span className="typing-text">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {Array.from(text).map((character, index) => (
          <span
            className="typing-char"
            key={`${index}-${character}`}
            style={{ '--type-delay': `${index * 55}ms` } as CSSProperties}
          >
            {character}
          </span>
        ))}
      </span>
    </span>
  );
}

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
  const [copy, setCopy] = useState<BirthdayCopy | null>(null);
  const [copyLoadError, setCopyLoadError] = useState('');
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

    async function loadCopy() {
      try {
        const response = await fetch(publicAssetUrl('content.json'), {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error(`The scrapbook text could not be loaded (${response.status})`);
        }
        const data: unknown = await response.json();
        if (!isBirthdayCopy(data)) {
          throw new Error('The scrapbook text file is missing required content');
        }
        if (!cancelled) setCopy(data);
      } catch (error) {
        if (!cancelled) {
          setCopyLoadError(
            error instanceof Error
              ? error.message
              : 'The scrapbook text could not be loaded.',
          );
        }
      }
    }

    void loadCopy();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!copy) return;
    const currentCopy = copy;
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
            [
              currentCopy.hero.photo,
              ...currentCopy.memories.flatMap((memory) =>
                memory.image ? [memory.image] : [],
              ),
            ].map(normalizedAssetName),
          );
          setPublicPhotos(
            photoData.filter(
              (photo) => !alreadyShown.has(normalizedAssetName(photo.src)),
            ),
          );
          setPublicVideos(videoData);
        }
      } catch {
        if (!cancelled) {
          setPhotoLoadError(
            currentCopy.media.photoLoadError,
          );
        }
      }
    }

    void loadPublicPhotos();
    return () => {
      cancelled = true;
    };
  }, [copy]);

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
            // A memory's photo owns its reveal, not the height of the entire card.
            const reveal = entry.target.closest('.reveal');
            reveal?.classList.add('is-visible');
            currentObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -20% 0px' },
    );
    targets.forEach((target) => {
      if (!target.classList.contains('is-visible')) {
        observer.observe(target.querySelector('.memory-art') ?? target);
      }
    });
    return () => observer.disconnect();
  }, [copy?.memories.length, publicPhotos.length, publicVideos.length]);

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

  if (!copy) {
    return (
      <main
        className="scrapbook content-loading"
        role={copyLoadError ? 'alert' : 'status'}
      >
        {copyLoadError || 'Opening your birthday scrapbook…'}
      </main>
    );
  }

  return (
    <>
    <main className="scrapbook">
      <div className="ambient-birthday" aria-hidden="true">
        <span className="ambient-shape ambient-heart ambient-heart-one">♡</span>
        <span className="ambient-shape ambient-star ambient-star-one">✦</span>
        <span className="ambient-shape ambient-heart ambient-heart-two">♡</span>
        <span className="ambient-shape ambient-star ambient-star-two">✧</span>
        <span className="ambient-shape ambient-heart ambient-heart-three">♡</span>
        <span className="ambient-shape ambient-flower ambient-flower-one">✿</span>
        <span className="ambient-shape ambient-flower ambient-flower-two">❀</span>
        <span className="ambient-shape ambient-flower ambient-flower-three">✿</span>
        <span className="ambient-shape ambient-flower ambient-flower-four">❀</span>
        <span className="ambient-shape ambient-balloon ambient-balloon-one" />
        <span className="ambient-shape ambient-balloon ambient-balloon-two" />
        <span className="ambient-shape ambient-balloon ambient-balloon-three" />
        <span className="ambient-shape ambient-orb ambient-orb-one" />
        <span className="ambient-shape ambient-orb ambient-orb-two" />
      </div>
      <a className="skip-link" href="#memories">Skip to the memories</a>
      <header className="topbar">
        <div className="brand">
          <svg className="brand-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M16 27s-11-6.8-11-15a6.2 6.2 0 0 1 11-3.9A6.2 6.2 0 0 1 27 12c0 8.2-11 15-11 15Z" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span>{copy.brandName}</span>
        </div>
        <span className="topbar-note">{copy.topNote}</span>
        <div className="music-control">
          <button
            className="music-button"
            type="button"
            onClick={toggleMusic}
            aria-pressed={isPlaying}
            aria-label={isPlaying ? copy.music.pauseLabel : copy.music.playLabel}
            data-testid="button-music-toggle"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 18V5l12-2v13M9 18c0 1.1-1.3 2-3 2s-3-.9-3-2 1.3-2 3-2 3 .9 3 2Zm12-2c0 1.1-1.3 2-3 2s-3-.9-3-2 1.3-2 3-2 3 .9 3 2ZM9 8l12-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{isPlaying ? copy.music.pauseLabel : copy.music.playLabel}</span>
          </button>
          <span className="music-status" role="status" aria-live="polite">{musicError}</span>
        </div>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <span className="eyebrow">{copy.hero.eyebrow}</span>
          <h1 id="hero-title"><TypingText text={copy.hero.headlineStart} /><br /><em><TypingText text={copy.hero.headlineAccent} /></em></h1>
          <p className="hero-description">{copy.hero.description}</p>
          <a className="hero-link" href="#memories">
            {copy.hero.linkLabel}
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 3v13m0 0 5-5m-5 5-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>
        </div>
        <div className="hero-art">
          <Heart className="heart-one" /><Heart className="heart-two" /><Heart className="heart-three" />
          <button
            className="hero-photo photo-trigger"
            type="button"
            onClick={(event) => openPhoto(event, {
              src: publicAssetUrl(copy.hero.photo),
              alt: copy.hero.photoAlt,
              title: copy.hero.photoTitle,
            })}
            aria-label="Enlarge the cover photo"
          >
            <span className="tape" aria-hidden="true" />
            <img src={publicAssetUrl(copy.hero.photo)} alt={copy.hero.photoAlt} />
            <span className="photo-zoom-hint">{copy.photoHint}</span>
            <span className="photo-label">{copy.hero.photoLabel}</span>
          </button>
          <div className="floating-stamp" aria-hidden="true">you make<br />life lovely</div>
        </div>
      </section>

      <p className="intro-note reveal">
        <TypingText text={copy.intro.before} />
        <span><TypingText text={copy.intro.highlight} /></span>
      </p>

      <section className="memory-section" id="memories" aria-labelledby="memory-heading">
        <div className="section-heading reveal">
          <span className="section-kicker">{copy.memoriesHeading.kicker}</span>
          <h2 id="memory-heading"><TypingText text={copy.memoriesHeading.title} /></h2>
          <p>{copy.memoriesHeading.description}</p>
        </div>
        {photoLoadError && <p className="photo-load-error" role="alert">{photoLoadError}</p>}
        {copy.memories.map((memory) => (
          <article
            className={`memory reveal${memory.image ? '' : ' text-only-memory'}`}
            key={memory.number}
          >
            {memory.image && (
              <button
                className="memory-art photo-trigger"
                type="button"
                onClick={(event) => openPhoto(event, {
                  src: publicAssetUrl(memory.image!),
                  alt: memory.alt || memory.title,
                  title: memory.title,
                })}
                aria-label={`Enlarge photo: ${memory.title}`}
              >
                <img src={publicAssetUrl(memory.image)} alt={memory.alt || memory.title} loading="lazy" />
                <span className="photo-zoom-hint">{copy.photoHint}</span>
              </button>
            )}
            <div className="memory-copy">
              <span className="memory-index">{memory.number} / {memory.chapter}</span>
              <h3><TypingText text={memory.title} /></h3>
              <p><TypingText text={memory.text} /></p>
              <p className="memory-caption"><TypingText text={memory.caption} /></p>
            </div>
          </article>
        ))}
        {publicPhotos.map((photo, index) => {
          const number = String(copy.memories.length + index + 1).padStart(2, '0');
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
                <span className="photo-zoom-hint">{copy.photoHint}</span>
              </button>
              <div className="memory-copy">
                <span className="memory-index">{number} / {copy.media.addedPhotoChapter}</span>
                <h3><TypingText text={photo.title} /></h3>
                <p><TypingText text={copy.media.addedPhotoDescription} /></p>
                <p className="memory-caption"><TypingText text={photo.title} /></p>
              </div>
            </article>
          );
        })}
        {publicVideos.map((video, index) => {
          const number = String(
            copy.memories.length + publicPhotos.length + index + 1,
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
                <span className="photo-zoom-hint">{copy.media.videoHint}</span>
              </button>
              <div className="memory-copy">
                <span className="memory-index">{number} / {copy.media.videoChapter}</span>
                <h3><TypingText text={video.title} /></h3>
                <p><TypingText text={copy.media.videoDescription} /></p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="birthday-note" aria-labelledby="letter-heading">
        <div className="letter-card reveal">
          <svg className="letter-flourish" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M16 27s-11-6.8-11-15a6.2 6.2 0 0 1 11-3.9A6.2 6.2 0 0 1 27 12c0 8.2-11 15-11 15Z" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          <p className="letter-to"><TypingText text={copy.letter.to} /></p>
          <h2 id="letter-heading"><TypingText text={copy.letter.titleStart} /><br /><TypingText text={copy.letter.titleRecipient} /></h2>
          <p><TypingText text={copy.letter.paragraph} /></p>
          <p className="letter-signoff"><TypingText text={copy.letter.signoff} /><br /><TypingText text={copy.letter.signoffName} /></p>
          <span className="letter-small">{copy.letter.small}</span>
        </div>
      </section>
      <footer className="footer">
        <a
          className="birthday-cta"
          href={copy.button.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={copy.button.ariaLabel}
        >
          <span>{copy.button.label}</span>
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="m10 2 1.4 5.1L16 9l-4.6 1.8L10 16l-1.4-5.2L4 9l4.6-1.9L10 2Zm7 10 .8 2.3L20 15l-2.2.8L17 18l-.8-2.2L14 15l2.2-.7L17 12Z" fill="currentColor" />
          </svg>
        </a>
        <span>{copy.button.footerNote}</span>
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
