import { S3Client } from '@aws-sdk/client-s3'
import { createContext } from 'react-router'

const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT ?? 'http://storage:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
  },
  forcePathStyle: true,
})

export const storageContext = createContext(s3Client)

export const AVATAR_BUCKET = 'avatars'
export const MINIO_PUBLIC_ENDPOINT =
  process.env.MINIO_PUBLIC_ENDPOINT ?? 'http://localhost:9000'
