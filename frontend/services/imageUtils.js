// Full-resolution base64 (no data: prefix) — sent to the vision model for scoring.
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Small JPEG data-URL thumbnail for display/persistence. Keeps localStorage tiny
// (full-res base64 previews blow the ~5MB quota).
export function downscaleImage(file, maxDim = 256, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = url
  })
}

// Drop heavy base64 previews before sending a profile to the backend.
export function stripPreviews(profile) {
  return {
    ...profile,
    image_analyses: (profile.image_analyses || []).map(({ preview_url, ...rest }) => rest),
  }
}
