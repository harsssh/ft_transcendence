# メインブランチからの変更点（非3D関連ファイル）

本ブランチでは、3Dモデル生成・表示機能の実装に加え、チャット機能の基盤整備（プロフィール編集、アバター表示、認証、DBスキーマ拡張）およびインフラ環境の構築を行いました。以下は `3D/` ディレクトリ以外の全変更ファイルの概要です。

## 1. インフラ・環境構築 (Infrastructure & Config)

| ファイル名 | 変更内容・目的 |
| :--- | :--- |
| **.gitmodules** | 3Dアセット用サブモジュール (`pmndrs/drei-assets`) の追加。 |
| **compose.yml** / **compose.prod.yml** | `webapp` サービスへの環境変数追加 (`MESHY_API_KEY`, `TEXT3D_PROVIDER`)。3D生成プロバイダーとの連携設定。 |
| **Dockerfile** / **Dockerfile.minio** | ビルド設定の調整。MinIO用Dockerfileの追加（ローカルストレージ用）。 |
| **nginx/** | リバースプロキシ設定の追加。SSL証明書生成スクリプト (`99-gen-cert.sh`) とテンプレート (`default.conf.template`) の整備。 |
| **vite.config.ts** | プロキシ設定の調整（`/api` エンドポイントの中継など）。 |
| **package.json** / **bun.lock** | 依存パッケージの追加 (`@react-three/fiber`, `@react-three/drei`, `three` 等の3Dライブラリ、および `mantine` 関連UIライブラリ)。 |
| **.env.example** | 必要な環境変数のテンプレート更新。 |
| **.dockerignore** / **.gitignore** | 生成物や一時ファイルの除外設定追加。 |

## 2. バックエンド・データベース (Backend & Database)

| ファイル名 | 変更内容・目的 |
| :--- | :--- |
| **db/schema.ts** | データベーススキーマの拡張。`messages` テーブルへの `asset3D` カラム（JSON型）追加など、3D生成ステータスを保持するための変更。 |
| **server/channels.ts** | チャンネル・メッセージ関連APIの拡張。<br>- `POST /asset/refine`: 高画質化リクエスト処理<br>- `POST /asset/revert`: 生成失敗時の復帰処理<br>- `POST /asset/resume`: タイムアウト時の再開処理 |
| **server/index.ts** | サーバー起動時の初期化処理追加。<br>- `recover3DJobs()`: サーバー再起動時に中断された3D生成ジョブを復旧させるロジックの呼び出し。 |
| **server/proxy.ts** | **[新規]** 画像/モデル取得用のプロキシエンドポイント実装。CORS問題を回避して外部CDN（Meshy等）のリソースをフロントエンドに配信するために追加。 |
| **server/users.ts** | ユーザー関連APIの実装。プロフィール更新やアバター取得ロジックの整備。 |

## 3. フロントエンド基盤 (Frontend Core)

| ファイル名 | 変更内容・目的 |
| :--- | :--- |
| **app/contexts/** | アプリケーション全体の状態管理ロジック。<br>- `db.ts`, `storage.ts`: DB/ストレージ接続コンテキスト<br>- `user.ts` / `user.server.ts`: ユーザー認証・情報管理<br>- `onlineStatus.ts`, `presence.ts`: オンライン状態・プレゼンス管理 |
| **app/middlewares/auth.ts** | 認証ミドルウェアの実装。保護されたルートへのアクセス制御。 |
| **types/env.d.ts** | TypeScript型定義の追加（環境変数、グローバル型）。 |

## 4. チャット機能・UI (Frontend UI)

| ファイル名 | 変更内容・目的 |
| :--- | :--- |
| **app/routes/channels+/_text/TextChannelView.tsx** | テキストチャット画面のメインビュー。<br>- WebSocket (`message_update`) イベントハンドリングの拡張：3D生成ステータスのリアルタイム反映処理を追加。 |
| **app/routes/channels+/ui/Message.tsx** | メッセージコンポーネント。<br>- `ThreeViewer` コンポーネントの組み込み：メッセージ内に3Dモデルが含まれる場合の表示ロジック追加。 |
| **app/routes/channels+/_text/model/message.ts** | メッセージデータモデル（Zodスキーマ）の定義。<br>- `asset3D` フィールド（`status`, `modelUrl`, `mode`）の定義追加。 |
| **app/routes/channels+/ui/EditProfileModal.tsx** | **[新規]** プロフィール編集モーダルの実装。ユーザー名やアバターの変更UI。 |
| **app/routes/channels+/ui/UserAvatar.tsx** | ユーザーアバター表示コンポーネント。画像の遅延読み込みやフォールバック表示。 |
| **app/routes/channels+/ui/UserProfileSidebar.tsx** | 右サイドバー（ユーザー情報表示）の実装。 |
| **app/routes/channels+/** (その他) | ルーティング定義、ローダー (`loader.server.ts`)、アクション (`action.server.ts`) の整備。チャンネル一覧やDM機能の基盤実装。 |

---
**補足**:
3D機能の実装に伴い、既存のチャットアプリケーション基盤に対しても、データの永続化（DB）、API通信（Server）、リアルタイム更新（WebSocket）、およびUI表示（React Components）の各レイヤーで必要な拡張を行いました。
これにより、「テキストチャットの中で3Dモデルを生成・共有・閲覧・操作する」という統合的な体験が可能になっています。
