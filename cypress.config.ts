import { defineConfig } from 'cypress';

export default defineConfig({
  // Options vidéo (globales, à la racine)
  video: true,
  videoCompression: 32,
  videosFolder: 'cypress/videos',       // dossier de sortie des vidéos
  trashAssetsBeforeRuns: true,          // nettoie vidéos/screenshots avant chaque run

  // Options screenshots
  screenshotOnRunFailure: true,         // capture auto en cas d'échec (true par défaut)
  screenshotsFolder: 'cypress/screenshots',

  e2e: {
    baseUrl: 'http://localhost:4200',
    setupNodeEvents(on, config) {
      // Événements d'écoute si besoin
    },
  },
});