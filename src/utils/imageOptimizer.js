/**
 * Optimiza y comprime imágenes para el POS comercial.
 * Convierte fotos de cámara (3-8 MB) en miniaturas ligeras (< 35 KB) en Base64.
 */
export async function optimizarImagen(archivoOUrl, maxAncho = 320, calidad = 0.75) {
  return new Promise((resolve, reject) => {
    let src = '';
    let esBlobLocal = false;

    if (typeof archivoOUrl === 'string') {
      src = archivoOUrl;
    } else if (archivoOUrl instanceof Blob || archivoOUrl instanceof File) {
      src = URL.createObjectURL(archivoOUrl);
      esBlobLocal = true;
    } else {
      return resolve('');
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let ancho = img.width;
      let alto = img.height;

      if (ancho > maxAncho || alto > maxAncho) {
        if (ancho > alto) {
          alto = Math.round((alto * maxAncho) / ancho);
          ancho = maxAncho;
        } else {
          ancho = Math.round((ancho * maxAncho) / alto);
          alto = maxAncho;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = ancho;
      canvas.height = alto;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, ancho, alto);
      ctx.drawImage(img, 0, 0, ancho, alto);

      // Intentar exportar a WebP, fallback a JPEG
      let dataUrl = canvas.toDataURL('image/webp', calidad);
      if (!dataUrl.startsWith('data:image/webp')) {
        dataUrl = canvas.toDataURL('image/jpeg', calidad);
      }

      if (esBlobLocal) {
        URL.revokeObjectURL(src);
      }

      resolve(dataUrl);
    };

    img.onerror = () => {
      if (esBlobLocal) URL.revokeObjectURL(src);
      resolve('');
    };

    img.src = src;
  });
}
