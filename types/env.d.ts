declare module 'bun' {
  interface Env {
    HOST: string
    WEBAPP_HOST: string
    DATABASE_URL: string
    MINIO_ACCESS_KEY: string
    MINIO_SECRET_KEY: string
    STORAGE_HOST: string
    STORAGE_PORT: string
    PRESENCE_DB_URL?: string
    CI?: unknown
    E2E_BASE_URL?: string
    MESHY_API_KEY?: string
    TEXT3D_PROVIDER?: string
  }
}
