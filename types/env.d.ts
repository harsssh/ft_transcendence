declare module 'bun' {
  interface Env {
    DATABASE_URL: string
    MINIO_ENDPOINT?: string
    MINIO_ACCESS_KEY?: string
    MINIO_SECRET_KEY?: string
    MINIO_PUBLIC_ENDPOINT?: string
    PRESENCE_DB_URL?: string
  }
}
