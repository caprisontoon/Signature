export function processPhoto(
  photoImage: HTMLImageElement,
  photoCanvas: HTMLCanvasElement,
  photoCtx: CanvasRenderingContext2D,
  threshold: number,
  cleanup: number,
  inkHex: string
): boolean {
  const CANVAS_W = 800;
  const CANVAS_H = 380;
  const TARGET_MARGIN_X = 60;
  const TARGET_MARGIN_Y = 40;
  const targetW = CANVAS_W - TARGET_MARGIN_X * 2;
  const targetH = CANVAS_H - TARGET_MARGIN_Y * 2;
  const srcW = photoImage.width;
  const srcH = photoImage.height;
  const scale = Math.min(targetW / srcW, targetH / srcH);
  const drawW = Math.max(1, Math.round(srcW * scale));
  const drawH = Math.max(1, Math.round(srcH * scale));
  const offsetX = Math.round((CANVAS_W - drawW) / 2);
  const offsetY = Math.round((CANVAS_H - drawH) / 2);

  photoCanvas.width = CANVAS_W;
  photoCanvas.height = CANVAS_H;

  photoCtx.imageSmoothingEnabled = true;
  photoCtx.imageSmoothingQuality = "high";
  photoCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  photoCtx.drawImage(photoImage, offsetX, offsetY, drawW, drawH);

  const imgData = photoCtx.getImageData(0, 0, CANVAS_W, CANVAS_H);
  const data = imgData.data;

  const inkR = parseInt(inkHex.slice(1, 3), 16);
  const inkG = parseInt(inkHex.slice(3, 5), 16);
  const inkB = parseInt(inkHex.slice(5, 7), 16);

  const mask = new Uint8Array(CANVAS_W * CANVAS_H) as Uint8Array<ArrayBuffer>;
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    if (data[i + 3] < 8) { mask[j] = 0; continue; }
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    mask[j] = lum < threshold ? 1 : 0;
  }

  let cleanMask = mask;
  for (let pass = 0; pass < cleanup; pass++) {
    cleanMask = removeNoise(cleanMask, CANVAS_W, CANVAS_H);
  }

  for (let j = 0, i = 0; j < cleanMask.length; j++, i += 4) {
    if (cleanMask[j]) {
      const origLum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const alpha = Math.min(255, Math.round((threshold - origLum) * 255 / threshold) + 80);
      data[i] = inkR;
      data[i + 1] = inkG;
      data[i + 2] = inkB;
      data[i + 3] = Math.min(255, alpha);
    } else {
      data[i + 3] = 0;
    }
  }

  photoCtx.putImageData(imgData, 0, 0);
  return true;
}

function removeNoise(mask: Uint8Array<ArrayBuffer>, w: number, h: number): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(mask.length);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      if (!mask[idx]) continue;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (mask[(y + dy) * w + (x + dx)]) count++;
        }
      }
      if (count >= 2) out[idx] = 1;
    }
  }
  return out;
}

export function handlePhotoFile(
  file: File,
  onLoad: (img: HTMLImageElement) => void,
  onError: () => void
) {
  if (!file.type.startsWith("image/")) {
    onError();
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => onLoad(img);
    img.src = e.target!.result as string;
  };
  reader.readAsDataURL(file);
}

export function renderPhotoToTransparent(photoCanvas: HTMLCanvasElement): HTMLCanvasElement {
  return photoCanvas;
}
