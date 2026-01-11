## 環境構築

1. 以下のコマンドを実行してクローン
```
git clone <url> --recursive
```

2. submoduleを更新
```
git submodule update --init --recursive
```

3. `.env.example`をコピーして、`.env`に必須の環境変数を設定

4. `/etc/hosts`を書き換えて`WEBAPP_HOST`と`STORAGE_HOST`で指定したドメインと127.0.0.1をbind
```
127.0.0.1   <WEBAPP_HOSTで指定したhostname> <STORAGE_HOSTで指定したhostname>
```

## 実行方法

開発用:

```sh
docker compose up
```

本番用:

```sh
docker compose -f compose.prod.yml up
```

## 開発フロー

1. バックログにイシューを追加
2. 実装するかPO,PM,テックリードとすり合わせ
3. POが要件FIX UIのイメージをイシューに記載
4. 実装者,PO,テックリードで要件を確認し、Planningへ追加
5. 時間があれば実装方針を書き、Readyに追加
6. 実装者を決める
7. 実装を開始したらIn progressに追加
8. PRを作成し、In reviewに移動し、Copilotのレビューを受ける
9. Copilotのレビューが終わったらテックリードにレビューを依頼する
10. レビュー後に修正が必要な場合7に戻る
11. アプルーブをもらったらmainにマージしてDone
12. POはmainに入った機能を随時確認
