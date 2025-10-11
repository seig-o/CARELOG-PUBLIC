# Supabase schema snapshot (運用メモ)

目的:
- Supabase の DB スキーマ（テーブル定義、制約、インデックス、関数、CREATE POLICY など）を定期的に取得し、Git 履歴として保存する。
- これにより「ルールや構成を説明する」コストを削減し、コードベースに基づいた変更提案・レビューを容易にする。

使い方:
1. リポジトリの Secrets に以下を設定する:
   - SUPABASE_DB_HOST
   - SUPABASE_DB_PORT
   - SUPABASE_DB_NAME
   - SUPABASE_DB_USER
   - SUPABASE_DB_PASSWORD
2. ワークフローを有効化すると nightly/手動で snapshots が supabase-snapshots/ に追加されます。
3. 重要な dashboard-only 設定（Auth 設定や Storage の公開/非公開方針等）は `docs/` に手で記録してください。

注意:
- DB の読み取りに必要な権限だけを与えたユーザーを使うこと（最小権限）。
- スナップショットは機密情報を含まないように注意（通常スキーマは大丈夫ですが、コメント等に機密が含まれないか注意）。