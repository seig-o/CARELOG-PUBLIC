# CareLog System Canon (Source of Truth)

本ファイルは CareLog システム開発の唯一の正。ここに書かれていないものは利用しない。

---

 ## 運用ルール

1) すべての返答で UPDATE/MARGE を明記する。  
2) canon.md を唯一の正（Source of Truth）として運用し、AIは新提案時に必ず canon.md への「差分案」を提示する。  
3) フロントは src/lib/contracts.ts でテーブル/ビュー/ルート名など契約文字列を一元管理し、直書きを避ける。  
4) 毎朝は canon.md の変更があった場合のみ差分を共有して開始する。  
5) ファイル名・ソース参照に関して  
   - 実在が確認できないファイルを推測で提示しない。  
   - 修正対象が曖昧な場合は「grep 等での検索結果をユーザーに確認してもらう」手順を必ず踏む。  
   - 提案には「bundleで確認済み」や「検索結果ベース」など根拠を明示する。  
   - canon.md 上の契約にない命名・参照は新規に勝手に作らない。  
6) **canon.md 更新時の共有方法**  
   - まず即保存リンク（A）を提示する（有効期限あり）。  
   - 保存できなかった場合に備え、必ず全文コードブロック（B）をバックアップとして提示する。  

## 運用ルール（追加）
- 「bundleを参考に修正をアドバイスして」とユーザーが指示した場合、  
  CARELOG-PUBLIC リポジトリの `CARELOG_SUMMARY.md` に記載されたファイルパスを参照元とする。  
  実際の参照は `https://raw.githubusercontent.com/seig-o/CARELOG-PUBLIC/main/<path>` 形式の URL を用いる前提で扱う。 
- **責務分離の原則**  
  - UI コンポーネント（例: AppHeader.vue）に supabase 直接呼び出しや router ガード相当の処理を埋め込まない。  
  - 認証やセッション管理は Pinia store（auth.ts）の責務。  
  - ルーティング制御は router / main.ts の責務。  
- ユーザーが誤って「責務を越える実装」を求めても、AI は同調せず拒絶し、正しい方向を示すこと。  

## 命名規則
- branch … 事業所
- staff … スタッフ
- user … サービス利用者
- ※ participant は禁止、必ず **users** に一本化

---

## テーブル
- care.staffs
- care.users
  - 追加: kana text  … 氏名カナ（NULL許容）
- care.branches
- care.care_logs
- care.care_log_revisions
- care.staff_branch_memberships … スタッフと拠点の中間テーブル
- care.user_branch_memberships  … 利用者と拠点の中間テーブル

#### care.staff_branch_memberships
- **役割**：スタッフと拠点（branches）の**多対多**を表す中間テーブル  
- **主な列**：
  - staff_id (fk → care.staffs.id, **ON DELETE CASCADE**)  
  - branch_id (fk → care.branches.id, **ON DELETE CASCADE**)  
  - created_at timestamptz default now()  
- **制約案**：
  - 一意制約： (staff_id, branch_id) の複合 UNIQUE  
  - 参照整合性：両FKは ON DELETE CASCADE（運用に合わせて調整）  
- **RLS ポリシー案（最低限）**：
  - SELECT：同一 company に属するレコードのみ閲覧可  
  - INSERT/DELETE：管理権限（例：role IN ('admin','manager')）のスタッフに限定  

**実装メモ**  
- フロントの staff 一覧は、当面このテーブルを JOIN/集約して所属タグを表示  
- 将来的にビュー（例：v_staff_with_branches）や RPC に置き換える場合は、先に本 canon を **MARGE** してから実装する 
- FQ_TABLE / FQ_VIEW は当面利用しない。参照は fq.table() / fq.view() を使う。
- ただし contracts.ts 内の定義は将来再利用のため残しておく。

#### care.user_branch_memberships
- **役割**：利用者と拠点（branches）の**多対多**を表す中間テーブル  
- **主な列**：
  - user_id (fk → care.users.id, **ON DELETE CASCADE**)  
  - branch_id (fk → care.branches.id, **ON DELETE CASCADE**)  
  - created_at timestamptz default now()  
- **制約案**：
  - 一意制約： (user_id, branch_id) の複合 UNIQUE  
  - 参照整合性：両FKは ON DELETE CASCADE（運用に合わせて調整）  
- **RLS ポリシー案（最低限）**：
  - SELECT：同一 company に属するレコードのみ閲覧可  
  - INSERT/DELETE：管理権限（例：role IN ('admin','manager')）のスタッフに限定  

**実装メモ**  
- フロントの user 一覧も、このテーブルを JOIN/集約して所属タグを表示  
- 将来的にビュー（例：v_user_with_branches）や RPC に置き換える場合は、先に本 canon を **MARGE** してから実装する

---

## ビュー
- care.v_user_with_branches … 存在
- care.v_staff_with_branches … **新規作成（スタッフ1=1行、branch_ids / branch_names / branches_json を集約）**

### 実装ノート（v_staff_with_branches）
- `s.*` を公開しつつ、所属ブランチを array / json で集約。
- RLSは基底テーブルのポリシーが適用（SECURITY INVOKER）。
- 推奨Index: staff_branch_memberships.staff_id, branch_id
- UIでは `branches_json` をタグ表示に利用可能。

---

## ルート名
- Users: user-list / user-detail / user-edit / user-new  
- Staffs: staff-list / staff-detail / staff-edit / staff-new  

---

## RLS 前提
- company_id による絞り込みを基本とする  
- 会社境界の出所は **care.branches.company_id** とする（staffs に company_id は持たせない前提）  
- 施設長や統括管理者（role='admin'）は branch_id 未所持のケースがある → 後日対応  
- 会社境界は branches.company_id を起点に判定する。
- RLS では同一テーブルを参照せず、関数（SECURITY DEFINER）を用いて会社境界を判定する。
  - 関数: care.fn_is_branch_in_my_companies(branch_id uuid) → boolean
  - user_branch_memberships / staff_branch_memberships の各ポリシーは当該関数を参照する
  
---

## 開発運用ルール
- 新規追加・構造変更 = **MARGE**  
- 既存微修正 = **UPDATE**  
- 返答には必ず UPDATE / MARGE を明記  
- canon.md を唯一の正とし、差分はここに記録する  
- contracts.ts に物理テーブル名・ビュー名を集中管理
- **FQ_TABLE / FQ_VIEW は当面利用しない（参照は `fq.table()` / `fq.view()` を使用）。ただし将来再利用のため定義は残置。**


## 開発運用ルール（Git）
- push 前には必ず以下を実行すること：
  ```bash
  git fetch origin
  git rebase origin/main

---

## AIとのやりとりルール
- AIが新しい提案を返すときは、必ず canon.md に追記すべき「差分案」を提示する  
- あなた（人間）はそれを確認して OK/NG 判断し、OKなら canon.md にコピペしてコミットする  
- これにより記録と実装のズレを最小化する  

---

## Canon差分確認フロー（運用）
- 毎営業日の開始時に、`docs/carelog-canon.md` の差分を確認する。  
- 手順:  
  1. `git switch main && git pull --ff-only`  
  2. `git diff` / VS Code Timeline で変更点を精読  
  3. 変更が必要なら修正コミット（prefix: `canon:`）  
  4. レビュー完了タグ `canon-reviewed-YYYY-MM-DD` を作成・push  
- 原則として canon.md は **唯一のSoT**。仕様提案はPRで差分を提示してからマージする。  

---

# UPDATE / MARGE
- **MARGE**: canon.md を整理し、`care.staff_branch_memberships` の詳細仕様と RLS 前提の整合を統合。  
- **UPDATE**: 重複していた「RLS 前提」の章を一つに統合し、会社境界の説明を加筆。  
- **MARGE**: `care.care_logs` に対し、`title`/`content` の **DEFAULT**（'（無題）' / '（未入力）'）を設定し、**NOT NULL** 制約を付与。  
- **MARGE**: `care.care_logs.user_id` → `care.users(id)` の外部キーを **ON DELETE SET NULL** で定義（孤児ログの恒久防止）。参照列にインデックス追加。  
- **MARGE**: `care.staff_branch_memberships` / `care.user_branch_memberships` に対し、外部キー制約と複合 UNIQUE を正式仕様として明記。  
- **UPDATE**: 運用メモに「削除された利用者に紐づく過去ログは user_id=NULL で保持（履歴保全）」を明記。  

# UPDATE
- 「開発運用ルール」に FQ_TABLE / FQ_VIEW に関する注意書きを追加  
- 「user_branch_memberships」テーブルの章を staff と同じ形式で追加

---

## Supabase Edge Functions ポリシー
- `admin-sync-auth` 関数は **Verify JWT をオフ**にする。  
- 代わりに関数内で JWT 検証（`auth.getUser()`）および権限チェック（admin / manager）を必ず行う。  
- 理由：CORS プリフライトリクエストが JWT を持たないため、Verify JWT を有効化したままだと正常動作しないため。


## セッション引き継ぎ運用（progress.json）

1. セッション記憶の引き継ぎは日次 JSON によって行う。
2. 作業終了時に ChatGPT が `progress-YYYY-MM-DD.json` を生成し、ユーザーにダウンロードリンクを提示する。
3. JSON の内容は「人間向け」ではなく **機械向け完全フォーマット** とする。  
   - セッション情報を可能な限り損失なく格納する。  
   - 読みやすさは不要。  
4. JSON の構造は「積み上げ形式」とし、日付ごとにトップレベルキーを設ける。  
   ```json
   {
     "2025-09-26": {
       "state": { ... },
       "tasks": { ... },
       "memory_chunks": [ ... ]
     },
     "2025-09-27": { ... }
   }