import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { createContext } from 'react-router'

const s3Client = new S3Client({
  endpoint: process.env.MINIO_PUBLIC_ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
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

export const AVATAR_BUCKET = 'avatars'

export const MINIO_PUBLIC_ENDPOINT = process.env.MINIO_PUBLIC_ENDPOINT
