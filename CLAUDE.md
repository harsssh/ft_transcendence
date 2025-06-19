# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト構成

このプロジェクトは以下のような構造になっている：

- `libs/` - webアプリで使用する自作ライブラリ群
- 将来的に、webアプリ本体もルートレベルに実装予定

## 自作ライブラリ

### Reaftライブラリ（libs/reaft/）

ReactライクなUIライブラリ。FiberアーキテクチャとHooksシステムを実装。

#### コマンド
- `npm run build` - TypeScriptをコンパイルして `dist/` に出力
- `npm run watch` - TypeScriptをwatch mode でコンパイル
- `npm run clean` - `dist/` フォルダを削除
- `npm run prepare` - パッケージ準備（ビルドを実行）

#### サンプルアプリ（libs/reaft/samples/hello-world-app/）
- `npm run dev` - Viteを使ってローカル開発サーバーを起動
- `npm run build` - TypeScriptコンパイル後、Viteでビルド
- `npm run preview` - ビルド後のアプリをプレビュー

#### アーキテクチャ

ReaftはReactのFiberアーキテクチャを簡素化して実装している:

- **Fiber**: 仮想DOMノードの構造。reconcilerで差分計算と更新を行う
- **Work Loop**: 分割可能な作業単位でレンダリングを実行
- **Hooks**: 関数コンポーネントでstate管理と副作用を処理

#### 主要なモジュール構成

- `fiber.ts` - Fiberの作成、reconciliation、work loopの管理
- `reconciler.ts` - 差分計算とDOM更新のコミット処理
- `hooks.ts` - useState、useEffect、useMemo、useCallbackの実装
- `createElement.ts` - JSXを内部表現に変換、Fragment処理
- `render.ts` - エントリーポイント、scheduler連携
- `renderer.ts` - DOM操作、プロパティ更新
- `scheduler.ts` - requestIdleCallbackによる作業分散
- `events.ts` - イベントハンドリング
- `types.ts` - 型定義

#### JSX設定

TypeScriptの設定で `jsxFactory: "Reaft.createElement"` を使用。これによりJSXが内部のcreateElement関数に変換される。

#### ワークフロー

1. `render()` → Fiber treeの構築とwork unitのスケジューリング
2. Scheduler → requestIdleCallbackでwork loop実行
3. Reconciler → 差分計算とeffect tagの付与
4. Commit phase → 実際のDOM更新を実行

サンプルアプリではVite + TailwindCSSで具体的な使用例を提供している。