import adapter from '@sveltejs/adapter-static';
import { defineConfig } from 'vite';

const isDev = process.env.NODE_ENV === 'development';
const repoName = 'algorithm-visualizer';

export default {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: null
    }),
    paths: {
      base: isDev ? '' : `/${repoName}`
    }
  },
  vite: defineConfig({})
};
