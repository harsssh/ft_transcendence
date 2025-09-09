// 環境変数は ProcessEnv に直接定義せず、こちらに定義してください
export interface AppEnv {
  SQLITE_APP_DB_PATH: string
}

export declare global {
  namespace NodeJS {
    interface ProcessEnv extends AppEnv {}
  }
}
