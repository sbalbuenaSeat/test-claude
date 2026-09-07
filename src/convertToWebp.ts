export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export async function convertToWebp(file: File, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.drawImage(bitmap, 0, 0)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', quality)
  )
  if (!blob || blob.type !== 'image/webp') {
    throw new Error('WebP encoding is not supported in this browser')
  }
  return blob
}
