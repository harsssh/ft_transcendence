# 3D機能開発ブランチにおける非3Dファイル変更全量リスト (Checklist)

本ドキュメントは、メインブランチと比較して本ブランチで変更された**全ての非3Dファイル**の詳細チェックリストです。
今回の機能実装（Refine/Recovery）だけでなく、その前提となる環境構築・基盤実装（認証、DB、チャット機能など）を含みます。

## 1. Feature Logic (Critical) - 3D関連ロジック

### `server/channels.ts`
- **Purpose**: Implements API endpoints for 3D Refine, Revert, and Resume; handles WebSocket 3D updates.
- **Changes**:
  - Lines 6-14: Modified/Added
  - Lines 26-27: Modified/Added
  - Lines 271-273: Modified/Added
  - Lines 520-647: Modified/Added

### `server/index.ts`
- **Purpose**: Initializes 3D job recovery on server startup.
- **Changes**:
  - Lines 10-15: Modified/Added

### `app/routes/channels+/_text/TextChannelView.tsx`
- **Purpose**: Updates WebSocket handler to reflect 3D generation status (Refine/Timeout) in real-time.
- **Changes**:
  - Lines 136-155: Modified/Added

### `compose.prod.yml`
- **Purpose**: Adds `MESHY_API_KEY`, `TEXT3D_PROVIDER` configurations to server environment.
- **Changes**:
  - Lines 44-45: Modified/Added

### `app/routes/channels+/_text/model/message.ts`
- **Purpose**: Extends Message schema to include `mode` in `asset3D`.
- **Changes**:
  - Line 16: Modified/Added

## 2. Server Infrastructure - サーバー・インフラ

### `server/proxy.ts`
- **Purpose**: Provides a proxy endpoint /api/proxy/model to bypass CORS when fetching external 3D assets.
- **Changes**:
  - Lines 1-27: Modified/Added (New File)

### `server/users.ts`
- **Purpose**: User management API implementation.
- **Changes**:
  - Lines 1-67: Modified/Added

### `Dockerfile`
- **Purpose**: Updates application container build steps and dependencies.
- **Changes**:
  - Lines 8-8: Modified/Added
  - Lines 14-15: Modified/Added
  - Lines 21-27: Modified/Added

### `Dockerfile.minio`
- **Purpose**: Configures MinIO storage container.
- **Changes**:
  - Lines 1-5: Modified/Added

### `nginx/entrypoints/99-gen-cert.sh`
- **Purpose**: Foundation/Infrastructure setup.
- **Changes**:
  - Lines 1-47: Modified/Added

### `nginx/templates/default.conf.template`
- **Purpose**: Nginx proxy configuration for connecting services.
- **Changes**:
  - Lines 1-105: Modified/Added

## 3. App Contexts & Middleware - 基盤実装

### `app/contexts/db.ts`
- **Purpose**: Provides initial database connection context/client.
- **Changes**:
  - Lines 5-5: Modified/Added

### `app/contexts/storage.ts`
- **Purpose**: Provides S3/MinIO storage client initialization.
- **Changes**:
  - Lines 9-20: Modified/Added
  - Line 66 (Insertion/Deletion): Modified/Added

### `app/contexts/user.ts`
- **Purpose**: User context definition.
- **Changes**:
  - Lines 1-4: Modified/Added

### `app/contexts/presence.ts`
- **Purpose**: Presence (online status) context definition.
- **Changes**:
  - Lines 1-8: Modified/Added

### `app/contexts/onlineStatus.ts`
- **Purpose**: Foundation/Infrastructure setup.
- **Changes**:
  - Lines 1-76: Modified/Added

### `app/contexts/user.server.ts`
- **Purpose**: Foundation/Infrastructure setup.
- **Changes**:
  - Lines 1-8: Modified/Added

### `app/middlewares/auth.ts`
- **Purpose**: Middleware to enforce authentication on protected routes.
- **Changes**:
  - Lines 5-32: Modified/Added

## 4. Routes & UI - チャット・画面実装

### `app/routes/channels+/ui/Message.tsx`
- **Purpose**: Updates Message component props to support 3D Refine mode display.
- **Changes**:
  - Lines 23-47: Modified/Added

### `app/routes/_auth+/` (Multiple files)
- **Purpose**: Authentication routes (login, callback, session management).
- **Changes**: Extensive file additions for Auth flow.

### `app/routes/_shared/` (Multiple files)
- **Purpose**: Shared UI components (WebSocket lib, SecondaryNavbar).
- **Changes**: Library additions for real-time features.

### `app/routes/channels+/` (Multiple files)
- **Purpose**: Channel management, Guild UI, and User Profile features.
- **Changes**: Extensive foundation for the chat application structure.

## 5. Build & Config - 設定・ビルド

### `package.json`
- **Purpose**: Adds dependencies required for 3D features and server logic.
- **Changes**:
  - Lines 26-68: Dependency updates.

### `.env.example`
- **Purpose**: Example environment variables template.
- **Changes**:
  - Lines 1-11: Modified/Added

### `.gitignore` / `.dockerignore`
- **Purpose**: Git & Docker ignore rules update.
- **Changes**: Minor additions.

### `db/schema.ts`
- **Purpose**: Foundation/Infrastructure setup (DB Tables).
- **Changes**:
  - Lines 13-218: DB Schema definitions and updates.

### `vite.config.ts`
- **Purpose**: Foundation/Infrastructure setup.
- **Changes**:
  - Lines 19-25: Config updates.

### `bun.lock`
- **Purpose**: Lockfile update.
- **Changes**: Extensive dependency locking.
