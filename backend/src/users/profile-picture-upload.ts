import { BadRequestException } from '@nestjs/common'
import * as fs from 'node:fs/promises'

export const MAX_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024

export const PROFILE_PICTURE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const

export type ProfilePictureMimeType = (typeof PROFILE_PICTURE_MIME_TYPES)[number]

const PROFILE_PICTURE_MIME_TYPE_SET = new Set<string>(
  PROFILE_PICTURE_MIME_TYPES,
)

export function isAllowedProfilePictureMimeType(
  mimeType: string,
): mimeType is ProfilePictureMimeType {
  return PROFILE_PICTURE_MIME_TYPE_SET.has(mimeType)
}

export function detectProfilePictureMimeType(
  bytes: Uint8Array,
): ProfilePictureMimeType | null {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png'
  }

  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return 'image/jpeg'
  }

  const header = Buffer.from(bytes.subarray(0, 12)).toString('ascii')
  if (header.startsWith('GIF87a') || header.startsWith('GIF89a')) {
    return 'image/gif'
  }

  if (
    bytes.length >= 12 &&
    header.slice(0, 4) === 'RIFF' &&
    header.slice(8, 12) === 'WEBP'
  ) {
    return 'image/webp'
  }

  return null
}

export async function validateProfilePictureFile(
  file: Express.Multer.File,
): Promise<ProfilePictureMimeType> {
  if (!isAllowedProfilePictureMimeType(file.mimetype)) {
    throw new BadRequestException(
      'Invalid file type. Allowed formats: JPEG, PNG, GIF, and WebP',
    )
  }

  const handle = await fs.open(file.path, 'r')
  try {
    const header = Buffer.alloc(12)
    const { bytesRead } = await handle.read(header, 0, header.length, 0)
    const detectedMimeType = detectProfilePictureMimeType(
      header.subarray(0, bytesRead),
    )

    if (!detectedMimeType || detectedMimeType !== file.mimetype) {
      throw new BadRequestException(
        'File contents do not match a supported image format',
      )
    }

    return detectedMimeType
  } finally {
    await handle.close()
  }
}
