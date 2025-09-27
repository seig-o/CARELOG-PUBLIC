// src/lib/contracts.ts
// CareLog「唯一の正」= carelog-canon.json をコードへ反映する参照ハブ。
// ここに無いものは使わない。追加・変更は先に canon を更新してから。

/**
 * スキーマ名
 * - 現状は public に一本化
 */
export const SCHEMA = {
  public: 'public'
} as const

/**
 * 物理テーブル名（スキーマ名を含まない）
 * - 完全修飾名が欲しい場合は fq.table(...) を使うか、FQ_TABLE を利用
 */
export const TABLE = {
  staffs:  'staffs',
  users:   'users',
  branches:'branches',
  careLogs:'care_logs',
  careLogRevisions: 'care_log_revisions',
  staffBranchMemberships: 'staff_branch_memberships', // 中間: staff×branch (M:N)
  userBranchMemberships:  'user_branch_memberships',  // 中間: user×branch (M:N)
  companies: 'companies',
} as const

/**
 * ビュー名（スキーマ名を含まない）
 */
export const VIEW = {
  vCareLogs: 'v_care_logs',
  userWithBranches:  'v_user_with_branches',
  staffWithBranches: 'v_staff_with_branches'
} as const

/**
 * RPC（定義が決まったらここに）
 */
export const RPC = {
  // 追加が決まったらここに
} as const

/**
 * ルート名（フロントの画面遷移Contract）
 */
export const ROUTE = {
  user:  { list: 'user-list',  detail: 'user-detail',  edit: 'user-edit',  new: 'user-new' },
  staff: { list: 'staff-list', detail: 'staff-detail', edit: 'staff-edit', new: 'staff-new' },
  careLog: { list: 'care-log-list', detail: 'care-log-detail', edit: 'care-log-edit', new: 'care-log-new' }
} as const

/**
 * 完全修飾名（schema.table / schema.view）を作るヘルパ
 * - ログ / supabase.from() などでの参照に便利
 */
export const fq = {
  table: (t: keyof typeof TABLE, schema: keyof typeof SCHEMA = 'public') =>
    schema === 'public' ? TABLE[t] : `${SCHEMA[schema]}.${TABLE[t]}`,
  view: (v: keyof typeof VIEW, schema: keyof typeof SCHEMA = 'public') =>
    schema === 'public' ? VIEW[v] : `${SCHEMA[schema]}.${VIEW[v]}`
}

/**
 * 利便性向上：よく使う完全修飾名を定数としても公開
 */
export const FQ_TABLE = {
  STAFFS:                fq.table('staffs'),
  USERS:                 fq.table('users'),
  BRANCHES:              fq.table('branches'),
  CARE_LOGS:             fq.table('careLogs'),
  CARE_LOG_REVISIONS:    fq.table('careLogRevisions'),
  STAFF_BRANCH_MEMBER:   fq.table('staffBranchMemberships'),
  USER_BRANCH_MEMBER:    fq.table('userBranchMemberships'),
  COMPANIES:             fq.table('companies'),
} as const

export const FQ_VIEW = {
  V_CARE_LOGS: fq.view('vCareLogs'),
  V_USER_WITH_BRANCHES: fq.view('userWithBranches'),
  V_STAFF_WITH_BRANCHES: fq.view('staffWithBranches')
} as const

/**
 * 型の補助
 */
export type TableKey = keyof typeof TABLE
export type ViewKey  = keyof typeof VIEW