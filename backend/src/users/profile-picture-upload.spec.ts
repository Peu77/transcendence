import { BadRequestException } from '@nestjs/common'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import {
  detectProfilePictureMimeType,
  MAX_PROFILE_PICTURE_SIZE,
  validateProfilePictureFile,
} from './profile-picture-upload'

const signatures = {
  jpeg: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  png: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  gif: Buffer.from('GIF89a', 'ascii'),
  webp: Buffer.concat([
    Buffer.from('RIFF', 'ascii'),
    Buffer.from([0, 0, 0, 0]),
    Buffer.from('WEBP', 'ascii'),
  ]),
}

describe('profile picture upload validation', () => {
  it.each([
    [signatures.jpeg, 'image/jpeg'],
    [signatures.png, 'image/png'],
    [signatures.gif, 'image/gif'],
    [signatures.webp, 'image/webp'],
  ] as const)('detects supported image signatures', (bytes, expected) => {
    expect(detectProfilePictureMimeType(bytes)).toBe(expected)
  })

  it('rejects text disguised as an image', () => {
    expect(
      detectProfilePictureMimeType(Buffer.from('<svg></svg>', 'utf8')),
    ).toBeNull()
  })

  it('defines a 5 MiB upload limit', () => {
    expect(MAX_PROFILE_PICTURE_SIZE).toBe(5 * 1024 * 1024)
  })

  it('accepts a file when its declared and detected types match', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'avatar-test-'))
    const filePath = path.join(directory, 'upload')

    try {
      await fs.writeFile(filePath, signatures.webp)
      const file = {
        path: filePath,
        mimetype: 'image/webp',
      } as Express.Multer.File

      await expect(validateProfilePictureFile(file)).resolves.toBe('image/webp')
    } finally {
      await fs.rm(directory, { recursive: true, force: true })
    }
  })

  it('rejects a mismatch between declared MIME type and file contents', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'avatar-test-'))
    const filePath = path.join(directory, 'upload')

    try {
      await fs.writeFile(filePath, signatures.png)
      const file = {
        path: filePath,
        mimetype: 'image/jpeg',
      } as Express.Multer.File

      await expect(validateProfilePictureFile(file)).rejects.toThrow(
        BadRequestException,
      )
    } finally {
      await fs.rm(directory, { recursive: true, force: true })
    }
  })
})
