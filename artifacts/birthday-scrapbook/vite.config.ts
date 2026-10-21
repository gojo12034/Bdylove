import path from 'path';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import type { Plugin, ViteDevServer } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    'BASE_PATH environment variable is required but was not provided.',
  );
}

const photoExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.webp']);
const videoExtensions = new Set(['.m4v', '.mov', '.mp4', '.ogv', '.webm']);

function publicPhotosPlugin(): Plugin {
  let publicDir = '';
  let manifestPath = '';
  let videoManifestPath = '';
  
  let devServer: ViteDevServer | undefined;
  let refreshTimer: ReturnType<typeof setTimeout> | undefined;
  let manifestQueue: Promise<void> = Promise.resolve();

  async function findMedia(directory: string, extensions: Set<string>): Promise<string[]> {
    const entries = await readdir(directory, { withFileTypes: true });
    const found = await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) return findMedia(entryPath, extensions);
        if (
          entry.isFile() &&
          extensions.has(path.extname(entry.name).toLowerCase())
        ) {
          return [entryPath];
        }
        return [];
      }),
    );
    return found.flat();
  }

  function toManifestEntry(filePath: string) {
    const filename = path.basename(filePath, path.extname(filePath));
    const readableName = filename
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const relativeUrl = path
      .relative(publicDir, filePath)
      .split(path.sep)
      .map(encodeURIComponent)
      .join('/');

    return {
      src: relativeUrl,
      name: filename,
      title: readableName || 'A favorite moment',
    };
  }

  async function writeMediaManifests() {
    await mkdir(publicDir, { recursive: true });
    const [photos, videos] = await Promise.all([
      findMedia(publicDir, photoExtensions),
      findMedia(publicDir, videoExtensions),
    ]);
    const sortedPhotos = photos.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
    );
    const sortedVideos = videos.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
    );

    await Promise.all([
      writeFile(
        manifestPath,
        `${JSON.stringify(sortedPhotos.map(toManifestEntry), null, 2)}\n`,
      ),
      writeFile(
        videoManifestPath,
        `${JSON.stringify(sortedVideos.map(toManifestEntry), null, 2)}\n`,
      ),
    ]);
  }

  function scheduleManifestRefresh() {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      manifestQueue = manifestQueue
        .then(async () => {
          await writeMediaManifests();
          devServer?.ws.send({ type: 'full-reload' });
        })
        .catch((error: unknown) => {
          const detail = error instanceof Error ? error.message : String(error);
          devServer?.config.logger.error(
            `Failed to refresh the public photo list: ${detail}`,
          );
        });
    }, 150);
  }

  return {
    name: 'birthday-public-photos',
    async configResolved(config) {
      publicDir = config.publicDir;
      manifestPath = path.join(publicDir, 'photos.json');
      videoManifestPath = path.join(publicDir, 'videos.json');
      
      await writeMediaManifests();
    },
    async buildStart() {
      await writeMediaManifests();
    },
    configureServer(server) {
      devServer = server;
      server.watcher.add(publicDir);

      const onMediaChange = (filePath: string) => {
        const relativePath = path.relative(publicDir, filePath);
        if (
          relativePath === '' ||
          relativePath === '..' ||
          relativePath.startsWith(`..${path.sep}`) ||
          path.isAbsolute(relativePath)
        ) {
          return;
        }
        const extension = path.extname(filePath).toLowerCase();
        if (!photoExtensions.has(extension) && !videoExtensions.has(extension)) {
          return;
        }
        scheduleManifestRefresh();
      };
      const events = ['add', 'change', 'unlink', 'addDir', 'unlinkDir'] as const;
      events.forEach((event) => server.watcher.on(event, onMediaChange));

      server.httpServer?.once('close', () => {
        events.forEach((event) => server.watcher.off(event, onMediaChange));
        if (refreshTimer) clearTimeout(refreshTimer);
      });
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    publicPhotosPlugin(),
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, 'index.html'),
        standalone: path.resolve(import.meta.dirname, 'birthday-scrapbook.html'),
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
