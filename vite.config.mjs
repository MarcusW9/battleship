import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages serves this project from https://<user>.github.io/battleship/,
  // not from the domain root, so every built asset URL needs the repo name
  // prefixed. Without this, index.html would request /assets/... and 404.
  base: '/battleship/',
});
