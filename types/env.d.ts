declare module 'bun' {
  interface Env {
    HOST: string
    DATABASE_URL: string
    MINIO_ACCESS_KEY: string
    MINIO_SECRET_KEY: string
    MINIO_ENDPOINT?: string
    STORAGE_PUBLIC_ENDPOINT?: string
    PRESENCE_DB_URL?: string
  }
}
