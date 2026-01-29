# メインブランチからの変更点（非3D関連ファイル）

本ブランチでは、3Dモデル生成・表示機能の実装に加え、チャット機能の基盤整備（プロフィール編集、アバター表示、認証、DBスキーマ拡張）およびインフラ環境の構築を行いました。以下は `3D/` ディレクトリ以外の全変更ファイル（計58ファイル）の詳細一覧です。

## 1. インフラ・環境構築

| ファイル名 | 変更内容・目的 |
| :--- | :--- |
| **.gitmodules** | 3Dアセット用サブモジュール (`pmndrs/drei-assets`) の追加。 |
| **.gitignore** | **[更新]** HDRIバイナリ(`*.hdr`, `*.exr`)の除外設定追加。 |
| **.dockerignore** | 不要ファイルの除外設定追加。 |
| **.env.example** | 環境変数テンプレート更新 (`MESHY_API_KEY` 等)。 |
| **package.json** / **bun.lock** | 依存パッケージ追加 (`three`, `@react-three/fiber`, `@mantine/*` 等)。 |
| **compose.yml** | 開発環境用サービス定義更新 (`webapp` の環境変数)。 |
| **compose.prod.yml** | 本番/CI環境用サービス定義更新 (`TEXT3D_PROVIDER` 等)。 |
| **Dockerfile** | ビルドステージ設定の調整。 |
| **Dockerfile.minio** | ローカルオブジェクトストレージ(MinIO)用の構築設定。 |
| **nginx/entrypoints/99-gen-cert.sh** | SSL証明書自動生成スクリプト（開発環境用）。 |
| **nginx/templates/default.conf.template** | Nginxリバースプロキシ設定テンプレート。 |
| **vite.config.ts** | Vite設定（プロキシ、エイリアス等）。 |
| **types/env.d.ts** | 環境変数のTypeScript型定義。 |
| **README.md** | ドキュメント更新。 |

## 2. バックエンド・データベース

| ファイル名 | 変更内容・目的 |
| :--- | :--- |
| **db/schema.ts** | `messages` テーブルへの `asset3D` カラム追加。 |
| **server/index.ts** | サーバー起動時のジョブ復旧処理 (`recover3DJobs`) 追加。 |
| **server/channels.ts** | 3D生成・操作用APIエンドポイント (`refine`, `revert`, `resume`) 実装。 |
| **server/proxy.ts** | **[新規]** 外部3Dリソース取得用のプロキシサーバー実装。 |
| **server/users.ts** | ユーザー情報更新APIの実装。 |

## 3. フロントエンド基盤 (Core)

| ファイル名 | 変更内容・目的 |
| :--- | :--- |
| **app/middlewares/auth.ts** | 認証チェック用ミドルウェア。 |
| **app/contexts/db.ts** | Drizzle ORM クライアント初期化。 |
| **app/contexts/storage.ts** | ストレージクライアント初期化。 |
| **app/contexts/user.ts** | ユーザー状態管理コンテキスト。 |
| **app/contexts/user.server.ts** | サーバーサイドユーザー認証ロジック。 |
| **app/contexts/onlineStatus.ts** | オンライン状態管理。 |
| **app/contexts/presence.ts** | プレゼンス（在席状況）管理。 |

## 4. フロントエンド UI (Shared & Routes)

### 共通コンポーネント
| ファイル名 | 変更内容 |
| :--- | :--- |
| **app/routes/_shared/lib/websocket.ts** | WebSocket接続管理クラス。 |
| **app/routes/_shared/ui/SecondaryNavbar.tsx** | ナビゲーションバーのサブコンポーネント。 |

### チャンネル・チャット機能 (`app/routes/channels+`)
| ファイル名 | 変更内容 |
| :--- | :--- |
| **_text/TextChannelView.tsx** | メッセージ一覧表示。3D生成ステータスのリアルタイム反映ロジック。 |
| **_text/model/message.ts** | メッセージ型定義 (`asset3D` フィールド追加)。 |
| **_text/model/profile.ts** | プロフィール関連型定義。 |
| **ui/Message.tsx** | 3Dビューアー (`ThreeViewer`) を含むメッセージコンポーネント。 |
| **ui/UserAvatar.tsx** | ユーザーアバター表示。 |
| **ui/UserAvatarPopover.tsx** | アバタークリック時のポップオーバー。 |
| **ui/EditProfileModal.tsx** | **[新規]** プロフィール編集モーダル。 |
| **ui/UserProfileSidebar.tsx** | ユーザー情報サイドバー。 |
| **ui/DateSeparator.tsx** | メッセージ日付区切り線。 |
| **api/action.server.ts** | チャンネル共通アクション処理。 |
| **model/newGuildForm.ts** | ギルド作成フォーム型定義。 |
| **route.tsx** | チャンネルルート定義。 |

### 各種ルート定義 (Routing Boilerplate)
以下のファイルは、ネストされたルーティングやLoader/Actionの定義を含みます。
- `app/routes/channels+/@me+/route.tsx`, `_index.tsx`
- `app/routes/channels+/@me+/ui/Navbar.tsx`
- `app/routes/channels+/@me+/$channelId+/route.tsx`, `api/loader.server.ts`, `api/action.server.ts`
- `app/routes/channels+/@me+/$channelId+/model/message.ts`
- `app/routes/channels+/@me+/$channelId+/ui/UserAvatar.tsx`
- `app/routes/channels+/$guildId+/route.tsx`, `api/loader.server.ts`, `api/action.server.ts`
- `app/routes/channels+/$guildId+/_index.tsx`
- `app/routes/channels+/$guildId+/model/newChannelForm.ts`
- `app/routes/channels+/$guildId+/$channelId+/route.tsx`, `api/loader.server.ts`, `api/action.server.ts`

---
**補足**:
本リストは `git diff main --name-only` で検出された非3Dファイルをすべて網羅しています。
