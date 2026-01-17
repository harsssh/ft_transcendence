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

4. `/etc/hosts`を書き換えて`WEBAPP_HOST` `STORAGE_HOST` `KIBANA_HOST` で指定したドメインと127.0.0.1をbind
```
127.0.0.1   <WEBAPP_HOSTで指定したhostname> <STORAGE_HOSTで指定したhostname> <KIBANA_HOSTで指定したhostname>
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

## サービスへのアクセス

### 開発環境

- Web Application: http://localhost:5173
- MinIO Console: http://localhost:9001
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- Elasticsearch: http://localhost:9200
- Kibana: http://localhost:5601

### 本番環境

- Web Application: https://${WEBAPP_HOST}
- MinIO: https://${STORAGE_HOST}
- Kibana: https://${KIBANA_HOST}

Kibanaへのログイン:
- Username: `elastic`
- Password: `.env`ファイルの`ELASTIC_PASSWORD`で設定した値

## Tips
### シードデータ
以下のコマンドを実行するとDBにシードデータが生成される。

```
docker compose exec webapp bun db/seed/index.ts
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
