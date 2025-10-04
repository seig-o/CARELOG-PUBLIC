<!-- auto-generated -->
# ChatGPT Review Bundle

## 目次

- [README.md](#readme-md)
- [docs/carelog-canon.md](#docs-carelog-canon-md)
- [src/App.vue](#src-app-vue)
- [src/components/AppHeader.vue](#src-components-appheader-vue)
- [src/lib/contracts.ts](#src-lib-contracts-ts)
- [src/lib/db/branches.ts](#src-lib-db-branches-ts)
- [src/lib/db/me.ts](#src-lib-db-me-ts)
- [src/lib/db/staffs.ts](#src-lib-db-staffs-ts)
- [src/lib/db/users.ts](#src-lib-db-users-ts)
- [src/lib/supabase.ts](#src-lib-supabase-ts)
- [src/main.ts](#src-main-ts)
- [src/router/index.ts](#src-router-index-ts)
- [src/stores/auth.ts](#src-stores-auth-ts)
- [src/types/branch.ts](#src-types-branch-ts)
- [src/types/staff.ts](#src-types-staff-ts)
- [src/types/user.ts](#src-types-user-ts)
- [src/views/branches/BranchList.vue](#src-views-branches-branchlist-vue)
- [src/views/branches/BranchUpsert.vue](#src-views-branches-branchupsert-vue)
- [src/views/CareLogList.vue](#src-views-careloglist-vue)
- [src/views/carelogs/CareLogDetail.vue](#src-views-carelogs-carelogdetail-vue)
- [src/views/carelogs/CareLogList.vue](#src-views-carelogs-careloglist-vue)
- [src/views/carelogs/CareLogUpsert.vue](#src-views-carelogs-carelogupsert-vue)
- [src/views/LoginView.vue](#src-views-loginview-vue)
- [src/views/staffs/StaffDetail.vue](#src-views-staffs-staffdetail-vue)
- [src/views/staffs/StaffList.vue](#src-views-staffs-stafflist-vue)
- [src/views/staffs/StaffUpsert.vue](#src-views-staffs-staffupsert-vue)
- [src/views/users/UserDetail.vue](#src-views-users-userdetail-vue)
- [src/views/users/UserList.vue](#src-views-users-userlist-vue)
- [src/views/users/UserUpsert.vue](#src-views-users-userupsert-vue)
- [src/vite-env.d.ts](#src-vite-env-d-ts)

---

## README.md

```md
# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).
# CARELOG
# touch for mirror test 2025年 9月24日 水曜日 15時27分19秒 JST

```

---

## docs/carelog-canon.md

```md
# CareLog System Canon (Source of Truth)

本ファイルは CareLog システム開発の唯一の正。ここに書かれていないものは利用しない。

---

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
  - staff_id (fk → care.staffs.id)  
  - branch_id (fk → care.branches.id)  
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

# UPDATE
- 「開発運用ルール」に FQ_TABLE / FQ_VIEW に関する注意書きを追加  
- 「user_branch_memberships」テーブルの章を staff と同じ形式で追加
```

---

## src/App.vue

```vue
<template>
  <n-config-provider>
    <n-dialog-provider>
      <n-message-provider>
        <div class="min-h-screen bg-gray-50">
          <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
            <AppHeader class="mb-4" />
            <router-view />
          </div>
        </div>
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { NConfigProvider, NDialogProvider, NMessageProvider } from 'naive-ui'
import AppHeader from '@/components/AppHeader.vue'
</script>
```

---

## src/components/AppHeader.vue

```vue
<template>
  <header class="flex items-center justify-between p-4 border-b">
    <h1 class="text-xl font-bold">CareLogApp</h1>
    
    <nav class="v-overflow">
      <ul>
        <li class="n-menu-item"><router-link to="/">ホーム</router-link></li>
        <li class="n-menu-item"><router-link :to="{ name: 'staff-list' }">スタッフ一覧</router-link></li>
        <li class="n-menu-item"><router-link :to="{ name: 'staff-new' }">新規スタッフ追加</router-link></li>
        <li class="n-menu-item"><router-link :to="{ name: 'user-list' }">ユーザー一覧</router-link></li>
        <li class="n-menu-item"><router-link :to="{ name: 'user-new' }">新規ユーザー追加</router-link></li>
        <li class="n-menu-item"><div @click="logout" class="cursor-pointer">ログアウト</div></li>
      </ul>
    </nav>
    <n-select
      v-if="auth.companies.length"
      :options="auth.companies.map(c => ({ label: c.name, value: c.id }))"
      v-model:value="auth.activeCompanyId"
      size="small"
      style="width: 220px"
    />
  </header>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { NSelect } from 'naive-ui'

const auth = useAuthStore()
if (!auth.companies.length) {
  auth.fetchCompanies().catch(() => {})
}

function logout() {
  auth.signOut()
}
</script>
```

---

## src/lib/contracts.ts

```ts
// src/lib/contracts.ts
// CareLog「唯一の正」= /docs/carelog-canon.md をコードへ反映する参照ハブ。
// ここに無いものは使わない。追加・変更は先に canon.md を更新してから。

/**
 * スキーマ名（将来 care 以外を増やす場合もここ経由）
 */
export const SCHEMA = {
  care: 'care'
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
  userBranchMemberships:  'user_branch_memberships',  // ★ 中間: user×branch (M:N) ← 追加
  companies: 'companies',
} as const

/**
 * ビュー名（スキーマ名を含まない）
 */
export const VIEW = {
  // 使うと決めたものだけを登録
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
  staff: { list: 'staff-list', detail: 'staff-detail', edit: 'staff-edit', new: 'staff-new' }
} as const

/**
 * 完全修飾名（schema.table / schema.view）を作るヘルパ
 * - ログ / supabase.from() などでの参照に便利
 */
export const fq = {
  table: (t: keyof typeof TABLE, schema: keyof typeof SCHEMA = 'care') =>
    `${SCHEMA[schema]}.${TABLE[t]}`,
  view: (v: keyof typeof VIEW, schema: keyof typeof SCHEMA = 'care') =>
    `${SCHEMA[schema]}.${VIEW[v]}`
}

/**
 * 利便性向上：よく使う完全修飾名を定数としても公開
 * - 既存コードは fq.table()/fq.view() を使い続けてもOK（互換）
 * - 新規コードは FQ_TABLE / FQ_VIEW を使うとtypo事故が減ります
 */
export const FQ_TABLE = {
  STAFFS:                fq.table('staffs'),
  USERS:                 fq.table('users'),
  BRANCHES:              fq.table('branches'),
  CARE_LOGS:             fq.table('careLogs'),
  CARE_LOG_REVISIONS:    fq.table('careLogRevisions'),
  STAFF_BRANCH_MEMBER:   fq.table('staffBranchMemberships'),
  USER_BRANCH_MEMBER:    fq.table('userBranchMemberships'), // ← 追加
  COMPANIES:             fq.table('companies'),
} as const

export const FQ_VIEW = {
  V_USER_WITH_BRANCHES:  fq.view('userWithBranches'),
  V_STAFF_WITH_BRANCHES: fq.view('staffWithBranches')
} as const

/**
 * 型の補助（任意）：キーのユニオンを使いたいときにどうぞ
 */
export type TableKey = keyof typeof TABLE
export type ViewKey  = keyof typeof VIEW
```

---

## src/lib/db/branches.ts

```ts
import { supabase } from '@/lib/supabase'
import type { Branch } from '@/types/branch'

export async function listBranches(): Promise<Branch[]> {
  const { data, error } = await supabase
    .from('branches')
    .select('id, name, address, phone') // ✅ カラムを明示
    .order('name', { ascending: true })
  if (error) throw error
  return data as Branch[]
}
```

---

## src/lib/db/me.ts

```ts
import { supabase } from '@/lib/supabase'
import type { Staff } from '@/types/staff'

export async function getMe(): Promise<Staff | null> {
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) return null
  const { data, error } = await supabase
    .from('staffs')
    .select('id, auth_user_id, name, role') // ✅ user_id → auth_user_id に修正
    .eq('auth_user_id', uid)
    .maybeSingle()
  if (error) throw error
  return data as Staff | null
}
```

---

## src/lib/db/staffs.ts

```ts
import { supabase } from '@/lib/supabase'
import type { Staff } from '@/types/staff'

const table = 'staffs'
const mTable = 'staff_branch_memberships'

export async function listStaffs(): Promise<Staff[]> {
  const { data, error } = await supabase
    .from(table)
    .select('id, auth_user_id, name, role, created_at, updated_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as Staff[]
}

export async function getStaffById(id: string): Promise<Staff | null> {
  const { data, error } = await supabase
    .from(table)
    .select('id, auth_user_id, name, role, created_at, updated_at')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as unknown as Staff | null
}

type CreateStaffInput = {
  name: string
  role: Staff['role']
  auth_user_id?: string | null
}
export async function createStaff(input: CreateStaffInput): Promise<Staff> {
  const { data, error } = await supabase
    .from(table)
    .insert({
      name: input.name,
      role: input.role,
      auth_user_id: input.auth_user_id ?? null,
    })
    .select('id, auth_user_id, name, role, created_at, updated_at')
    .single()
  if (error) throw error
  return data as unknown as Staff
}

export async function updateStaff(id: string, input: Partial<CreateStaffInput>): Promise<Staff> {
  const { data, error } = await supabase
    .from(table)
    .update({
      name: input.name,
      role: input.role,
      auth_user_id: input.auth_user_id,
    })
    .eq('id', id)
    .select('id, auth_user_id, name, role, created_at, updated_at')
    .single()
  if (error) throw error
  return data as unknown as Staff
}

export async function deleteStaff(id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}

/** memberships */
export async function getStaffMembershipBranchIds(staffId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from(mTable)
    .select('branch_id')
    .eq('staff_id', staffId)
  if (error) throw error
  return (data ?? []).map((r: any) => r.branch_id as string)
}

export async function syncStaffMemberships(staffId: string, nextBranchIds: string[]) {
  const { data: curData, error: curErr } = await supabase
    .from(mTable)
    .select('id,branch_id')
    .eq('staff_id', staffId)
  if (curErr) throw curErr

  const cur = new Set((curData ?? []).map((r:any)=> r.branch_id as string))
  const next = new Set(nextBranchIds)

  const toAdd = [...next].filter(id => !cur.has(id))
  const toDel = (curData ?? []).filter((r:any)=> !next.has(r.branch_id)).map((r:any)=> r.id as string)

  if (toAdd.length) {
    const rows = toAdd.map(id => ({ staff_id: staffId, branch_id: id }))
    const { error } = await supabase.from(mTable).insert(rows)
    if (error) throw error
  }
  if (toDel.length) {
    const { error } = await supabase.from(mTable).delete().in('id', toDel)
    if (error) throw error
  }
}

/** 主所属の切替（オプション） */
export async function setPrimaryBranch(staffId: string, branchId: string) {
  // 全false → 指定1件をtrue
  const { error: e1 } = await supabase
    .from(mTable)
    .update({ is_primary: false })
    .eq('staff_id', staffId)
    .eq('is_primary', true)
  if (e1) throw e1

  const { error: e2 } = await supabase
    .from(mTable)
    .update({ is_primary: true })
    .eq('staff_id', staffId)
    .eq('branch_id', branchId)
  if (e2) throw e2
}
```

---

## src/lib/db/users.ts

```ts
import { supabase } from '@/lib/supabase'
import type { CareUser } from '@/types/user'

const table = 'users' // care.users
const mTable = 'user_branch_memberships'

export async function listUsers(): Promise<CareUser[]> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as CareUser[]
}

export async function getUserById(id: string): Promise<CareUser | null> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as CareUser | null
}

type CreateUserInput = Partial<Omit<CareUser, 'id' | 'created_at' | 'updated_at'>>
export async function createUser(input: CreateUserInput): Promise<CareUser> {
  const { data, error } = await supabase
    .from(table)
    .insert(input)
    .select('*')
    .single()
  if (error) throw error
  return data as CareUser
}

export async function updateUser(id: string, input: Partial<CareUser>): Promise<CareUser> {
  const { data, error } = await supabase
    .from(table)
    .update(input)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as CareUser
}

export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}

/** memberships */
export async function getUserMembershipBranchIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from(mTable)
    .select('branch_id')
    .eq('user_id', userId)
  if (error) throw error
  return (data ?? []).map((r: any) => r.branch_id as string)
}

export async function syncUserMemberships(userId: string, nextBranchIds: string[]) {
  const { data: curData, error: curErr } = await supabase
    .from(mTable)
    .select('id,branch_id')
    .eq('user_id', userId)
  if (curErr) throw curErr

  const cur = new Set((curData ?? []).map((r: any) => r.branch_id as string))
  const next = new Set(nextBranchIds)

  const toAdd = [...next].filter(id => !cur.has(id))
  const toDel = (curData ?? [])
    .filter((r: any) => !next.has(r.branch_id))
    .map((r: any) => r.id as string)

  if (toAdd.length) {
    const rows = toAdd.map(id => ({ user_id: userId, branch_id: id }))
    const { error } = await supabase.from(mTable).insert(rows)
    if (error) throw error
  }
  if (toDel.length) {
    const { error } = await supabase.from(mTable).delete().in('id', toDel)
    if (error) throw error
  }
}
```

---

## src/lib/supabase.ts

```ts
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL!
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY!

// ベース
export const supabase = createClient(url, anon)

// care スキーマ用（Accept-Profile: care を付与）
export const supabaseCare = supabase.schema('care')

/**
 * 互換レイヤー:
 * - fromCare('staffs') でも fromCare('care.staffs') でも動く
 * - 内部では常に supabaseCare を使う（= スキーマはヘッダで指定）
 */
export const fromCare = (name: string) => {
  const unqualified = name.startsWith('care.') ? name.slice('care.'.length) : name
  return supabaseCare.from(unqualified)
}
```

---

## src/main.ts

```ts
// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

const auth = useAuthStore(pinia)

// 開発時はデバッグ用に window に公開（任意）
if (import.meta.env.DEV) {
  // @ts-ignore
  window.auth = auth
  // @ts-ignore
  window.supabase = supabase
}

// --- 起動時の初期同期（セッション→me） ---
try {
  await auth.refreshSession()
  if (auth.session) {
    await auth.fetchMe().catch((e) => console.warn('[init fetchMe]', e))
  }
} catch (e) {
  console.warn('[init auth]', e)
}

// --- 認証状態の変化に追従（ログイン/ログアウト/トークン更新） ---
let fetching = false
supabase.auth.onAuthStateChange(async (_event, session) => {
  auth.session = session ?? null
  if (!auth.session) {
    auth.me = null
    return
  }
  if (fetching) return
  fetching = true
  try {
    await auth.fetchMe().catch((e) => console.warn('[auth change fetchMe]', e))
  } finally {
    fetching = false
  }
})

// ルーターの初期解決を待ってからマウント（初期描画のチラつき防止）
await router.isReady()
app.mount('#app')
```

---

## src/router/index.ts

```ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import UserList from '@/views/users/UserList.vue'
import UserUpsert from '@/views/users/UserUpsert.vue'
import StaffList from '@/views/staffs/StaffList.vue'
import StaffUpsert from '@/views/staffs/StaffUpsert.vue'

// ★ 追加：拠点（branches）
import BranchList from '@/views/branches/BranchList.vue'
import BranchUpsert from '@/views/branches/BranchUpsert.vue'

// ★ 既存：詳細画面（遅延読み込み）
const UserDetail = () => import('@/views/users/UserDetail.vue')
const StaffDetail = () => import('@/views/staffs/StaffDetail.vue')

// ★ 新規（carelogs は遅延読み込み、既存を壊さない）
const CareLogListNew   = () => import('@/views/carelogs/CareLogList.vue')
const CareLogDetailNew = () => import('@/views/carelogs/CareLogDetail.vue')
const CareLogUpsertNew = () => import('@/views/carelogs/CareLogUpsert.vue')

const routes = [
  { path: '/login', name: 'login', meta: { public: true }, component: () => import('@/views/LoginView.vue') },

  // 既存トップ（維持）
  { path: '/', name: 'care-log-list', component: () => import('@/views/CareLogList.vue') },

  // Users
  { path: '/admin/users', name: 'user-list', component: UserList, meta: { requiresAdmin: true } },
  { path: '/admin/users/new', name: 'user-new', component: UserUpsert, meta: { requiresAdmin: true } },
  { path: '/admin/users/:id', name: 'user-detail', component: UserDetail, meta: { requiresAdmin: true } },
  { path: '/admin/users/:id/edit', name: 'user-edit', component: UserUpsert, meta: { requiresAdmin: true } },

  // Staffs
  { path: '/admin/staffs', name: 'staff-list', component: StaffList, meta: { requiresAdmin: true } },
  { path: '/admin/staffs/new', name: 'staff-new', component: StaffUpsert, meta: { requiresAdmin: true } },
  { path: '/admin/staffs/:id', name: 'staff-detail', component: StaffDetail, meta: { requiresAdmin: true } },
  { path: '/admin/staffs/:id/edit', name: 'staff-edit', component: StaffUpsert, meta: { requiresAdmin: true } },

  // Branches（★追加）
  { path: '/admin/branches', name: 'branch-list', component: BranchList, meta: { requiresAdmin: true } },
  { path: '/admin/branches/new', name: 'branch-new', component: BranchUpsert, meta: { requiresAdmin: true } },
  { path: '/admin/branches/:id/edit', name: 'branch-edit', component: BranchUpsert, meta: { requiresAdmin: true } },

  // =========================
  // ★ ここから追記：carelogs（新規画面群）
  // =========================
  { path: '/carelogs',        name: 'carelog-list',   component: CareLogListNew },
  { path: '/carelogs/new',    name: 'carelog-new',    component: CareLogUpsertNew },
  { path: '/carelogs/:id',    name: 'carelog-detail', component: CareLogDetailNew },
  { path: '/carelogs/:id/edit', name: 'carelog-edit', component: CareLogUpsertNew },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (to.meta?.public) return true
  if (!auth.session) await auth.refreshSession()
  if (!auth.session) return { name: 'login', query: { redirect: to.fullPath } }
  if (!auth.me && !auth.loadingMe) { try { await auth.fetchMe() } catch {} }
  return true
})

export default router
```

---

## src/stores/auth.ts

```ts
import { defineStore } from 'pinia'
import router from '../router'
import { supabase, fromCare } from '@/lib/supabase'
import { TABLE } from '@/lib/contracts'

type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']
// ✅ branch_id は membership に移行したので型から削除
type Me = { id: string; role?: string } | null

export const useAuthStore = defineStore('auth', {
  state: () => ({
    session: null as Session | null,
    me: null as Me,
    loadingMe: false,
    activeCompanyId: null as string | null,
    companies: [] as Array<{ id: string; name: string }>,
  }),

  actions: {
    // 会社一覧のロード
    async fetchCompanies () {
      const { data, error } = await fromCare('companies') // TABLE側にあれば TABLE.companies でOK
        .select('id, name')
        .order('name', { ascending: true })
      if (error) throw error
      this.companies = data ?? []
      if (!this.activeCompanyId && this.companies.length) {
        this.activeCompanyId = this.companies[0].id
      }
    },

    async refreshSession () {
      const { data: { session } } = await supabase.auth.getSession()
      this.session = session ?? null
      return this.session
    },

    async fetchMe () {
      if (!this.session) await this.refreshSession()
      if (!this.session) { this.me = null; return null }
      this.loadingMe = true
      try {
        const { data, error } = await fromCare(TABLE.staffs) // "staffs"（care スキーマ）
          .select('id, role')
          .eq('auth_user_id', this.session!.user.id)
          .single()
        if (error) throw error
        this.me = data
        return data
      } finally {
        this.loadingMe = false
      }
    },

    async signIn (email: string, password: string) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      this.session = data.session
      await this.fetchMe()
    },

    async signOut () {
      await supabase.auth.signOut()
      this.session = null
      this.me = null
      router.push({ name: 'login' })
    },

    // 互換ユーティリティ（他所で呼んでても落ちないように）
    async ensureReady (force = false) {
      // @ts-ignore
      if (this.__ensuring && !force) return
      // @ts-ignore
      this.__ensuring = true
      try {
        if (!this.session) await this.refreshSession().catch(() => {})
        if (this.session && !this.me) await this.fetchMe().catch(() => {})
      } finally {
        // @ts-ignore
        this.__ensuring = false
      }
    },

    async init () { await this.ensureReady() },
  },
})
```

---

## src/types/branch.ts

```ts
export type Branch = {
  id: string
  name: string
  address?: string | null
  phone?: string | null
}
```

---

## src/types/staff.ts

```ts
export type StaffRole = 'admin' | 'manager' | 'caregiver' | 'nurse' | string

export type Staff = {
  id: string
  auth_user_id: string | null
  name: string
  role: StaffRole
  // branch_id は廃止。所属は staff_branch_memberships を参照
}

export type StaffBranchMembership = {
  id: string
  staff_id: string
  branch_id: string
  is_primary?: boolean
}
```

---

## src/types/user.ts

```ts
export type Sex = 'male' | 'female' | 'other'

export type CareUser = {
  id: string
  // ✅ 削除: branch_id は membership に統一
  // branch_id: string | null
  name: string
  name_kana?: string | null
  birthday?: string | null // 'YYYY-MM-DD'
  sex?: Sex | null
  notes?: string | null
  archived_at?: string | null
  created_at: string
  updated_at: string
}

// もし「主所属IDだけを一緒に扱いたい」場面があるなら、読み取り用型を追加（任意）
export type CareUserWithPrimary = CareUser & {
  primary_branch_id: string | null
}

export type UserBranchMembership = {
  id: string
  user_id: string
  branch_id: string
  // 主所属をクライアントで扱うなら型にも持たせる（DBに列あり）
  is_primary?: boolean
}
```

---

## src/views/branches/BranchList.vue

```vue
<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">拠点一覧</h1>
      <n-button type="primary" @click="$router.push({ name: 'branch-new' })">新規追加</n-button>
    </div>

    <!-- 会社未選択の案内 -->
    <n-alert v-if="!auth.activeCompanyId" type="info" class="max-w-2xl">
      会社が選択されていません。右上のセレクタから会社を選択してください。
    </n-alert>

    <!-- 検索 -->
    <div class="max-w-md" v-if="auth.activeCompanyId">
      <n-input v-model:value="q" placeholder="拠点名で検索" clearable />
    </div>

    <!-- ローディング -->
    <div v-if="loading && auth.activeCompanyId" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <n-card v-for="i in 6" :key="i" embedded>
        <n-skeleton text :repeat="1" />
        <div class="mt-3 flex gap-2">
          <n-skeleton text style="width:72px" />
          <n-skeleton text style="width:72px" />
        </div>
      </n-card>
    </div>

    <!-- 一覧 -->
    <div v-else-if="auth.activeCompanyId" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <n-card
        v-for="b in filtered"
        :key="b.id"
        hoverable
        class="transition-shadow duration-200 hover:shadow-lg"
      >
        <div class="flex items-center justify-between">
          <div>
            <div class="text-base font-medium">{{ b.name }}</div>
            <div class="text-xs text-gray-400 mt-1">ID: {{ b.id }}</div>
          </div>
        </div>

        <div class="mt-4 flex gap-2">
          <n-button size="small" @click="$router.push({ name: 'branch-edit', params: { id: b.id } })">
            編集
          </n-button>
          <n-button size="small" tertiary type="error" @click="confirmRemove(b)">削除</n-button>
        </div>
      </n-card>
    </div>

    <!-- 空表示 -->
    <n-empty
      v-if="auth.activeCompanyId && !loading && filtered.length === 0"
      description="該当する拠点がありません"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  NButton, NCard, NInput, NEmpty, NSkeleton, NAlert, useDialog, useMessage
} from 'naive-ui'
import { supabase } from '@/lib/supabase'

type Branch = { id: string | number; name: string; company_id: string }

const auth = useAuthStore()
const care = () => supabase.schema('care')

const q = ref('')
const loading = ref(true)
const branches = ref<Branch[]>([])
const dialog = useDialog()
const message = useMessage()

async function load() {
  if (!auth.activeCompanyId) {
    branches.value = []
    loading.value = false
    return
  }
  loading.value = true
  try {
    const { data, error } = await care()
      .from('branches')
      .select('id,name,company_id')
      .eq('company_id', auth.activeCompanyId)
      .order('name', { ascending: true })
    if (error) throw error
    branches.value = data ?? []
  } catch (e: any) {
    console.error(e)
    message.error(e?.message ?? '拠点の取得に失敗しました')
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => auth.activeCompanyId, () => load(), { immediate: false })

const filtered = computed(() => {
  const s = q.value.trim().toLowerCase()
  if (!s) return branches.value
  return branches.value.filter(b => (b.name ?? '').toLowerCase().includes(s))
})

function confirmRemove(b: Branch) {
  dialog.warning({
    title: '削除の確認',
    content: `「${b.name}」を削除します。よろしいですか？`,
    positiveText: '削除',
    negativeText: 'キャンセル',
    onPositiveClick: async () => {
      try {
        const { error } = await care().from('branches').delete().eq('id', b.id)
        if (error) throw error
        branches.value = branches.value.filter(x => x.id !== b.id)
        message.success('削除しました')
      } catch (e: any) {
        message.error(e?.message ?? '削除に失敗しました')
      }
    }
  })
}
</script>
```

---

## src/views/branches/BranchUpsert.vue

```vue
<template>
  <div class="max-w-xl">
    <n-card>
      <div class="flex items-center justify-between mb-2">
        <h1 class="text-lg font-semibold">拠点{{ isEdit ? '編集' : '新規作成' }}</h1>
        <n-button tertiary @click="$router.push({ name: 'branch-list' })">一覧へ</n-button>
      </div>

      <n-alert v-if="!auth.activeCompanyId" type="info" class="mb-3">
        会社が選択されていません。右上のセレクタから会社を選択してください。
      </n-alert>

      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top" size="large">
        <n-space vertical :size="18">
          <n-form-item label="拠点名" path="name">
            <n-input v-model:value="form.name" placeholder="例）松本本店" clearable />
          </n-form-item>

          <div class="flex justify-end gap-2 pt-2">
            <n-button ghost @click="$router.push({ name: 'branch-list' })">キャンセル</n-button>
            <n-button type="primary" :loading="submitting" :disabled="!auth.activeCompanyId" @click="save">
              保存
            </n-button>
          </div>
        </n-space>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { fromCare } from '@/lib/supabase'
import { TABLE } from '@/lib/contracts'
import { NCard, NButton, NForm, NFormItem, NInput, NSpace, NAlert, useMessage } from 'naive-ui'

type BranchForm = { id?: string; name: string }

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const message = useMessage()

const id = route.params.id as string | undefined
const isEdit = computed(() => Boolean(id))

const formRef = ref()
const submitting = ref(false)
const form = ref<BranchForm>({ name: '' })

const rules = {
  name: { required: true, trigger: ['blur', 'input'], message: '拠点名を入力してください' }
}

onMounted(async () => {
  if (!isEdit.value) return
  try {
    const { data, error } = await fromCare(TABLE.branches)
      .select('id, name, company_id')
      .eq('id', id)
      .single()
    if (error) throw error
    form.value = { id: data!.id as string, name: (data as any).name ?? '' }
  } catch (e: any) {
    message.error(e?.message ?? '拠点の取得に失敗しました')
  }
})

async function save () {
  try {
    await formRef.value?.validate()
    submitting.value = true

    if (isEdit.value) {
      const { error } = await fromCare(TABLE.branches)
        .update({ name: form.value.name })
        .eq('id', form.value.id)
      if (error) throw error
      message.success('更新しました')
    } else {
      if (!auth.activeCompanyId) {
        message.warning('会社を選択してください')
        return
      }
      const { error } = await fromCare(TABLE.branches)
        .insert({ name: form.value.name, company_id: auth.activeCompanyId })
      if (error) throw error
      message.success('追加しました')
    }
    router.push({ name: 'branch-list' })
  } catch (e: any) {
    if (e?.message) console.error(e)
    message.error(e?.message ?? '保存に失敗しました')
  } finally {
    submitting.value = false
  }
}
</script>
```

---

## src/views/CareLogList.vue

```vue
<script setup lang="ts">
import CareLogList from '@/views/carelogs/CareLogList.vue'
</script>

<template>
  <CareLogList />
</template>
```

---

## src/views/carelogs/CareLogDetail.vue

```vue
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fromCare } from '@/lib/supabase'
import { TABLE } from '@/lib/contracts'
import {
  NCard, NSpace, NButton, NDivider, NDescriptions, NDescriptionsItem, NAlert, useMessage
} from 'naive-ui'

type CareLog = {
  id: string
  date: string | null
  user_id: string | null
  staff_id: string | null
  branch_id: string | null
  title: string | null
  content: string | null
  created_at: string | null
}

const route = useRoute()
const router = useRouter()
const message = useMessage()

const id = route.params.id as string
const loading = ref(false)
const item = ref<CareLog | null>(null)

// 付随情報（名前表示用・簡易）
const userName   = ref<string | null>(null)
const staffName  = ref<string | null>(null)
const branchName = ref<string | null>(null)

const notFound = computed(() => !loading.value && !item.value)

async function loadNames (userId: string | null, staffId: string | null, branchId: string | null) {
  try {
    if (userId) {
      const { data } = await fromCare(TABLE.users).select('name').eq('id', userId).maybeSingle()
      userName.value = (data as any)?.name ?? userId
    }
    if (staffId) {
      const { data } = await fromCare(TABLE.staffs).select('name').eq('id', staffId).maybeSingle()
      staffName.value = (data as any)?.name ?? staffId
    }
    if (branchId) {
      const { data } = await fromCare(TABLE.branches).select('name').eq('id', branchId).maybeSingle()
      branchName.value = (data as any)?.name ?? branchId
    }
  } catch {
    // 名前解決はベストエフォート
  }
}

async function fetchOne () {
  loading.value = true
  try {
    const { data, error } = await fromCare(TABLE.careLogs)
      .select('id, date, user_id, staff_id, branch_id, title, content, created_at')
      .eq('id', id)
      .single()
    if (error) throw error
    item.value = data as CareLog
    await loadNames(item.value.user_id, item.value.staff_id, item.value.branch_id)
  } catch (e: any) {
    console.error(e)
    message.error(e?.message ?? 'ケアログの取得に失敗しました')
    item.value = null
  } finally {
    loading.value = false
  }
}

function goList () { router.push({ name: 'carelog-list' }) }
function goEdit () { router.push({ name: 'carelog-edit', params: { id } }) }

onMounted(fetchOne)
</script>

<template>
  <div class="p-4">
    <n-card>
      <div class="flex items-center justify-between mb-2">
        <h1 class="text-lg font-semibold">ケアログ詳細</h1>
        <n-space>
          <n-button tertiary @click="goList">一覧へ</n-button>
          <n-button type="primary" @click="goEdit">編集</n-button>
        </n-space>
      </div>

      <n-divider style="margin:8px 0 16px;" />

      <n-alert v-if="notFound" type="warning" class="mb-3">
        データが見つかりませんでした。
      </n-alert>

      <template v-else>
        <n-descriptions
          label-placement="left"
          :column="1"
          bordered
          size="small"
        >
          <n-descriptions-item label="ID">
            {{ item?.id }}
          </n-descriptions-item>

          <n-descriptions-item label="日付">
            {{ item?.date || '—' }}
          </n-descriptions-item>

          <n-descriptions-item label="利用者">
            {{ userName ?? item?.user_id ?? '—' }}
          </n-descriptions-item>

          <n-descriptions-item label="担当">
            {{ staffName ?? item?.staff_id ?? '—' }}
          </n-descriptions-item>

          <n-descriptions-item label="拠点">
            {{ branchName ?? item?.branch_id ?? '—' }}
          </n-descriptions-item>

          <n-descriptions-item label="タイトル">
            {{ item?.title || '—' }}
          </n-descriptions-item>

          <n-descriptions-item label="本文">
            <div style="white-space:pre-wrap">{{ item?.content || '—' }}</div>
          </n-descriptions-item>

          <n-descriptions-item label="作成日時">
            {{ item?.created_at || '—' }}
          </n-descriptions-item>
        </n-descriptions>
      </template>
    </n-card>
  </div>
</template>
```

---

## src/views/carelogs/CareLogList.vue

```vue
<script setup lang="ts">
import { ref, onMounted, h, watch } from 'vue'
import { useRouter } from 'vue-router'
import { fromCare } from '@/lib/supabase'
import { TABLE } from '@/lib/contracts'
import {
  NDataTable, NButton, NInput, NDatePicker, NSelect, NSpace, NDivider, useMessage
} from 'naive-ui'

type CareLogRow = {
  id: string
  date: string | null
  user_id: string | null
  staff_id: string | null
  branch_id: string | null
  title?: string | null
  content?: string | null
  created_at?: string | null
}

const router = useRouter()
const message = useMessage()

const loading = ref(false)
const rows = ref<CareLogRow[]>([])

const q = ref('')
const selectedBranch = ref<string | null>(null)
const selectedStaff  = ref<string | null>(null)
const selectedUser   = ref<string | null>(null)
const dateRange      = ref<[number, number] | null>(null)

const branchOptions = ref<{ label: string; value: string }[]>([])
const staffOptions  = ref<{ label: string; value: string }[]>([])
const userOptions   = ref<{ label: string; value: string }[]>([])

async function loadOptions () {
  try {
    {
      const { data } = await fromCare(TABLE.branches).select('id, name').order('name')
      branchOptions.value = (data ?? []).map(b => ({ label: (b as any).name, value: (b as any).id }))
    }
    {
      const { data } = await fromCare(TABLE.staffs).select('id, name').order('id')
      staffOptions.value = (data ?? []).map(s => ({ label: (s as any).name ?? (s as any).id, value: (s as any).id }))
    }
    {
      const { data } = await fromCare(TABLE.users).select('id, name').order('id')
      userOptions.value = (data ?? []).map(u => ({ label: (u as any).name ?? (u as any).id, value: (u as any).id }))
    }
  } catch { /* optionsはベストエフォート */ }
}

async function fetchRows () {
  loading.value = true
  try {
    let qy = fromCare(TABLE.careLogs)
      .select('id, date, user_id, staff_id, branch_id, title, content, created_at')
      .order('date', { ascending: false })

    if (selectedBranch.value) qy = qy.eq('branch_id', selectedBranch.value)
    if (selectedStaff.value)  qy = qy.eq('staff_id', selectedStaff.value)
    if (selectedUser.value)   qy = qy.eq('user_id', selectedUser.value)

    if (dateRange.value) {
      const [fromTs, toTs] = dateRange.value
      const from = new Date(fromTs).toISOString().slice(0, 10)
      const to   = new Date(toTs).toISOString().slice(0, 10)
      qy = qy.gte('date', from).lte('date', to)
    }

    if (q.value.trim()) {
      const like = `%${q.value.trim()}%`
      qy = qy.or(`title.ilike.${like},content.ilike.${like}`)
    }

    const { data, error } = await qy
    if (error) throw error
    rows.value = (data ?? []) as CareLogRow[]
  } catch (e: any) {
    console.error(e)
    message.error(e?.message ?? 'ケアログの取得に失敗しました')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadOptions(), fetchRows()])
})
watch([selectedBranch, selectedStaff, selectedUser, dateRange, q], fetchRows)

const columns = [
  { title: '日付', key: 'date', width: 120 },
  { title: '利用者ID', key: 'user_id', width: 180 },
  { title: '担当ID', key: 'staff_id', width: 160 },
  { title: '拠点ID', key: 'branch_id', width: 160 },
  { title: 'タイトル', key: 'title', width: 260 },
  {
    title: '操作', key: 'actions', width: 180,
    render (row: CareLogRow) {
      return h('div', { style: 'display:flex; gap:8px;' }, [
        h(NButton, { size: 'small', onClick: () => router.push({ name: 'carelog-detail', params: { id: row.id } }) }, { default: () => '詳細' }),
        h(NButton, { size: 'small', ghost: true, onClick: () => router.push({ name: 'carelog-edit', params: { id: row.id } }) }, { default: () => '編集' }),
      ])
    }
  }
]
</script>

<template>
  <div class="p-4">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
      <h2 style="font-weight:600; font-size:18px; margin:0;">ケアログ一覧</h2>
      <n-space>
        <n-input v-model:value="q" placeholder="キーワード（タイトル/本文）" clearable style="width: 260px" />
        <n-date-picker v-model:value="dateRange" type="daterange" clearable style="width: 260px" />
        <n-select v-model:value="selectedBranch" :options="branchOptions" clearable placeholder="拠点" style="width: 200px" />
        <n-select v-model:value="selectedStaff"  :options="staffOptions"  clearable placeholder="担当" style="width: 200px" />
        <n-select v-model:value="selectedUser"   :options="userOptions"   clearable placeholder="利用者" style="width: 200px" />
      </n-space>
    </div>

    <n-divider style="margin:8px 0 16px;" />

    <n-data-table
      :loading="loading"
      :columns="columns"
      :data="rows"
      :bordered="false"
      :single-line="false"
      size="small"
    />
  </div>
</template>
```

---

## src/views/carelogs/CareLogUpsert.vue

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fromCare } from '@/lib/supabase'
import { TABLE } from '@/lib/contracts'
import {
  NCard, NForm, NFormItem, NInput, NInputNumber, NButton, NDatePicker,
  NSelect, NSpace, NAlert, useMessage
} from 'naive-ui'

type CareLogForm = {
  id?: string
  date: string | null
  user_id: string | null
  staff_id: string | null
  branch_id: string | null
  title: string | null
  content: string | null
}

const route = useRoute()
const router = useRouter()
const message = useMessage()

const id = route.params.id as string | undefined
const isEdit = computed(() => !!id)

const formRef = ref()
const submitting = ref(false)
const form = ref<CareLogForm>({
  date: null,
  user_id: null,
  staff_id: null,
  branch_id: null,
  title: '',
  content: ''
})

// NDatePicker は number(unix ms) を扱うため、string(YYYY-MM-DD) と相互変換
const dateValue = ref<number | null>(null)
function ymdStringToMs (ymd: string | null): number | null {
  if (!ymd) return null
  const ms = Date.parse(ymd + 'T00:00:00Z')
  return Number.isFinite(ms) ? ms : null
}
function msToYmdString (ms: number | null): string | null {
  if (!ms) return null
  const d = new Date(ms)
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// 選択肢
const branchOptions = ref<{ label: string; value: string }[]>([])
const staffOptions  = ref<{ label: string; value: string }[]>([])
const userOptions   = ref<{ label: string; value: string }[]>([])

async function loadOptions () {
  const [branches, staffs, users] = await Promise.all([
    fromCare(TABLE.branches).select('id, name').order('name', { ascending: true }),
    fromCare(TABLE.staffs).select('id, name').order('id', { ascending: true }),
    fromCare(TABLE.users).select('id, name').order('id', { ascending: true })
  ])
  if (!branches.error) branchOptions.value = (branches.data ?? []).map(b => ({ label: (b as any).name, value: (b as any).id }))
  if (!staffs.error)   staffOptions.value  = (staffs.data ?? []).map(s => ({ label: (s as any).name ?? (s as any).id, value: (s as any).id }))
  if (!users.error)    userOptions.value   = (users.data ?? []).map(u => ({ label: (u as any).name ?? (u as any).id, value: (u as any).id }))
}

async function loadExisting () {
  if (!isEdit.value) return
  const { data, error } = await fromCare(TABLE.careLogs)
    .select('id, date, user_id, staff_id, branch_id, title, content')
    .eq('id', id!)
    .single()
  if (error) throw error
  form.value = {
    id: data!.id as string,
    date: (data as any).date ?? null,
    user_id: (data as any).user_id ?? null,
    staff_id: (data as any).staff_id ?? null,
    branch_id: (data as any).branch_id ?? null,
    title: (data as any).title ?? '',
    content: (data as any).content ?? ''
  }
  dateValue.value = ymdStringToMs(form.value.date)
}

onMounted(async () => {
  try {
    await loadOptions()
    await loadExisting()
  } catch (e: any) {
    message.error(e?.message ?? '初期化に失敗しました')
  }
})

const rules = {
  date: { required: true, type: 'string', message: '日付は必須です', trigger: ['blur', 'change'] },
  user_id: { required: true, message: '利用者は必須です', trigger: ['blur', 'change'] },
  staff_id: { required: true, message: '担当は必須です', trigger: ['blur', 'change'] },
  branch_id: { required: true, message: '拠点は必須です', trigger: ['blur', 'change'] },
  title: { required: true, message: 'タイトルは必須です', trigger: ['blur', 'input'] },
  content: { required: true, message: '本文は必須です', trigger: ['blur', 'input'] }
}

async function save () {
  try {
    // dateValue(number) → form.date(YYYY-MM-DD)
    form.value.date = msToYmdString(dateValue.value)

    // Naive UI の NForm を通すため、model は form.value のまま検証
    await formRef.value?.validate()

    submitting.value = true
    const payload = {
      date: form.value.date,
      user_id: form.value.user_id,
      staff_id: form.value.staff_id,
      branch_id: form.value.branch_id,
      title: form.value.title,
      content: form.value.content
    }

    if (isEdit.value) {
      const { error } = await fromCare(TABLE.careLogs)
        .update(payload)
        .eq('id', form.value.id!)
      if (error) throw error
      message.success('更新しました')
    } else {
      const { error } = await fromCare(TABLE.careLogs).insert(payload)
      if (error) throw error
      message.success('追加しました')
    }

    router.push({ name: 'carelog-list' })
  } catch (e: any) {
    console.error(e)
    message.error(e?.message ?? '保存に失敗しました')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl">
    <n-card>
      <div class="flex items-center justify-between mb-2">
        <h1 class="text-lg font-semibold">ケアログ{{ isEdit ? '編集' : '新規作成' }}</h1>
        <n-button tertiary @click="$router.push({ name: 'carelog-list' })">一覧へ</n-button>
      </div>

      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top" size="large">
        <n-space vertical :size="18">
          <n-form-item label="日付" path="date">
            <n-date-picker
              v-model:value="dateValue"
              type="date"
              clearable
              style="width: 220px"
              @update:value="(v:number|null)=>{ dateValue=v; form.date = msToYmdString(v) }"
            />
          </n-form-item>

          <n-form-item label="利用者" path="user_id">
            <n-select
              v-model:value="form.user_id"
              :options="userOptions"
              filterable
              clearable
              placeholder="利用者を選択"
              style="max-width: 360px"
            />
          </n-form-item>

          <n-form-item label="担当" path="staff_id">
            <n-select
              v-model:value="form.staff_id"
              :options="staffOptions"
              filterable
              clearable
              placeholder="担当を選択"
              style="max-width: 360px"
            />
          </n-form-item>

          <n-form-item label="拠点" path="branch_id">
            <n-select
              v-model:value="form.branch_id"
              :options="branchOptions"
              filterable
              clearable
              placeholder="拠点を選択"
              style="max-width: 360px"
            />
          </n-form-item>

          <n-form-item label="タイトル" path="title">
            <n-input
              v-model:value="form.title"
              placeholder="短い見出し"
              clearable
              maxlength="120"
              show-count
            />
          </n-form-item>

          <n-form-item label="本文" path="content">
            <n-input
              v-model:value="form.content"
              type="textarea"
              placeholder="本文を入力"
              :autosize="{ minRows: 6, maxRows: 18 }"
            />
          </n-form-item>

          <div class="flex justify-end gap-2 pt-2">
            <n-button ghost @click="$router.push({ name: 'carelog-list' })">キャンセル</n-button>
            <n-button type="primary" :loading="submitting" @click="save">保存</n-button>
          </div>
        </n-space>
      </n-form>
    </n-card>
  </div>
</template>
```

---

## src/views/LoginView.vue

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()

// const email = ref('')
// const password = ref('')
const email = ref('staff@boiler.xsrv.jp')
const password = ref('btTRJ71TtL3BMVjV7PES')
const err = ref<string | null>(null)

onMounted(async () => {
  if (!auth.session) await auth.refreshSession()
  if (auth.session) {
    router.replace((route.query.redirect as string) || { name: 'care-log-list' })
  }
})

async function onSubmit() {
  err.value = null
  try {
    await auth.signIn(email.value, password.value)
    router.replace((route.query.redirect as string) || { name: 'care-log-list' })
  } catch (e: any) {
    err.value = e?.message || 'ログインに失敗しました'
  }
}
</script>

<template>
  <div class="p-6 max-w-sm mx-auto">
    <h1 class="text-xl font-bold mb-4">ログイン</h1>
    <form @submit.prevent="onSubmit" class="space-y-3">
      <input v-model="email" type="email" placeholder="Email" class="w-full border p-2" />
      <input v-model="password" type="password" placeholder="Password" class="w-full border p-2" />
      <button class="w-full border p-2">Sign in</button>
      <p v-if="err" class="text-red-600 text-sm">{{ err }}</p>
    </form>
  </div>
</template>

```

---

## src/views/staffs/StaffDetail.vue

```vue
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fromCare } from '@/lib/supabase'
import { VIEW, TABLE } from '@/lib/contracts'
import {
  NCard, NButton, NSpace, NDivider, NDescriptions, NDescriptionsItem, NTag, NAlert, useMessage
} from 'naive-ui'

type Staff = {
  id: string
  name: string | null
  role: string | null
}

type Membership = { branch_id: string; branch_name?: string | null }

const route = useRoute()
const router = useRouter()
const message = useMessage()

const id = route.params.id as string
const loading = ref(false)
const staff = ref<Staff | null>(null)
const branches = ref<Membership[]>([])

const notFound = computed(() => !loading.value && !staff.value)

async function fetchStaff () {
  loading.value = true
  try {
    // 基本属性
    const s = await fromCare(TABLE.staffs)
      .select('id, name, role')
      .eq('id', id)
      .single()
    if (s.error) throw s.error
    staff.value = s.data as Staff

    // 所属拠点（ビュー優先 / フォールバックあり）
    const v = await fromCare(VIEW.staffWithBranches)
      .select('branches_json')
      .eq('id', id)
      .maybeSingle()

    if (!v.error && v.data && (v.data as any).branches_json) {
      branches.value = ((v.data as any).branches_json ?? []) as Membership[]
    } else {
      const mem = await fromCare(TABLE.staffBranchMemberships)
        .select('branch_id')
        .eq('staff_id', id)
      const ids = (mem.data ?? []).map((m: any) => m.branch_id)
      if (ids.length) {
        const bs = await fromCare(TABLE.branches).select('id, name').in('id', ids)
        if (!bs.error) {
          const byId = new Map((bs.data ?? []).map((b: any) => [b.id, b.name]))
          branches.value = ids.map(bid => ({ branch_id: bid, branch_name: byId.get(bid) ?? null }))
        }
      }
    }
  } catch (e: any) {
    console.error(e)
    message.error(e?.message ?? 'スタッフの取得に失敗しました')
    staff.value = null
    branches.value = []
  } finally {
    loading.value = false
  }
}

function goList ()  { router.push({ name: 'staff-list' }) }
function goEdit ()  { router.push({ name: 'staff-edit', params: { id } }) }

onMounted(fetchStaff)
</script>

<template>
  <div class="p-4">
    <n-card>
      <div class="flex items-center justify-between mb-2">
        <h1 class="text-lg font-semibold">スタッフ詳細</h1>
        <n-space>
          <n-button tertiary @click="goList">一覧へ</n-button>
          <n-button type="primary" @click="goEdit">編集</n-button>
        </n-space>
      </div>

      <n-divider style="margin:8px 0 16px;" />

      <n-alert v-if="notFound" type="warning" class="mb-3">
        データが見つかりませんでした。
      </n-alert>

      <template v-else>
        <n-descriptions label-placement="left" :column="1" bordered size="small" class="mb-4">
          <n-descriptions-item label="ID">{{ staff?.id }}</n-descriptions-item>
          <n-descriptions-item label="氏名">{{ staff?.name || '—' }}</n-descriptions-item>
          <n-descriptions-item label="役割">{{ staff?.role || '—' }}</n-descriptions-item>
          <n-descriptions-item label="所属拠点">
            <template v-if="branches.length">
              <div style="display:flex; flex-wrap:wrap; gap:6px;">
                <n-tag
                  v-for="b in branches"
                  :key="b.branch_id"
                  size="small"
                  :bordered="false"
                >
                  {{ b.branch_name ?? b.branch_id }}
                </n-tag>
              </div>
            </template>
            <template v-else>未所属</template>
          </n-descriptions-item>
        </n-descriptions>
      </template>
    </n-card>
  </div>
</template>
```

---

## src/views/staffs/StaffList.vue

```vue
<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { fromCare } from '@/lib/supabase'
import { VIEW, ROUTE } from '@/lib/contracts'
import { NDataTable, NButton, NTag, NSpace, NDivider, useMessage } from 'naive-ui'

type StaffRow = {
  id: string
  name: string | null
  role: string | null
  branch_names: string[] | null
  branches_json: Array<{ branch_id: string; branch_name: string }> | null
}

const router = useRouter()
const message = useMessage()

const loading = ref(false)
const rows = ref<StaffRow[]>([])

const fetchRows = async () => {
  loading.value = true
  const { data, error } = await fromCare(VIEW.staffWithBranches)
    .select('id, name, role, branch_names, branches_json')
    .order('id', { ascending: true })

  loading.value = false
  if (error) {
    message.error(`スタッフ一覧の取得に失敗しました：${error.message}`)
    return
  }
  rows.value = (data ?? []) as StaffRow[]
}

onMounted(fetchRows)

const goDetail = (id: string) => router.push({ name: ROUTE.staff.detail, params: { id } })
const goEdit = (id: string) => router.push({ name: ROUTE.staff.edit, params: { id } })
const goNew = () => router.push({ name: ROUTE.staff.new })

const columns = [
  { title: 'ID', key: 'id', width: 280 },
  { title: '氏名', key: 'name', width: 180 },
  { title: '役割', key: 'role', width: 140 },
  {
    title: '所属拠点',
    key: 'branch_names',
    render (row: StaffRow) {
      const names = Array.isArray(row.branch_names) ? row.branch_names : []
      if (!names.length) return h('span', { style: 'opacity:.6' }, '未所属')
      return h('div', { style: 'display:flex; flex-wrap:wrap; gap:6px;' },
        names.map(n => h(NTag, { size: 'small', bordered: false }, { default: () => n }))
      )
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 220,
    render (row: StaffRow) {
      return h('div', { style: 'display:flex; gap:8px;' }, [
        h(NButton, { size: 'small', onClick: () => goDetail(row.id) }, { default: () => '詳細' }),
        h(NButton, { size: 'small', ghost: true, onClick: () => goEdit(row.id) }, { default: () => '編集' })
      ])
    }
  }
]
</script>

<template>
  <div class="p-4">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
      <h2 style="font-weight:600; font-size:18px; margin:0;">スタッフ一覧</h2>
      <n-space>
        <n-button tertiary :loading="loading" @click="fetchRows">再読み込み</n-button>
        <n-button type="primary" @click="goNew">新規追加</n-button>
      </n-space>
    </div>

    <n-divider style="margin:8px 0 16px;" />

    <n-data-table
      :loading="loading"
      :columns="columns"
      :data="rows"
      :bordered="false"
      :single-line="false"
      size="small"
    />
  </div>
</template>
```

---

## src/views/staffs/StaffUpsert.vue

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fromCare } from '@/lib/supabase'
import { TABLE } from '@/lib/contracts'
import {
  NCard, NForm, NFormItem, NInput, NButton, NSelect, NSpace, NAlert, useMessage
} from 'naive-ui'

type StaffForm = {
  id?: string
  name: string | null
  role: string | null
  // 多拠点対応：中間テーブル care.staff_branch_memberships
  branch_ids: string[]
}

const route = useRoute()
const router = useRouter()
const message = useMessage()

const id = route.params.id as string | undefined
const isEdit = computed(() => !!id)

const formRef = ref()
const submitting = ref(false)
const form = ref<StaffForm>({
  name: '',
  role: 'staff',
  branch_ids: []
})

const roleOptions = [
  { label: 'スタッフ', value: 'staff' },
  { label: '管理者', value: 'manager' },
  { label: '統括（admin）', value: 'admin' }
]

// branches の選択肢
const branchOptions = ref<{ label: string; value: string }[]>([])

async function loadBranches () {
  const { data, error } = await fromCare(TABLE.branches)
    .select('id, name')
    .order('name', { ascending: true })
  if (error) throw error
  branchOptions.value = (data ?? []).map(b => ({
    label: (b as any).name ?? (b as any).id,
    value: (b as any).id
  }))
}

async function loadStaff () {
  if (!isEdit.value) return
  // 1) 本人
  const [s, m] = await Promise.all([
    fromCare(TABLE.staffs)
      .select('id, name, role')
      .eq('id', id!)
      .single(),
    fromCare(TABLE.staffBranchMemberships)
      .select('branch_id')
      .eq('staff_id', id!)
  ])
  if (s.error) throw s.error
  form.value = {
    id: s.data!.id as string,
    name: (s.data as any).name ?? '',
    role: (s.data as any).role ?? 'staff',
    branch_ids: (m.data ?? []).map(x => (x as any).branch_id)
  }
}

const rules = {
  name:  { required: true, message: '氏名は必須です', trigger: ['blur', 'input'] },
  role:  { required: true, message: '役割は必須です', trigger: ['blur', 'change'] }
}

async function save () {
  try {
    await formRef.value?.validate()
    submitting.value = true

    // --- staffs を upsert ---
    const payload = { name: form.value.name, role: form.value.role }
    let staffId = form.value.id

    if (isEdit.value) {
      const { error } = await fromCare(TABLE.staffs)
        .update(payload)
        .eq('id', staffId!)
      if (error) throw error
    } else {
      const { data, error } = await fromCare(TABLE.staffs)
        .insert(payload)
        .select('id')
        .single()
      if (error) throw error
      staffId = (data as any).id
    }

    // --- memberships を同期（全削除→選択分を挿入） ---
    // ※ トランザクションは使えないため、順次で実施（必要ならDB側にRPC用意）
    await fromCare(TABLE.staffBranchMemberships)
      .delete()
      .eq('staff_id', staffId!)

    if (form.value.branch_ids.length) {
      const rows = form.value.branch_ids.map(bid => ({ staff_id: staffId!, branch_id: bid }))
      const { error: mErr } = await fromCare(TABLE.staffBranchMemberships).insert(rows)
      if (mErr) throw mErr
    }

    message.success(isEdit.value ? '更新しました' : '追加しました')
    router.push({ name: 'staff-list' })
  } catch (e: any) {
    console.error(e)
    message.error(e?.message ?? '保存に失敗しました')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    await loadBranches()
    await loadStaff()
  } catch (e: any) {
    console.error(e)
    message.error(e?.message ?? '初期化に失敗しました')
  }
})
</script>

<template>
  <div class="max-w-3xl">
    <n-card>
      <div class="flex items-center justify-between mb-2">
        <h1 class="text-lg font-semibold">スタッフ{{ isEdit ? '編集' : '新規作成' }}</h1>
        <n-button tertiary @click="$router.push({ name: 'staff-list' })">一覧へ</n-button>
      </div>

      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top" size="large">
        <n-space vertical :size="18">
          <n-form-item label="氏名" path="name">
            <n-input v-model:value="form.name" placeholder="例）山田 太郎" clearable />
          </n-form-item>

          <n-form-item label="役割" path="role">
            <n-select
              v-model:value="form.role"
              :options="roleOptions"
              style="max-width: 260px"
            />
          </n-form-item>

          <n-form-item label="所属拠点（複数可）">
            <n-select
              v-model:value="form.branch_ids"
              :options="branchOptions"
              multiple
              clearable
              filterable
              placeholder="拠点を選択"
              style="max-width: 520px"
            />
          </n-form-item>

          <div class="flex justify-end gap-2 pt-2">
            <n-button ghost @click="$router.push({ name: 'staff-list' })">キャンセル</n-button>
            <n-button type="primary" :loading="submitting" @click="save">保存</n-button>
          </div>
        </n-space>
      </n-form>
    </n-card>
  </div>
</template>
```

---

## src/views/users/UserDetail.vue

```vue
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fromCare } from '@/lib/supabase'
import { TABLE } from '@/lib/contracts'
import {
  NCard, NSpace, NButton, NDivider, NDescriptions, NDescriptionsItem, NAlert, useMessage
} from 'naive-ui'

type AnyRecord = Record<string, any>

const route = useRoute()
const router = useRouter()
const message = useMessage()

const id = route.params.id as string
const loading = ref(false)
const item = ref<AnyRecord | null>(null)

const notFound = computed(() => !loading.value && !item.value)

// SoT 想定の主要カラム（存在するものだけ表示）
const primaryKeys = ['id', 'name', 'kana', 'birthday', 'sex', 'branch_id', 'created_at', 'updated_at']

function fmt(val: any) {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'object') return JSON.stringify(val, null, 2)
  return String(val)
}

// 主要カラム用の表示行を computed で作成（{ key, label, value }[]）
const primaryRows = computed(() => {
  if (!item.value) return [] as Array<{ key: string; label: string; value: any }>
  const rows: Array<{ key: string; label: string; value: any }> = []
  for (const k of primaryKeys) {
    if (Object.prototype.hasOwnProperty.call(item.value, k)) {
      rows.push({ key: k, label: k, value: item.value[k] })
    }
  }
  return rows
})

// その他カラム（主要以外）をまとめて表示
const otherRows = computed(() => {
  if (!item.value) return [] as Array<{ key: string; label: string; value: any }>
  const prim = new Set(primaryKeys)
  return Object.entries(item.value)
    .filter(([k]) => !prim.has(k))
    .map(([k, v]) => ({ key: k, label: k, value: v }))
})

async function fetchOne () {
  loading.value = true
  try {
    const { data, error } = await fromCare(TABLE.users)
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    item.value = data as AnyRecord
  } catch (e: any) {
    console.error(e)
    message.error(e?.message ?? '利用者の取得に失敗しました')
    item.value = null
  } finally {
    loading.value = false
  }
}

function goList () { router.push({ name: 'user-list' }) }
function goEdit () { router.push({ name: 'user-edit', params: { id } }) }

onMounted(fetchOne)
</script>

<template>
  <div class="p-4">
    <n-card>
      <div class="flex items-center justify-between mb-2">
        <h1 class="text-lg font-semibold">利用者 詳細</h1>
        <n-space>
          <n-button tertiary @click="goList">一覧へ</n-button>
          <n-button type="primary" @click="goEdit">編集</n-button>
        </n-space>
      </div>

      <n-divider style="margin:8px 0 16px;" />

      <n-alert v-if="notFound" type="warning" class="mb-3">
        データが見つかりませんでした。
      </n-alert>

      <template v-else>
        <!-- 上段：主要カラム -->
        <n-descriptions
          v-if="primaryRows.length"
          label-placement="left"
          :column="1"
          bordered
          size="small"
          class="mb-4"
        >
          <n-descriptions-item
            v-for="row in primaryRows"
            :key="`primary:${row.key}`"
            :label="row.label"
          >
            <div v-if="typeof row.value === 'object'" style="white-space:pre-wrap">{{ fmt(row.value) }}</div>
            <template v-else>{{ fmt(row.value) }}</template>
          </n-descriptions-item>
        </n-descriptions>

        <!-- 下段：その他カラム -->
        <n-descriptions
          v-if="otherRows.length"
          label-placement="left"
          :column="1"
          bordered
          size="small"
        >
          <n-descriptions-item
            v-for="row in otherRows"
            :key="`other:${row.key}`"
            :label="row.label"
          >
            <div v-if="typeof row.value === 'object'" style="white-space:pre-wrap">{{ fmt(row.value) }}</div>
            <template v-else>{{ fmt(row.value) }}</template>
          </n-descriptions-item>
        </n-descriptions>
      </template>
    </n-card>
  </div>
</template>
```

---

## src/views/users/UserList.vue

```vue
<template>
  <div class="space-y-4">
    <!-- ヘッダー -->
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">ユーザー一覧</h1>
      <n-button type="primary" @click="router.push({ name: ROUTE.user.new })">新規追加</n-button>
    </div>

    <!-- 検索ボックス -->
    <div class="max-w-md">
      <n-input v-model:value="q" placeholder="氏名で検索" clearable />
    </div>

    <!-- ローディング中のスケルトン -->
    <div v-if="loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <n-card v-for="i in 6" :key="i" embedded>
        <n-skeleton text :repeat="1" />
        <div class="mt-2"><n-skeleton text :repeat="2" /></div>
        <div class="mt-4 flex gap-2">
          <n-skeleton text style="width: 64px" />
          <n-skeleton text style="width: 64px" />
          <n-skeleton text style="width: 64px" />
        </div>
      </n-card>
    </div>

    <!-- カードグリッド -->
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <n-card
        v-for="u in filtered"
        :key="u.id"
        hoverable
        class="transition-shadow duration-200 hover:shadow-lg cursor-pointer"
        role="button"
        tabindex="0"
        @click="goDetail(u.id)"
        @keydown.enter.prevent="goDetail(u.id)"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <!-- アバター（名前頭文字） -->
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold">
              {{ initials(u.name) }}
            </div>
            <div>
              <div class="text-base font-medium">{{ u.name || '（無名）' }}</div>
              <div class="mt-1 text-xs text-gray-400">ID: {{ u.id }}</div>
            </div>
          </div>
        </div>

        <!-- 所属拠点 -->
        <div class="mt-3 flex flex-wrap gap-1">
          <n-tag v-for="b in u.branches" :key="b" size="small" round>{{ b }}</n-tag>
          <n-tag v-if="u.branches.length === 0" size="small" round type="default">（未所属）</n-tag>
        </div>

        <!-- 操作ボタン（カードクリックを止める） -->
        <div class="mt-4 flex gap-2">
          <n-button size="small" @click.stop="router.push({ name: ROUTE.user.detail, params: { id: u.id } })">
            詳細
          </n-button>
          <n-button size="small" tertiary @click.stop="router.push({ name: ROUTE.user.edit, params: { id: u.id } })">
            編集
          </n-button>
          <n-button size="small" tertiary type="error" @click.stop="confirmRemove(u)">
            削除
          </n-button>
        </div>
      </n-card>
    </div>

    <!-- データなし -->
    <n-empty v-if="!loading && filtered.length === 0" description="該当するユーザーがいません" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { NButton, NCard, NTag, NInput, NEmpty, NSkeleton, useDialog, useMessage } from 'naive-ui'
import { supabase } from '@/lib/supabase'
import { SCHEMA, VIEW, TABLE, ROUTE } from '@/lib/contracts'

const router = useRouter()
const auth = useAuthStore()

type UserRow = { id: string | number; name: string }
type UserView = UserRow & { branches: string[] }

const dialog = useDialog()
const message = useMessage()

const q = ref('')
const loading = ref(true)
const users = ref<UserView[]>([])

const care = () => supabase.schema(SCHEMA.care)

async function load() {
  loading.value = true
  try {
    let query = care()
      .from(VIEW.userWithBranches)
      .select('id,name,branch_names,company_id')
      .order('id', { ascending: true })
      .limit(200)

    if (auth.activeCompanyId) query = query.eq('company_id', auth.activeCompanyId)

    const { data, error } = await query
    if (error) throw error

    users.value = (data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      branches: Array.isArray(row.branch_names) ? row.branch_names : []
    }))
  } catch (e: any) {
    console.error('Supabase error:', e)
    message.error(e?.message ?? 'ユーザー取得に失敗しました')
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => auth.activeCompanyId, () => load(), { immediate: false })

const filtered = computed(() => {
  const s = q.value.trim().toLowerCase()
  if (!s) return users.value
  return users.value.filter(u => (u.name ?? '').toLowerCase().includes(s))
})

function initials(name?: string) {
  if (!name) return '—'
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 1)
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

async function doDelete(id: string | number) {
  const { error } = await care().from(TABLE.users).delete().eq('id', id)
  if (error) throw error
  users.value = users.value.filter(x => x.id !== id)
}

function confirmRemove(u: UserView) {
  dialog.warning({
    title: '削除の確認',
    content: `「${u.name}」を削除します。よろしいですか？`,
    positiveText: '削除',
    negativeText: 'キャンセル',
    onPositiveClick: async () => {
      try {
        await doDelete(u.id)
        message.success('削除しました')
      } catch (e: any) {
        console.error(e)
        message.error(e?.message ?? '削除に失敗しました')
      }
    }
  })
}

function goDetail(id: string | number) {
  router.push({ name: ROUTE.user.detail, params: { id } })
}
</script>
```

---

## src/views/users/UserUpsert.vue

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fromCare } from '@/lib/supabase'
import { TABLE } from '@/lib/contracts'
import {
  NCard, NForm, NFormItem, NInput, NSelect, NButton, NDatePicker, NSpace, useMessage
} from 'naive-ui'

type UserForm = {
  id?: string
  name: string | null
  kana: string | null
  sex: string | null
  birthday: string | null   // YYYY-MM-DD
}

const route = useRoute()
const router = useRouter()
const message = useMessage()

const id = route.params.id as string | undefined
const isEdit = computed(() => !!id)

const formRef = ref()
const submitting = ref(false)
const form = ref<UserForm>({
  name: '',
  kana: '',
  sex: null,
  birthday: null
})

// 拠点セレクト（単一）— M2MだがUIは1件運用
const branchOptions = ref<{ label: string; value: string }[]>([])
const selectedBranchId = ref<string | null>(null)

const sexOptions = [
  { label: '男性', value: 'male' },
  { label: '女性', value: 'female' },
  { label: 'その他', value: 'other' },
  { label: '未設定', value: null as any }
]

// NDatePicker は number(ms)
const birthdayMs = ref<number | null>(null)
function ymdToMs (ymd: string | null): number | null {
  if (!ymd) return null
  const ms = Date.parse(ymd + 'T00:00:00Z'); return Number.isFinite(ms) ? ms : null
}
function msToYmd (ms: number | null): string | null {
  if (!ms) return null
  const d = new Date(ms)
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const rules = {
  name: { required: true, message: '氏名は必須です', trigger: ['blur', 'input'] },
  kana: { required: false, trigger: ['blur', 'input'] },
  sex:  { required: false, trigger: ['blur', 'change'] },
  birthday: { required: false, trigger: ['blur', 'change'] },
  // 拠点は運用上は必須だが、DB上はM2Mなので画面で必須化するかは任意
}

async function loadBranches () {
  const { data, error } = await fromCare(TABLE.branches)
    .select('id, name')
    .order('name', { ascending: true })
  if (error) throw error
  branchOptions.value = (data ?? []).map(b => ({
    label: (b as any).name ?? (b as any).id,
    value: (b as any).id
  }))
}

async function loadUser () {
  if (!isEdit.value) return
  // 本体
  const u = await fromCare(TABLE.users)
    .select('id, name, kana, sex, birthday')
    .eq('id', id!)
    .single()
  if (u.error) throw u.error

  form.value = {
    id: (u.data as any).id,
    name: (u.data as any).name ?? '',
    kana: (u.data as any).kana ?? '',
    sex: (u.data as any).sex ?? null,
    birthday: (u.data as any).birthday ?? null
  }
  birthdayMs.value = ymdToMs(form.value.birthday)

  // 現 membership（単一運用）
  const m = await fromCare(TABLE.userBranchMemberships)
    .select('branch_id')
    .eq('user_id', id!)
  if (!m.error && (m.data ?? []).length) {
    selectedBranchId.value = (m.data as any[])[0].branch_id ?? null
  }
}

async function save () {
  try {
    form.value.birthday = msToYmd(birthdayMs.value)
    await formRef.value?.validate()
    submitting.value = true

    const payload = {
      name: form.value.name,
      kana: form.value.kana,
      sex: form.value.sex,
      birthday: form.value.birthday
    }

    let userId = form.value.id as string | undefined

    if (isEdit.value) {
      const r = await fromCare(TABLE.users).update(payload).eq('id', userId!)
      if (r.error) throw r.error
    } else {
      const r = await fromCare(TABLE.users).insert(payload).select('id').single()
      if (r.error) throw r.error
      userId = (r.data as any).id
    }

    // Membership を置き換え（単一運用：全削除→必要なら1件INSERT）
    if (userId) {
      const del = await fromCare(TABLE.userBranchMemberships)
        .delete()
        .eq('user_id', userId)
      if (del.error) throw del.error

      if (selectedBranchId.value) {
        const ins = await fromCare(TABLE.userBranchMemberships)
          .insert({ user_id: userId, branch_id: selectedBranchId.value })
        if (ins.error) throw ins.error
      }
    }

    message.success(isEdit.value ? '更新しました' : '追加しました')
    router.push({ name: 'user-list' })
  } catch (e: any) {
    console.error(e)
    message.error(e?.message ?? '保存に失敗しました')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    await loadBranches()
    await loadUser()
  } catch (e: any) {
    console.error(e)
    message.error(e?.message ?? '初期化に失敗しました')
  }
})
</script>

<template>
  <div class="max-w-3xl">
    <n-card>
      <div class="flex items-center justify-between mb-2">
        <h1 class="text-lg font-semibold">利用者{{ isEdit ? '編集' : '新規作成' }}</h1>
        <n-button tertiary @click="$router.push({ name: 'user-list' })">一覧へ</n-button>
      </div>

      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top" size="large">
        <n-space vertical :size="18">
          <n-form-item label="氏名" path="name">
            <n-input v-model:value="form.name" placeholder="例）田中 花子" clearable />
          </n-form-item>

          <n-form-item label="氏名（カナ）" path="kana">
            <n-input v-model:value="form.kana" placeholder="例）タナカ ハナコ" clearable />
          </n-form-item>

          <n-form-item label="性別" path="sex">
            <n-select
              v-model:value="form.sex"
              :options="sexOptions"
              clearable
              placeholder="性別を選択"
              style="max-width: 260px"
            />
          </n-form-item>

          <n-form-item label="生年月日" path="birthday">
            <n-date-picker
              v-model:value="birthdayMs"
              type="date"
              clearable
              style="width: 220px"
              @update:value="(v:number|null)=>{ birthdayMs=v; form.birthday = msToYmd(v) }"
            />
          </n-form-item>

          <!-- 拠点（M2MだがUIは単一選択） -->
          <n-form-item label="所属拠点（単一）">
            <n-select
              v-model:value="selectedBranchId"
              :options="branchOptions"
              clearable
              filterable
              placeholder="拠点を選択"
              style="max-width: 360px"
            />
          </n-form-item>

          <div class="flex justify-end gap-2 pt-2">
            <n-button ghost @click="$router.push({ name: 'user-list' })">キャンセル</n-button>
            <n-button type="primary" :loading="submitting" @click="save">保存</n-button>
          </div>
        </n-space>
      </n-form>
    </n-card>
  </div>
</template>
```

---

## src/vite-env.d.ts

```ts
/// <reference types="vite/client" />

```
