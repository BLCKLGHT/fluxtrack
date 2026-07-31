import { IMAGE_CONFIG } from "@/lib/config";

export function validateImage(file: File) {
  if (!IMAGE_CONFIG.acceptedTypes.includes(file.type as (typeof IMAGE_CONFIG.acceptedTypes)[number])) {
    throw new Error("Use a JPEG, PNG, or WebP photograph.");
  }
  if (file.size > IMAGE_CONFIG.maxInputBytes) {
    throw new Error(`The photograph is too large. Maximum input size is ${Math.round(IMAGE_CONFIG.maxInputBytes / 1024 / 1024)} MB.`);
  }
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("The browser could not prepare this photograph.")),
      "image/jpeg",
      quality,
    );
  });
}

export async function prepareImage(file: File): Promise<Blob> {
  validateImage(file);
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, IMAGE_CONFIG.maxDimension / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("The browser could not prepare this photograph.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    let quality = IMAGE_CONFIG.outputQuality;
    let blob = await canvasBlob(canvas, quality);
    while (blob.size > IMAGE_CONFIG.targetBytes && quality > 0.62) {
      quality -= 0.08;
      blob = await canvasBlob(canvas, quality);
    }
    if (blob.size > IMAGE_CONFIG.maxInputBytes) throw new Error("The prepared photograph remains too large.");
    return blob;
  } finally {
    bitmap.close();
  }
}
