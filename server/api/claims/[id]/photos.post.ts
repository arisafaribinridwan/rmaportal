// server/api/claims/[id]/photos.post.ts
// POST /api/claims/:id/photos — Upload a photo for a claim
import { claimService } from '~~/server/services/claim.service'
import { join } from 'path'
import { mkdir, writeFile } from 'fs/promises'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')

  if (!idParam) {
    throw createError({ statusCode: 400, message: 'Claim ID is required' })
  }

  const id = Number(idParam)
  if (isNaN(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid claim ID' })
  }

  const session = event.context.auth
  const user = session.user

  // Read multipart form data
  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'No file uploaded' })
  }

  // Extract photoType from form fields
  let photoType: string | undefined
  let fileData: { data: Buffer, filename: string, type: string } | undefined

  for (const part of formData) {
    if (part.name === 'photoType' && part.data) {
      photoType = part.data.toString('utf-8')
    }
    if (part.name === 'file' && part.data && part.filename) {
      fileData = {
        data: part.data,
        filename: part.filename,
        type: part.type || 'image/jpeg'
      }
    }
  }

  if (!photoType) {
    throw createError({ statusCode: 400, message: 'photoType is required' })
  }

  if (!fileData) {
    throw createError({ statusCode: 400, message: 'file is required' })
  }

  // Validate file type (only images)
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedMimes.includes(fileData.type)) {
    throw createError({
      statusCode: 400,
      message: `Invalid file type '${fileData.type}'. Allowed: ${allowedMimes.join(', ')}`
    })
  }

  // Max file size: 5MB
  const maxSize = 5 * 1024 * 1024
  if (fileData.data.length > maxSize) {
    throw createError({
      statusCode: 400,
      message: 'File size exceeds 5MB limit'
    })
  }

  // Save file to uploads directory
  const ext = fileData.filename.split('.').pop() || 'jpg'
  const fileName = `${id}_${photoType}_${Date.now()}.${ext}`
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'claims', String(id))

  await mkdir(uploadDir, { recursive: true })

  const filePath = join(uploadDir, fileName)
  await writeFile(filePath, fileData.data)

  // Store relative path (for serving via /uploads/...)
  const relativePath = `/uploads/claims/${id}/${fileName}`

  const photo = await claimService.uploadPhoto(
    id,
    photoType,
    relativePath,
    undefined, // thumbnail not generated server-side yet
    user.id,
    user.role
  )

  setResponseStatus(event, 201)
  return photo
})
