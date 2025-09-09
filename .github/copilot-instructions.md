# GitHub Copilot Instruction

常に日本語で回答してください。

## プロジェクト概要
これは ft_transcendence という、TypeScript を使用したフルスタック Web アプリケーションです。モノレポ構造で、フロントエンドとバックエンドのワークスペースが分離されています。pnpm ワークスペース、API 通信用の Protocol Buffers、包括的なリンティングとテストセットアップなど、モダンなツールを使用しています。

## リポジトリ構造
- `frontend/` - Vite、TailwindCSS、Connect-RPC を使用したフロントエンドアプリケーション
- `backend/` - Fastify、Better SQLite3、Connect-RPC、awilix（DI コンテナ）を使用したバックエンドサーバー
- `proto/` - API 通信用の Protocol Buffer 定義
- `packages/` - ワークスペース間の共有パッケージ
- ルートディレクトリはモノレポ設定と共有ツールを含む

## 技術スタック
- ランタイム: Node.js 22.18.0、pnpm v10.15.0
- フロントエンド: Vite、TailwindCSS v4、@connectrpc/connect-web
- バックエンド: Fastify、Better SQLite3、@connectrpc/connect-fastify、awilix（DI コンテナ）
- Protocol Buffers: スキーマ管理とコード生成のための buf
- テスト: カバレッジ付きの Vitest
- リンティング: コードスタイル用の Biome、proto リンティング用の buf
- TypeScript: @tsconfig/strictest による厳格な設定

## コーディング規約
- strict モードが有効な TypeScript を使用する
- Biome のコードフォーマットとリンティングルールに従う
- パッケージ管理には pnpm を使用する（npm や yarn は使わない）
- フロントエンドでは Feature-Sliced Design アーキテクチャに従う（app/、features/、entities/、shared/、widgets/、pages/）
- 型安全な API 通信には Connect-RPC を使用する
- バックエンドでは依存性注入に awilix を使用する
- Vitest と @testing-library を使用してテストを書く

## 開発コマンド
- `pnpm dev` - フロントエンドとバックエンドの両方を開発モードで起動
- `pnpm test` - カバレッジ付きでテストを実行
- `pnpm lint` - すべてのリンティングを実行（Biome + buf）
- `pnpm gen:buf` - Protocol Buffers から TypeScript コードを生成
