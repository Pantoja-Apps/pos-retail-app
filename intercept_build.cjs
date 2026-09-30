process.on('uncaughtException', (err) => {
  console.error('=== EXCEPCION NO CAPTURADA ===\n', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('=== PROMESA RECHAZADA ===\n', reason);
});

const originalExit = process.exit;
process.exit = function (code) {
  if (code !== 0) {
    console.error('=== process.exit llamado con código:', code);
    console.error(new Error('Traza de la llamada a exit').stack);
  }
  return originalExit.apply(this, arguments);
};

const { build } = require('vite');

build({
  configFile: './vite.config.js',
  logLevel: 'silent'
}).catch(err => {
  console.error('=== ERROR CAPTURADO EN BUILD ===\n', err);
});
