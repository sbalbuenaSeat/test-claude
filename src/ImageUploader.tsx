import { useEffect, useRef, useState } from 'react'
import { convertToWebp, MAX_UPLOAD_BYTES } from './convertToWebp'
import './ImageUploader.css'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function ImageUploader() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [originalSize, setOriginalSize] = useState<number | null>(null)
  const [convertedSize, setConvertedSize] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`File is too large — max ${formatBytes(MAX_UPLOAD_BYTES)}.`)
      return
    }

    setIsConverting(true)
    try {
      const webpBlob = await convertToWebp(file)
      const nextUrl = URL.createObjectURL(webpBlob)
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current)
        return nextUrl
      })
      setOriginalSize(file.size)
      setConvertedSize(webpBlob.size)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert image.')
    } finally {
      setIsConverting(false)
    }
  }

  function handleReset() {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
    setOriginalSize(null)
    setConvertedSize(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="image-uploader">
      <label className="image-uploader__input-label">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="image-uploader__input"
        />
        Choose image
      </label>

      {isConverting && <p className="image-uploader__status">Converting to WebP…</p>}
      {error && <p className="image-uploader__error">{error}</p>}

      {previewUrl && originalSize !== null && convertedSize !== null && (
        <div className="image-uploader__result">
          <img src={previewUrl} alt="Converted preview" className="image-uploader__preview" />
          <p className="image-uploader__sizes">
            {formatBytes(originalSize)} → {formatBytes(convertedSize)}
          </p>
          <button type="button" onClick={handleReset} className="image-uploader__reset">
            Choose a different image
          </button>
        </div>
      )}
    </div>
  )
}

export default ImageUploader
