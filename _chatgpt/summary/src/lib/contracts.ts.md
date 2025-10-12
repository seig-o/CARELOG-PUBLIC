## src/lib/contracts.ts

```ts
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
 * ルート名とURLパスの契約
 * - name: 既存のルート名（後方互換）
 * - path: 直感的URL（/resource/list, /resource/new, /resource/:id, /resource/:id/edit）
 * - NOTE: careLog/carelogs 混在は解消し、キーは careLogs に統一。name は既存互換（care-log-*）を維持。
 */
export const ROUTE = {
  top: {
    name: {
      superadmin: 'top-superadmin',
      admin:      'top-admin',
      manager:    'top-manager'
    },
    path: {
      superadmin: '/top/superadmin',
      admin:      '/top/admin',
      manager:    '/top/manager'
    }
  },
  users: {
    name: {
      list:   'user-list',
      detail: 'user-detail',
      edit:   'user-edit',
      new:    'user-new'
    },
    path: {
      list:   '/user/list',
      new:    '/user/new',
      detail: (id: string) => `/user/${id}`,
      edit:   (id: string) => `/user/${id}/edit`
    }
  },
  staffs: {
    name: {
      list:   'staff-list',
      detail: 'staff-detail',
      edit:   'staff-edit',
      new:    'staff-new'
    },
    path: {
      list:   '/staff/list',
      new:    '/staff/new',
      detail: (id: string) => `/staff/${id}`,
      edit:   (id: string) => `/staff/${id}/edit`
    }
  },
  branches: {
    name: {
      list: 'branch-list',
      detail: 'branch-detail',
      edit: 'branch-edit',
      new:  'branch-new'
    },
    path: {
      list:   '/branch/list',
      new:    '/branch/new',
      detail: (id: string) => `/branch/${id}`,
      edit:   (id: string) => `/branch/${id}/edit`
    }
  },
  companies: {
    name: {
      list:   'company-list',
      detail: 'company-detail',
      edit:   'company-edit',
      new:    'company-new'
    },
    path: {
      list:   '/company/list',
      new:    '/company/new',
      detail: (id: string) => `/company/${id}`,
      edit:   (id: string) => `/company/${id}/edit`
    }
  },
  careLogs: {
    name: {
      list:   'care-log-list',
      detail: 'care-log-detail',
      edit:   'care-log-edit',
      new:    'care-log-new'
    },
    path: {
      list:   '/care-log/list',
      new:    '/care-log/new',
      detail: (id: string) => `/care-log/${id}`,
      edit:   (id: string) => `/care-log/${id}/edit`
    }
  }
} as const

/**
 * 完全修飾名（schema.table / schema.view）を作るヘルパ
 * - public は「非修飾」を返す（= 既定スキーマ）
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
 * - 画面では supabase.from(FQ_TABLE.USERS) のように使う
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
  V_CARE_LOGS:           fq.view('vCareLogs'),
  V_USER_WITH_BRANCHES:  fq.view('userWithBranches'),
  V_STAFF_WITH_BRANCHES: fq.view('staffWithBranches')
} as const

/**
 * 既存コード互換エイリアス（好みでこちらを import してもOK）
 * - プロジェクト内の呼び方を FQ_TABLE.* に寄せるまでの橋渡し
 */
export const FQ_USERS      = FQ_TABLE.USERS
export const FQ_STAFFS     = FQ_TABLE.STAFFS
export const FQ_BRANCHES   = FQ_TABLE.BRANCHES
export const FQ_CARE_LOGS  = FQ_TABLE.CARE_LOGS
export const FQ_COMPANIES  = FQ_TABLE.COMPANIES

/**
 * 型の補助
 */
type ValueOf<T> = T[keyof T]
export type TableKey = keyof typeof TABLE
export type ViewKey  = keyof typeof VIEW

// ルート名（string literal の合併）
export type RouteName =
  | ValueOf<typeof ROUTE['users']['name']>
  | ValueOf<typeof ROUTE['staffs']['name']>
  | ValueOf<typeof ROUTE['branches']['name']>
  | ValueOf<typeof ROUTE['companies']['name']>
  | ValueOf<typeof ROUTE['careLogs']['name']>```

