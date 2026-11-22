/** Tamaño del avatar cuadrado que se envía al servidor (px). */
const TAMANO_AVATAR = 256;
/** Calidad JPEG: deja la data URL ~15–40 KB. */
const CALIDAD_JPEG = 0.72;
/** Archivo de origen: hasta 25 MB; se redimensiona antes de subir. */
const MAX_ORIGEN_BYTES = 25 * 1024 * 1024;

interface Caja {
  x: number;
  y: number;
  w: number;
  h: number;
}

declare global {
  interface Window {
    FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => {
      detect: (image: ImageBitmapSource) => Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
    };
  }
}

function cargarImagen(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen. Prueba con JPG, PNG o WebP.'));
    };
    img.src = url;
  });
}

/** Recorte centrado con sesgo hacia arriba (retratos típicos). */
function cajaCentroRetrato(ancho: number, alto: number): Caja {
  const lado = Math.min(ancho, alto);
  const x = (ancho - lado) / 2;
  // Un poco más arriba para enmarcar la cara en fotos de cuerpo.
  const yIdeal = (alto - lado) * 0.28;
  const y = Math.max(0, Math.min(alto - lado, yIdeal));
  return { x, y, w: lado, h: lado };
}

async function detectarCara(img: HTMLImageElement): Promise<Caja | null> {
  if (typeof window.FaceDetector !== 'function') return null;
  try {
    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
    const caras = await detector.detect(img);
    const cara = caras[0];
    if (!cara) return null;
    const b = cara.boundingBox;
    if (b.width < 8 || b.height < 8) return null;

    // Ampliar el bounding box para incluir frente/hombro y dejar margen circular.
    const padX = b.width * 0.45;
    const padY = b.height * 0.55;
    let x = b.x - padX;
    let y = b.y - padY * 1.15;
    let w = b.width + padX * 2;
    let h = b.height + padY * 2;

    const lado = Math.max(w, h);
    x -= (lado - w) / 2;
    y -= (lado - h) / 2;
    w = lado;
    h = lado;

    // Encajar dentro de la imagen.
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + w > img.naturalWidth) x = Math.max(0, img.naturalWidth - w);
    if (y + h > img.naturalHeight) y = Math.max(0, img.naturalHeight - h);
    w = Math.min(w, img.naturalWidth - x);
    h = Math.min(h, img.naturalHeight - y);
    const ladoFinal = Math.min(w, h);
    return { x, y, w: ladoFinal, h: ladoFinal };
  } catch {
    return null;
  }
}

/**
 * Acepta casi cualquier foto, recorta al rostro (o centro retrato) y
 * comprime a un JPEG pequeño apto para el avatar circular.
 */
export async function prepararFotoPerfil(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecciona un archivo de imagen.');
  }
  if (file.size > MAX_ORIGEN_BYTES) {
    throw new Error('La imagen es demasiado pesada (máx. 25 MB).');
  }

  const img = await cargarImagen(file);
  if (img.naturalWidth < 16 || img.naturalHeight < 16) {
    throw new Error('La imagen es demasiado pequeña.');
  }

  const cara = await detectarCara(img);
  const caja = cara ?? cajaCentroRetrato(img.naturalWidth, img.naturalHeight);

  const canvas = document.createElement('canvas');
  canvas.width = TAMANO_AVATAR;
  canvas.height = TAMANO_AVATAR;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen.');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, caja.x, caja.y, caja.w, caja.h, 0, 0, TAMANO_AVATAR, TAMANO_AVATAR);

  const dataUrl = canvas.toDataURL('image/jpeg', CALIDAD_JPEG);
  if (!dataUrl.startsWith('data:image/jpeg')) {
    throw new Error('No se pudo comprimir la imagen.');
  }
  return dataUrl;
}
