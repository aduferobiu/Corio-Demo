import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const UPLOADS_ROOT = join(process.cwd(), 'uploads')

export async function writeUploadedFile(applicationId: string, file: File): Promise<string> {
  const dir = join(UPLOADS_ROOT, applicationId)
  await mkdir(dir, { recursive: true })

  const safeName = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const bytes = Buffer.from(await file.arrayBuffer())
  await writeFile(join(dir, safeName), bytes)

  return join(applicationId, safeName)
}

// Inline base64 data URL so the browser can preview/download the file directly,
// since uploaded files aren't served over HTTP in this demo.
export async function fileToDataUrl(file: File): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer())
  const mimeType = file.type || 'application/octet-stream'
  return `data:${mimeType};base64,${bytes.toString('base64')}`
}
