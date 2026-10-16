import { useEffect, useState } from 'react';
import { useBirthdayMusic } from '@/hooks/use-birthday-music';

type PublicPhoto = {
  src: string;
  name: string;
  title: string;
};

function isPublicPhoto(value: unknown): value is PublicPhoto {
  if (typeof value !== 'object' || value === null) return false;
  const photo = value as Record<string, unknown>;
  return (
    typeof photo.src === 'string' &&
    typeof photo.name === 'string' &&
    typeof photo.title === 'string'
  );
}

const memories = [
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
  const { isPlaying, error: musicError, toggleMusic } = useBirthdayMusic();
  const [publicPhotos, setPublicPhotos] = useState<PublicPhoto[]>([]);
  const [photoLoadError, setPhotoLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadPublicPhotos() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}photos.json`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error(`Photo list request returned ${response.status}`);
        }
        const data: unknown = await response.json();
        if (!Array.isArray(data) || !data.every(isPublicPhoto)) {
          throw new Error('The public photo list has an invalid format');
        }
        if (!cancelled) setPublicPhotos(data);
      } catch {
        if (!cancelled) {
          setPhotoLoadError(
            'The extra photos could not be loaded. Check the public/photos folder and refresh the page.',
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
  }, [publicPhotos.length]);

  return (
    <main className="scrapbook">
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
          <div className="hero-photo">
            <span className="tape" aria-hidden="true" />
            {/* SAMPLE IMAGE — replace /sample-memory-1.jpg with your own photograph; this illustration is not the recipient. */}
            <img src="/sample-memory-1.jpg" alt="Illustrative sample photo of two people walking hand in hand on a beach at sunset" />
            <span className="photo-label">our favorite kind of day</span>
          </div>
          <div className="floating-stamp" aria-hidden="true">you make<br />life lovely</div>
        </div>
      </section>

      <p className="intro-note reveal">For all the little moments that became <span>our favorite memories.</span></p>
      <div className="placeholder-notice">Personalize this page: replace each SAMPLE IMAGE FILE and sample caption with your own photos and memories. These generated illustrative photos are placeholders and do not depict the birthday recipient. To add more photos automatically, put JPG, PNG, GIF, WebP, or AVIF files in public/photos.</div>

      <section className="memory-section" id="memories" aria-labelledby="memory-heading">
        <div className="section-heading reveal">
          <span className="section-kicker">A few pages from my favorite story</span>
          <h2 id="memory-heading">The moments I keep</h2>
          <p>Sample captions below are prompts to make your own. Add photos to public/photos and they’ll appear here automatically.</p>
        </div>
        {photoLoadError && <p className="photo-load-error" role="alert">{photoLoadError}</p>}
        {memories.map((memory) => (
          <article className="memory reveal" key={memory.number}>
            <div className="memory-art">
              <img src={memory.image} alt={memory.alt} loading="lazy" />
            </div>
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
              <div className="memory-art">
                <img
                  src={`${import.meta.env.BASE_URL}${photo.src}`}
                  alt={`Added scrapbook photo: ${photo.title}`}
                  loading="lazy"
                />
              </div>
              <div className="memory-copy">
                <span className="memory-index">{number} / Added photo</span>
                <h3>{photo.title}</h3>
                <p>A favorite moment added to this birthday scrapbook.</p>
                <p className="memory-caption">{photo.title}</p>
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
          <p className="letter-to">To my favorite person,</p>
          <h2 id="letter-heading">Happy birthday,<br />my love.</h2>
          <p>Another year of you in this world is a gift to everyone lucky enough to know you. Thank you for your kind heart, your bright laugh, and the way you make even the quietest moments feel like home. I hope this next trip around the sun brings you all the tenderness and joy you give so freely to everyone around you.</p>
          <p className="letter-signoff">All my love,<br />[Your name]</p>
          <span className="letter-small">Replace the name and make these words yours</span>
        </div>
      </section>
      <footer className="footer">
        {/* Replace this placeholder destination with the site you want to open. */}
        <a
          className="birthday-cta"
          href="https://example.com"
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
  );
}

export default App;
