import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { createContext } from 'react-router'

export const AVATAR_BUCKET = 'avatars'

export const STORAGE_PUBLIC_ENDPOINT =
  process.env['NODE_ENV'] === 'production'
    ? buildHttpsUrl(
        process.env['STORAGE_HOST'] && process.env['STORAGE_HOST'] !== '_'
          ? process.env['STORAGE_HOST']
          : (process.env['HOST'] ?? 'localhost'),
        process.env['STORAGE_PORT'],
      )
    : 'http://localhost:9000'

const s3Client = new S3Client({
  endpoint: 'http://storage:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
})

// Initialize MinIO bucket
export async function initializeStorage() {
  try {
    // Check if bucket exists
    await s3Client.send(new HeadBucketCommand({ Bucket: AVATAR_BUCKET }))
    console.log(`Bucket "${AVATAR_BUCKET}" already exists`)
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === 'NotFound' || error.name === '404')
    ) {
      // Create bucket if it doesn't exist
      await s3Client.send(new CreateBucketCommand({ Bucket: AVATAR_BUCKET }))
      console.log(`Bucket "${AVATAR_BUCKET}" created`)

      // Set public read policy
      const publicPolicy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${AVATAR_BUCKET}/*`],
          },
        ],
      }

      await s3Client.send(
        new PutBucketPolicyCommand({
          Bucket: AVATAR_BUCKET,
          Policy: JSON.stringify(publicPolicy),
        }),
      )
      console.log(`Public policy set for bucket "${AVATAR_BUCKET}"`)
    } else {
      console.error('Error checking bucket:', error)
    }
  }
}

export const storageContext = createContext(s3Client)

export function resolveStoragePublicEndpoint(request: Request): string {
  if (process.env['NODE_ENV'] !== 'production') {
    return STORAGE_PUBLIC_ENDPOINT
  }

  const getRequestHost = (request: Request) => {
    const forwardedHost = request.headers.get('x-forwarded-host')
    const hostHeader = (
      forwardedHost ??
      request.headers.get('host') ??
      ''
    ).trim()
    const first = hostHeader.split(',')[0]?.trim() ?? ''
    return first.split(':')[0] ?? ''
  }

  const requestHost = getRequestHost(request)
  const webappHost = process.env['WEBAPP_HOST']
  const storageHost = process.env['STORAGE_HOST']
  const storagePort = process.env['STORAGE_PORT']
  const hostIp = process.env['HOST']

  const isDomainRequest =
    !!webappHost && webappHost !== '_' && requestHost === webappHost

  if (isDomainRequest && storageHost && storageHost !== '_') {
    return buildHttpsUrl(storageHost, storagePort)
  }

  const isIPv4 = (value: string) => /^\d{1,3}(?:\.\d{1,3}){3}$/.test(value)

  const ip = isIPv4(requestHost) ? requestHost : hostIp
  return buildHttpsUrl(ip ?? 'localhost', storagePort)
}

function buildHttpsUrl(host: string, port: string | undefined): string {
  if (!port || port === '443') {
    return `https://${host}`
  }
  return `https://${host}:${port}`
}
