# メインブランチからの変更点網羅リスト（非3D関連ファイル）

本ブランチでは、3Dモデル生成機能の統合に加え、その基盤となるチャットアプリケーションの機能強化（認証、DB、インフラ）を行いました。
以下は、メインブランチとの差分がある `3D/` 以外の全ファイル（計58ファイル）について、変更箇所の行番号、目的、およびその効果を詳述したリストです。

## 1. インフラ・構成管理 (Root & Config)

### `.gitmodules`
- **変更箇所**: L4-6 (新規追加)
- **目的**: `pmndrs/drei-assets` リポジトリをサブモジュールとして追加するため。
- **効果**: `3D/assets/hdri/drei-assets` にHDRI画像セットが配置され、オフラインでも環境マップが利用可能になった。

### `.gitignore`
- **変更箇所**: L10-16
- **目的**: HDRIバイナリファイル（`*.hdr`, `*.exr`）およびエディタ設定ファイルをGit管理外にするため。
- **効果**: 巨大な画像ファイルが誤ってリポジトリにコミットされるのを防ぐことができる。

### `.dockerignore`
- **変更箇所**: L4-5
- **目的**: `README.md` をDockerビルドコンテキストから除外するため。
- **効果**: ドキュメント修正のたびにDockerキャッシュが無効化されるのを防ぎ、ビルド時間を短縮。

### `.env.example`
- **変更箇所**: L1-11
- **目的**: 新機能に必要な環境変数（`WEBAPP_HOST`, `MESHY_API_KEY`, `MINIO_ACCESS_KEY` 等）のテンプレートを追加。
- **効果**: 開発者が `.env` を作成する際、3D生成やストレージ連携に必要な設定項目を把握できる。

### `package.json` / `bun.lock`
- **変更箇所**: `dependencies` ブロック
- **目的**: 3D描画ライブラリ (`three`, `@react-three/fiber`, `@react-three/drei`) および UIライブラリ (`@mantine/core` 等) を追加。
- **効果**: 3Dビューアーのコンポーネント実装およびモダンなUI構築が可能になった。

### `compose.yml` (開発環境用Docker構成)
- **変更箇所**: L19-24, L50-62
- **目的**:
    1. `db` サービスの設定更新（HealthCheck追加）。
    2. `minio` サービス（オブジェクトストレージ）の定義追加。
- **効果**: ローカル開発環境で、ユーザーアバター画像のアップロード機能やDB接続の安定性が確保された。

### `compose.prod.yml` (本番/CI用Docker構成)
- **変更箇所**: L49-94 (proxyサービス), L119-124 (minio), L38-45 (webapp環境変数)
- **目的**:
    1. Nginxによるリバースプロキシ (`proxy` サービス) を追加し、SSL終端とルーティングを集約。
    2. `webapp` に `TEXT3D_PROVIDER` 等の環境変数を注入。
- **効果**: 本番環境において、HTTPS通信 (`https://localhost`) および 3D API連携 (`Tripo`/`Meshy`) が動作する基盤が整った。

### `Dockerfile`
- **変更箇所**: L6
- **目的**: `bun install` 時にキャッシュマウント (`--mount=type=cache`) を使用するよう変更。
- **効果**: 依存関係のインストールが高速化し、ビルド時間が短縮された。

### `Dockerfile.minio`
- **変更箇所**: 全行 (L1-36) [新規ファイル]
- **目的**: 公式MinIOイメージに `mc` (MinIO Client) とヘルスチェック用スクリプトを同梱したカスタムイメージを作成するため。
- **効果**: コンテナ起動時に自動的にバケット作成等の初期化処理が行えるようになった。

### `vite.config.ts`
- **変更箇所**: L19-25
- **目的**: パスエイリアス (`@/` -> `app/`) および プロキシ設定 (`/api` -> Server) を追加。
- **効果**: フロントエンド開発時のインポート記述が簡潔になり、APIサーバーへのリクエスト転送が正しく行われるようになった。

### `README.md`
- **変更箇所**: L3, L8, L13-18
- **目的**: セットアップ手順の更新（サブモジュール初期化コマンド、環境変数設定の案内）。
- **効果**: 新規開発者が環境構築を行う際に、HDRIアセットやAPIキーの設定漏れを防げる。

### `types/env.d.ts`
- **変更箇所**: L3-8
- **目的**: 環境変数 (`HOST`, `MINIO_ACCESS_KEY` 等) の型定義を追加。
- **効果**: コード内で `process.env` を参照する際の型安全性が向上した。


## 2. Nginx関連 (Proxy)

### `nginx/entrypoints/99-gen-cert.sh`
- **変更箇所**: 全行 (L1-61) [新規ファイル]
- **目的**: コンテナ起動時に自己署名SSL証明書を自動生成するため。
- **効果**: 開発環境 (`localhost`) でもHTTPSを利用可能にし、セキュアなCookie属性やブラウザAPI制限を回避できる。

### `nginx/templates/default.conf.template`
- **変更箇所**: 全行 (L1-67) [新規ファイル]
- **目的**: フロントエンド (`webapp`)、バックエンド (`API`)、ストレージ (`minio`) へのルーティング定義。
- **効果**: 単一のポート（443）ですべてのサービスにアクセス可能になった。


## 3. データベース・サーバーロジック (Backend)

### `db/schema.ts`
- **変更箇所**: L82-96 (`message3DAssets`テーブル), L13-50 (Guild関連)
- **目的**:
    1. 3D生成ジョブの状態 (`status`, `taskId`, `provider` 等) を管理するテーブル定義を追加。
    2. チャット機能に必要な `guilds`, `guild_members` テーブル定義を追加。
- **効果**: ユーザーが生成した3Dモデルのメタデータを永続化し、生成状況（pending/success/error）を追跡・復元できるようになった。

### `server/channels.ts`
- **変更箇所**: 全行 (L1-650) [新規ファイル]
- **目的**: チャンネルチャット機能のバックエンドロジックを集約。
    - L300-450: メッセージ投稿・取得API。
    - L500-650: 3Dアセット操作API (`/refine`, `/revert`, `/resume`)。
- **効果**:
    1. クライアントからのメッセージ送受信が可能になった。
    2. 生成失敗時のリトライや高画質化といった3D固有の操作をAPI経由で実行できるようになった。

### `server/index.ts`
- **変更箇所**: L15-24 (`recover3DJobs`)
- **目的**: サーバー起動時に、DB内の「処理中(pending)」ステータスの3Dジョブを検索し、監視を再開するロジックを追加。
- **効果**: サーバー再起動を行っても、生成中の3Dモデル処理が放置されず、自動的に完了まで追跡されるようになった。

### `server/proxy.ts`
- **変更箇所**: 全行 (L1-27) [新規ファイル]
- **目的**: 外部ドメイン（Meshy等）のテクスチャ画像を自社ドメイン経由で配信するプロキシAPIを実装。
- **効果**: Canvas内でのテクスチャ読み込み時に発生するCORSエラー（Tainted Canvas）を回避し、3Dモデルが正しく描画されるようになった。

### `server/users.ts`
- **変更箇所**: 全行 (L1-67) [新規ファイル]
- **目的**: ユーザープロフィールの更新APIを実装。
- **効果**: ユーザー名やアバター画像の変更が可能になった。


## 4. フロントエンド・基盤 (Contexts & Middlewares)

### `app/contexts/db.ts`
- **変更箇所**: L5 (コンテキスト定義)
- **目的**: Drizzle ORMインスタンスをアプリ全体で共有するための初期化処理。
- **効果**: フロントエンドのLoader/Action等から型安全にDB操作が可能になった。

### `app/contexts/storage.ts`
- **変更箇所**: 全行 [新規ファイル]
- **目的**: S3互換ストレージ (MinIO) へのクライアント接続設定 (`AVATAR_BUCKET` 定義等)。
- **効果**: アプリケーション内で画像のアップロード・署名付きURL取得が可能になった。

### `app/contexts/onlineStatus.ts`
- **変更箇所**: 全行 [新規ファイル]
- **目的**: WebSocketメッセージに基づきユーザーのオンライン状態を管理するカスタムフック。
- **効果**: 現在アクティブなユーザーをリアルタイムにUIへ反映できる。

### `app/contexts/presence.ts`
- **変更箇所**: 全行 [新規ファイル]
- **目的**: プレゼンス情報（入力中、オンライン等）をコンポーネントツリーに配信するContext。
- **効果**: ページ遷移してもオンライン状態の一貫性が保たれる。

### `app/contexts/user.ts`
- **変更箇所**: 全行 [新規ファイル]
- **目的**: クライアントサイドでのログインユーザー情報保持用Context。
- **効果**: 認証済みユーザーのIDやアバターURLをどこからでも参照できる。

### `app/contexts/user.server.ts`
- **変更箇所**: 全行 [新規ファイル]
- **目的**: サーバーサイドでのリクエストスコープ内ユーザー情報保持キー定義。
- **効果**: ミドルウェアで取得したユーザー情報を `LoaderArgs` の `context` 経由で安全に受け渡せる。

### `app/middlewares/auth.ts`
- **変更箇所**: L1-32
- **目的**: APIリクエストのCookieを検証し、ユーザー情報をリクエストコンテキスト (`loggedInUserContext`) に注入するミドルウェア。
- **効果**: ログインが必要なAPIエンドポイントのセキュリティが確保された。


## 5. フロントエンド・UI (Components & Views)

### `app/routes/channels+/_text/TextChannelView.tsx`
- **変更箇所**: L1-465 [新規ファイル]
- **目的**: テキストチャットのメイン画面実装。
    - **WebSocket連携**: `message_update` イベントを受信し、3D生成の進捗（サムネイル変更など）をリアルタイムに反映するロジックを含む。
- **効果**: ユーザーはリロードすることなく、チャットの流れの中で3Dモデルの生成完了を知ることができる。

### `app/routes/channels+/ui/Message.tsx`
- **変更箇所**: L1-110 [新規ファイル]
- **目的**: メッセージの吹き出しコンポーネント。
    - `asset3D` プロパティが存在する場合、自動的に `ThreeViewer` コンポーネントをレンダリングする分岐を含む。
- **効果**: チャットログの中に3Dビューアーが埋め込まれ、シームレスにモデルを閲覧できる体験を実現した。

### `app/routes/channels+/ui/EditProfileModal.tsx`
- **変更箇所**: 全行 (L1-226) [新規ファイル]
- **目的**: ユーザープロフィール（名前、アバター画像）を編集するためのモーダルUI。
- **効果**: ユーザーが自身のアデンティティをカスタマイズできるようになった。

### `app/routes/channels+/ui/UserAvatar.tsx`
- **変更箇所**: 全行 [新規ファイル]
- **目的**: ユーザーアイコンの表示コンポーネント。画像の遅延読み込みに対応。
- **効果**: ユーザーの視認性が向上した。

### `app/routes/channels+/ui/UserAvatarPopover.tsx`
- **変更箇所**: 全行 [新規ファイル]
- **目的**: アバタークリック時にユーザー詳細情報を表示するポップオーバーUI。
- **効果**: 他ユーザーの情報を素早く確認できる。

### `app/routes/channels+/ui/UserProfileSidebar.tsx`
- **変更箇所**: 全行 [新規ファイル]
- **目的**: 画面右側に表示される参加者リストやユーザー詳細サイドバー。
- **効果**: チャンネル参加者の一覧性が向上した。

### `app/routes/channels+/ui/DateSeparator.tsx`
- **変更箇所**: 全行 [新規ファイル]
- **目的**: チャットログの日付区切り線コンポーネント。
- **効果**: 長いチャット履歴の日付が変わる位置が分かりやすくなった。

### `app/routes/_shared/lib/websocket.ts`
- **変更箇所**: 全行 [新規ファイル]
- **目的**: WebSocket接続の確立、再接続、イベント購読を管理するユーティリティクラス。
- **効果**: チャットのリアルタイム通信が安定し、接続断時の自動復旧が可能になった。

### `app/routes/_shared/ui/SecondaryNavbar.tsx`
- **変更箇所**: 全行 [新規ファイル]
- **目的**: チャンネル固有のナビゲーション（ヘッダー部分）の共通レイアウト。
- **効果**: 各チャンネル画面で統一感のあるヘッダーデザインを提供できる。

### `app/routes/channels+/_text/model/message.ts`
- **変更箇所**: 全行
- **目的**: Zodによるメッセージデータのバリデーションスキーマ定義。`asset3D` フィールドを含む。
- **効果**: サーバー/クライアント間で整合性の取れた3Dアセットデータのやり取りが保証される。

### `app/routes/channels+/_text/model/profile.ts`
- **変更箇所**: 全行
- **目的**: ユーザープロフィール情報の型スキーマ定義。
- **効果**: プロフィール編集時の入力値検証に使用される。


## 6. ルーティング定義・ボイラープレート (Routing & Loaders)
以下のファイル群は、React Router (Remix) の規約に基づいてルーティング階層を構築するために追加されました。それぞれのファイルで適切なLoader（データ取得）とAction（更新処理）を定義しています。

### チャンネルトップ (`/channels`)
- **`app/routes/channels+/route.tsx`**
    - 全体のレイアウト（サイドバー含む）とWebSocket初期化を担当。
- **`app/routes/channels+/api/action.server.ts`**
    - ギルド作成等のグローバルなアクション処理。
- **`app/routes/channels+/model/newGuildForm.ts`**
    - ギルド作成フォームのバリデーション定義。

### ギルド個別ページ (`/channels/:guildId`)
- **`app/routes/channels+/$guildId+/route.tsx`**
    - 特定ギルド内のレイアウト定義。
- **`app/routes/channels+/$guildId+/_index.tsx`**
    - ギルド選択時のデフォルト表示。
- **`app/routes/channels+/$guildId+/api/loader.server.ts`**
    - ギルド情報とチャンネルリストの取得。
- **`app/routes/channels+/$guildId+/api/action.server.ts`**
    - チャンネル作成等のアクション処理。
- **`app/routes/channels+/$guildId+/model/newChannelForm.ts`**
    - チャンネル作成フォームの検証定義。

### チャンネル詳細ページ (`/channels/:guildId/:channelId`)
- **`app/routes/channels+/$guildId+/$channelId+/route.tsx`**
    - チャットビューのラップコンポーネント。
- **`app/routes/channels+/$guildId+/$channelId+/api/loader.server.ts`**
    - チャンネルメッセージ履歴の取得。
- **`app/routes/channels+/$guildId+/$channelId+/api/action.server.ts`**
    - メッセージ投稿処理。

### ダイレクトメッセージ関連 (`/channels/@me`)
- **`app/routes/channels+/@me+/route.tsx`**
    - DM画面のルートレイアウト。
- **`app/routes/channels+/@me+/_index.tsx`**
    - DMトップ画面（フレンドリスト等）。
- **`app/routes/channels+/@me+/ui/Navbar.tsx`**
    - DM用ナビゲーションバー。
- **`app/routes/channels+/@me+/$channelId+/route.tsx`**
    - 個別DMチャット画面。
- **`app/routes/channels+/@me+/$channelId+/api/loader.server.ts`**
    - DMメッセージ取得。
- **`app/routes/channels+/@me+/$channelId+/api/action.server.ts`**
    - DM送信処理。
- **`app/routes/channels+/@me+/$channelId+/model/message.ts`**
    - DMメッセージ用型定義。
- **`app/routes/channels+/@me+/$channelId+/ui/UserAvatar.tsx`**
    - DM相手のアバター表示。

---
以上、全58ファイルの変更一覧です。
