const { build } = require('vite');

(async () => {
  try {
    await build({
      configFile: './vite.config.js',
      build: {
        rollupOptions: {
          onwarn(warning, defaultHandler) {
            console.warn('ADVERTENCIA ROLLUP:', warning.message);
          }
        }
      }
    });
    console.log('¡BUILD COMPLETADO EXITOSAMENTE!');
  } catch (error) {
    console.error('=== ERROR ROLLUP COMPLETO ===');
    console.error('Mensaje:', error.message);
    if (error.id) console.error('Archivo (id):', error.id);
    if (error.loc) console.error('Ubicación:', error.loc);
    if (error.frame) console.error('Código donde falló:\n', error.frame);
    if (error.stack) console.error('Stack:', error.stack);
  }
})();
