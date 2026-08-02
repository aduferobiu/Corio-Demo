// Kept comfortably under typical serverless request-body caps (e.g. Vercel's ~4.5MB),
// since every upload is stored as a base64 data URL, which inflates the encoded size by ~33%.
export const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024
export const MAX_FILE_SIZE_LABEL = '3 MB'
