# CARELOG Bundle Summary (nightly full)

## src/App.vue

```vue
<!-- src/App.vue -->
<template>
  <!-- Naive UI providers（テンプレは kebab-case！） -->
  <n-config-provider>
    <n-dialog-provider>
      <n-message-provider>
        <div class="app-root">
          <!-- ログインページではヘッダー非表示 -->
          <AppHeader v-if="!isLogin" class="app-header" />

          <!-- 画面全体のラッパ：ログイン時は中央寄せ、通常時は余白つきコンテナ -->
          <main :class="isLogin ? 'center' : 'page-container'">
            <router-view />
          </main>
        </div>
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'

const route = useRoute()
// /login（名前 or パス）判定。将来 /login/callback 等にも耐性を持たせるなら startsWith を併用
const isLogin = computed(() => route.name === 'login' || String(route.path).startsWith('/login'))
</script>

<style scoped>
/* 全ページ共通の背景＆最小高さ */
.app-root {
  min-height: 100vh;
  background: #f7f7f8; /* 薄いグレーで窮屈感を軽減 */
}

/* 通常ページ用のコンテナ：中央寄せ & 余白 */
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

/* ログインページ用：カード等を中央に置きやすいキャンバス */
.center {
  min-height: 100vh;           /* ヘッダー非表示なので全高でOK */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;               /* スマホでの端詰まり防止 */
}
</style>```

## src/components/AppHeader.vue

```vue
<!-- src/components/AppHeader.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { NButton } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

// ユーザ情報はストアから読む
const userEmail = computed(() => auth.session?.user?.email ?? '未ログイン')

// ログアウト処理はストアに任せる
async function onLogout() {
  await auth.logout()   // ← auth.ts 側に logout 実装
  if (router.currentRoute.value.name !== 'login') {
    router.push({ name: 'login' }).catch(() => {})
  }
}
</script>

<template>
  <header class="flex items-center justify-between px-4 py-3 border-b bg-white">
    <div class="flex items-center gap-3">
      <strong class="text-lg">CareLog</strong>
    </div>
    <div class="flex items-center gap-3">
      <span class="text-sm text-gray-500">{{ userEmail }}</span>
      <NButton size="small" @click="onLogout">ログアウト</NButton>
    </div>
  </header>
</template>```

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
export type ViewKey  = keyof typeof VIEW```

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
}```

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
}```

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
}```

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
}```

## src/lib/supabase.ts

```ts
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error('[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

// --- 互換レイヤ（移行完了までの暫定措置） -------------------------
// 以前の `fromCare('table')` をそのまま動かすための薄いラッパ。
// 置換作業が一巡したら、下記2行は削除して問題ありません。
export const fromCare = (table: string) => supabase.from(table)
// --------------------------------------------------------------```

## src/main.ts

```ts
// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

// ★ Naive UI: 使うものだけ個別 import → create() でプラグイン化
import { create, NConfigProvider, NDialogProvider, NMessageProvider,
  NForm, NFormItem, NInput, NButton, NCard } from 'naive-ui'

// 必要なコンポーネントだけ登録（足りなければ随時追加）
const naive = create({
  components: [
    NConfigProvider,
    NDialogProvider,
    NMessageProvider,
    NForm,
    NFormItem,
    NInput,
    NButton,
    NCard
  ]
})

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)
  app.use(router)
  app.use(naive) // ← ここが重要（providers や NInput/NButton などが解決される）

  // --- Auth 初期化（v2 仕様）--------------------------
  const auth = useAuthStore()

  // セッション取得 → store 反映
  {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) console.error('[init auth] getSession error:', error)
    auth.setSession(session ?? null)
  }

  // 変化監視
  supabase.auth.onAuthStateChange((event, session) => {
    auth.setSession(session ?? null)
    if (event === 'SIGNED_OUT' && router.currentRoute.value.name !== 'login') {
      router.push({ name: 'login' }).catch(() => {})
    }
  })
  // ----------------------------------------------------

  await router.isReady()
  app.mount('#app')
}

bootstrap().catch((e) => {
  console.error('[bootstrap] unhandled error:', e)
})```

## src/router/index.ts

```ts
import { supabase } from '@/lib/supabase'
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
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

// ★ 新規：carelogs
const CareLogListNew   = () => import('@/views/carelogs/CareLogList.vue')
const CareLogDetailNew = () => import('@/views/carelogs/CareLogDetail.vue')
const CareLogUpsertNew = () => import('@/views/carelogs/CareLogUpsert.vue')

const routes = [
  {
    path: '/login',
    name: 'login',
    meta: { public: true, hideHeader: true }, // ← 追加
    component: () => import('@/views/LoginView.vue')
  },

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

  // CareLogs（★追加）
  { path: '/carelogs',        name: 'carelog-list',   component: CareLogListNew },
  { path: '/carelogs/new',    name: 'carelog-new',    component: CareLogUpsertNew },
  { path: '/carelogs/:id',    name: 'carelog-detail', component: CareLogDetailNew },
  { path: '/carelogs/:id/edit', name: 'carelog-edit', component: CareLogUpsertNew },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to: RouteLocationNormalized, _from, next: NavigationGuardNext) => {
  const { data: { session } } = await supabase.auth.getSession()

  // --- 1. ログイン必須（public だけ例外）
  const isPublic = !!to.meta.public
  if (!isPublic && !session) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  // --- 2. 管理者チェック（requiresAdmin）
  if (to.meta.requiresAdmin) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return next({ name: 'login' })

    const { data: staff, error } = await supabase
      .from('staffs')
      .select('role')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('[router] staff fetch error:', error)
      return next(false) // エラー時は遷移中断
    }
    if (!staff || !['admin', 'manager'].includes(staff.role)) {
      return next({ name: 'care-log-list' }) // 権限不足はトップへ
    }
  }

  next()
})

export default router```

## src/stores/auth.ts

```ts
// src/stores/auth.ts
import { defineStore } from 'pinia'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type StaffRow = {
  id: string
  name: string | null
  email: string | null
  role: 'admin' | 'manager' | 'staff' | null
  auth_user_id: string | null
}

type State = {
  user: User | null
  staff: StaffRow | null
  initialized: boolean
  loading: boolean
  error: string | null
  session: Session | null
}

export const useAuthStore = defineStore('auth', {
  state: (): State => ({
    user: null,
    staff: null,
    initialized: false,
    loading: false,
    error: null,
    session: null
  }),

  getters: {
    isLoggedIn: (s) => !!s.user,
    role: (s) => s.staff?.role ?? null,
    staffId: (s) => s.staff?.id ?? null,
  },

  actions: {
    /**
     * main.ts 側の onAuthStateChange / getSession に合わせた受け皿。
     */
    async setSession(session: Session | null) {
      this.loading = true
      this.error = null
      try {
        const user = session?.user ?? null
        this.user = user
        this.session = session ?? null

        if (!user) {
          this.staff = null
          this.initialized = true
          return
        }

        const { data: staff, error: stErr } = await supabase
          .from('staffs') // public に一本化
          .select('id, name, email, role, auth_user_id')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        if (stErr) {
          console.error('[auth.setSession] fetch staff error:', stErr)
          this.staff = null
        } else {
          this.staff = (staff ?? null) as StaffRow
        }
      } catch (e: any) {
        this.error = e?.message ?? String(e)
        console.error('[auth.setSession] unexpected error:', e)
      } finally {
        this.loading = false
        this.initialized = true
      }
    },

    /**
     * ログイン
     * - supabase.auth.signInWithPassword を実行
     * - 成功時に setSession を呼び出し
     */
    async signIn(email: string, password: string) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        await this.setSession(data.session)
        return data.session
      } catch (e: any) {
        this.error = e?.message ?? String(e)
        console.error('[auth.signIn] error:', e)
        throw e
      } finally {
        this.loading = false
      }
    },

    /**
     * サインアウト
     */
    async logout() {
      this.loading = true
      this.error = null
      try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        this.user = null
        this.staff = null
        this.session = null
      } catch (e: any) {
        this.error = e?.message ?? String(e)
        console.error('[auth.signOut] error:', e)
        throw e
      } finally {
        this.loading = false
      }
    },

    /**
     * ローカル state のみをクリア
     */
    logoutLocal() {
      this.user = null
      this.staff = null
      this.session = null
      this.error = null
      this.initialized = true
    },

    /**
     * 現在セッションから初期化
     */
    async initFromCurrentSession() {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.error('[auth.initFromCurrentSession] getSession error:', error)
        }
        await this.setSession(data?.session ?? null)
      } catch (e) {
        console.error('[auth.initFromCurrentSession] unexpected error:', e)
      }
    },
  },
})```

## src/types/branch.ts

```ts
export type Branch = {
  id: string
  name: string
  address?: string | null
  phone?: string | null
}```

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
}```

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
}```

## src/views/CareLogList.vue

```vue
<script setup lang="ts">
import CareLogList from '@/views/carelogs/CareLogList.vue'
</script>

<template>
  <CareLogList />
</template>```

## src/views/LoginView.vue

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage, NForm, NFormItem, NInput, NButton, NCard } from 'naive-ui'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const auth = useAuthStore()

const email = ref('manager@boiler.xsrv.jp')
const password = ref('ui9JkDkMbfQBzl6F39Jb')
const loading = ref(false)
const showPassword = ref(false)

const redirect = (route.query.redirect as string) || '/'

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    await auth.setSession(session).catch(() => {})
    router.replace(redirect).catch(() => {})
  }
})

async function onSubmit() {
  if (!email.value || !password.value) {
    message.warning('メールアドレスとパスワードを入力してください')
    return
  }

  loading.value = true
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value,
    })
    if (error) throw error

    await auth.setSession(data.session ?? null).catch(() => {})

    message.success('サインインしました')
    router.replace(redirect).catch(() => {})
  } catch (e: any) {
    console.error('[login] signInWithPassword error:', e)
    message.error(e?.message ?? 'サインインに失敗しました')
  } finally {
    loading.value = false
  }
}
</script>

<!-- src/views/LoginView.vue -->
<template>
  <div id="logindialog">
    <n-card style="width: 360px" title="CareLog ログイン" size="medium" bordered>
      <n-form @submit.prevent="onSubmit" label-placement="top">
        <n-form-item label="メールアドレス">
          <n-input v-model:value="email" placeholder="you@example.com" :input-props="{ autocomplete: 'username' }" />
        </n-form-item>
        <n-form-item label="パスワード">
          <n-input v-model:value="password" :type="showPassword ? 'text' : 'password'" placeholder="********"
                   :input-props="{ autocomplete: 'current-password' }">
            <template #suffix>
              <n-button text @click="showPassword = !showPassword">{{ showPassword ? '隠す' : '表示' }}</n-button>
            </template>
          </n-input>
        </n-form-item>
        <n-button type="primary" :loading="loading" block class="mt-2" @click="onSubmit">サインイン</n-button>
      </n-form>
    </n-card>
  </div>
</template>

<style scoped>
#logindialog {
  display: flex;
  justify-content: center;
  align-items: start;
  height: 100vh;
  background-color: #f0f2f5;
}
#logindialog > * {
  position: relative;
  top: 15vh;
}
</style>
```

## src/views/branches/BranchDetail.vue

```vue
<template>
  <div class="p-4">
    <n-card title="拠点詳細">
      <template #header-extra>
        <n-space>
          <n-button @click="goList">一覧へ</n-button>
          <n-button type="primary" @click="goEdit" :disabled="!branch?.id">編集</n-button>
          <n-popconfirm @positive-click="onDelete" :negative-text="'キャンセル'" :positive-text="'削除'">
            <template #trigger>
              <n-button type="error" :disabled="!branch?.id">削除</n-button>
            </template>
            本当に削除しますか？
          </n-popconfirm>
        </n-space>
      </template>

      <n-descriptions label-placement="left" :column="1" bordered>
        <n-descriptions-item label="ID">
          <code>{{ branch?.id }}</code>
        </n-descriptions-item>
        <n-descriptions-item label="拠点名">
          {{ branch?.name || '—' }}
        </n-descriptions-item>
        <n-descriptions-item label="作成日時">
          {{ formatTs(branch?.created_at) }}
        </n-descriptions-item>
        <n-descriptions-item label="更新日時">
          {{ formatTs(branch?.updated_at) }}
        </n-descriptions-item>
      </n-descriptions>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { supabase } from '@/lib/supabase'

type Branch = {
  id: string
  name: string | null
  created_at?: string | null
  updated_at?: string | null
}

const route = useRoute()
const router = useRouter()
const message = useMessage()

const branchId = route.params.id as string
const branch = ref<Branch | null>(null)

function formatTs(ts?: string | null) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ts
  }
}

async function load() {
  try {
    const { data, error } = await supabase
      .from('branches')
      .select('id, name, created_at, updated_at')
      .eq('id', branchId)
      .single()

    if (error) throw error
    branch.value = data as Branch
  } catch (e: any) {
    console.error('load branch error:', e)
    message.error(e?.message ?? '読み込みに失敗しました')
  }
}

function goList() {
  router.push({ name: 'branch-list' })
}
function goEdit() {
  router.push({ name: 'branch-edit', params: { id: branchId } })
}

async function onDelete() {
  try {
    const { error } = await supabase.from('branches').delete().eq('id', branchId)
    if (error) throw error
    message.success('削除しました')
    goList()
  } catch (e: any) {
    console.error('delete branch error:', e)
    message.error(e?.message ?? '削除に失敗しました')
  }
}

onMounted(load)
</script>

<style scoped>
.p-4 { padding: 1rem; }
</style>
```

## src/views/branches/BranchList.vue

```vue
<template>
  <div>
    <n-space justify="space-between" align="center" class="mb-4">
      <h2 class="text-xl font-bold">拠点一覧</h2>
      <n-button type="primary" @click="goNew">新規追加</n-button>
    </n-space>

    <n-data-table
      :columns="columns"
      :data="branches"
      :loading="loading"
      :pagination="pagination"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NButton } from 'naive-ui'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const branches = ref<any[]>([])
const loading = ref(false)
const pagination = { pageSize: 10 }

const goNew = () => router.push({ name: 'branch-new' })

const columns = [
  { title: 'ID', key: 'id', width: 250 },
  { title: '拠点名', key: 'name' },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render (row: any) {
      return h('div', {}, [
        h(
          NButton,
          {
            size: 'small',
            onClick: () => router.push({ name: 'branch-detail', params: { id: row.id } }),
            style: 'margin-right: 8px'
          },
          { default: () => '詳細' }
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            onClick: () => router.push({ name: 'branch-edit', params: { id: row.id } })
          },
          { default: () => '編集' }
        )
      ])
    }
  }
]

const fetchBranches = async () => {
  loading.value = true
  const { data, error } = await supabase.from('branches').select('id, name')
  if (error) {
    console.error('fetchBranches error:', error)
  } else {
    branches.value = data || []
  }
  loading.value = false
}

onMounted(fetchBranches)
</script>```

## src/views/branches/BranchUpsert.vue

```vue
<template>
  <div>
    <h2 class="text-xl font-bold mb-4">
      {{ isEdit ? '拠点を編集' : '拠点を追加' }}
    </h2>

    <n-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-placement="top"
      require-mark-placement="right-hanging"
    >
      <n-form-item label="拠点名" path="name">
        <n-input v-model:value="form.name" placeholder="例）カモミールハウス松本" clearable />
      </n-form-item>

      <n-space justify="end">
        <n-button ghost @click="goList">キャンセル</n-button>
        <n-button type="primary" :loading="submitting" @click="save">
          保存
        </n-button>
      </n-space>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useMessage } from 'naive-ui'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const formRef = ref()
const form = ref<{ id?: string; name: string }>({ name: '' })
const submitting = ref(false)
const isEdit = computed(() => !!route.params.id)

const rules = {
  name: { required: true, message: '拠点名は必須です', trigger: 'blur' }
}

const goList = () => router.push({ name: 'branch-list' })

const fetchBranch = async (id: string) => {
  const { data, error } = await supabase.from('branches').select('*').eq('id', id).single()
  if (error) {
    console.error('fetchBranch error:', error)
    message.error('拠点の取得に失敗しました')
  } else if (data) {
    form.value = data
  }
}

const save = async () => {
  submitting.value = true
  if (isEdit.value) {
    const { error } = await supabase.from('branches').update({ name: form.value.name }).eq('id', form.value.id)
    if (error) {
      console.error('update branch error:', error)
      message.error('更新に失敗しました')
    } else {
      message.success('更新しました')
      goList()
    }
  } else {
    const { error } = await supabase.from('branches').insert([{ name: form.value.name }])
    if (error) {
      console.error('insert branch error:', error)
      message.error('追加に失敗しました')
    } else {
      message.success('追加しました')
      goList()
    }
  }
  submitting.value = false
}

onMounted(() => {
  if (isEdit.value && typeof route.params.id === 'string') {
    fetchBranch(route.params.id)
  }
})
</script>

```

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
</template>```

## src/views/carelogs/CareLogList.vue

```vue
<template>
  <div class="p-6">
    <n-spin :show="loading">
      <n-data-table
        :columns="columns"
        :data="careLogs"
        :bordered="false"
        :single-line="false"
        :pagination="pagination"
      />
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { NDataTable, NButton, NSpin } from 'naive-ui'
import { FQ_VIEW } from '@/lib/contracts'

const router = useRouter()
const careLogs = ref<any[]>([])
const loading = ref(false)

const pagination = { pageSize: 20 }

const columns = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '利用者', key: 'user_name', width: 160 },
  { title: '日付', key: 'date', width: 140,
    render: (row: any) => new Date(row.date).toLocaleDateString() },
  { title: '概要', key: 'summary', ellipsis: { tooltip: true } },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render (row: any) {
      return h('div', { style: 'display:flex; gap:8px;' }, [
        h(
          NButton,
          { size: 'small', onClick: () => router.push({ name: 'care-log-detail', params: { id: row.id } }) },
          { default: () => '詳細' }
        ),
        h(
          NButton,
          { size: 'small', type: 'primary', onClick: () => router.push({ name: 'care-log-edit', params: { id: row.id } }) },
          { default: () => '編集' }
        )
      ])
    }
  }
]

const fetchLogs = async () => {
  loading.value = true
  const { data, error } = await supabase
    .from(FQ_VIEW.V_CARE_LOGS)
    .select('*')
    .order('date', { ascending: false })
    .limit(100)

  if (error) {
    console.error('[CareLogList] fetch error:', error)
  } else {
    careLogs.value = data ?? []
  }
  loading.value = false
}

onMounted(fetchLogs)
</script>```

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
</template>```

## src/views/staffs/StaffDetail.vue

```vue
<template>
  <div class="p-4">
    <NCard title="スタッフ詳細">
      <template #header-extra>
        <NSpace>
          <NButton @click="goList">一覧へ</NButton>
          <NButton type="primary" @click="goEdit" :disabled="!staff?.id">編集</NButton>
          <NPopconfirm @positive-click="onDelete" :negative-text="'キャンセル'" :positive-text="'削除'">
            <template #trigger>
              <NButton type="error" :disabled="!staff?.id">削除</NButton>
            </template>
            本当に削除しますか？
          </NPopconfirm>
        </NSpace>
      </template>

      <NDescriptions label-placement="left" :column="1" bordered>
        <NDescriptionsItem label="ID">
          <code>{{ staff?.id }}</code>
        </NDescriptionsItem>

        <NDescriptionsItem label="氏名">
          {{ staff?.name || '—' }}
        </NDescriptionsItem>

        <NDescriptionsItem label="メールアドレス">
          {{ staff?.email || '—' }}
        </NDescriptionsItem>

        <NDescriptionsItem label="ロール">
          <NTag v-if="staff?.role" size="small">{{ staff?.role }}</NTag>
          <template v-else>—</template>
        </NDescriptionsItem>

        <NDescriptionsItem label="ログイン連携 (auth_user_id)">
          <code v-if="staff?.auth_user_id">{{ staff?.auth_user_id }}</code>
          <template v-else>—</template>
        </NDescriptionsItem>

        <NDescriptionsItem label="所属拠点">
          <NSpace wrap>
            <NTag v-for="b in branches" :key="b.id" size="small">{{ b.name }}</NTag>
            <span v-if="branches.length === 0">—</span>
          </NSpace>
        </NDescriptionsItem>

        <NDescriptionsItem label="作成日時">
          {{ formatTs(staff?.created_at) }}
        </NDescriptionsItem>

        <NDescriptionsItem label="更新日時">
          {{ formatTs(staff?.updated_at) }}
        </NDescriptionsItem>
      </NDescriptions>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NCard,
  NSpace,
  NButton,
  NPopconfirm,
  NDescriptions,
  NDescriptionsItem,
  NTag,
  useMessage
} from 'naive-ui'
import { supabase } from '@/lib/supabase'

type StaffViewRow = {
  id: string
  name: string | null
  email: string | null
  role: 'admin' | 'manager' | 'staff' | null
  auth_user_id: string | null
  created_at?: string | null
  updated_at?: string | null
  branches_json?: Array<{ id: string; name: string }> | null
}

type Branch = { id: string; name: string }

const route = useRoute()
const router = useRouter()
const message = useMessage()

const staffId = route.params.id as string
const staff = ref<StaffViewRow | null>(null)
const branches = ref<Branch[]>([])

function formatTs(ts?: string | null) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ts || '—'
  }
}

async function load() {
  try {
    // v_staff_with_branches（public）から一括取得
    const { data, error } = await supabase
      .from('v_staff_with_branches')
      .select('id,name,email,role,auth_user_id,created_at,updated_at,branches_json')
      .eq('id', staffId)
      .single()

    if (error) throw error

    staff.value = data as StaffViewRow
    branches.value = (data?.branches_json ?? []) as Branch[]
  } catch (e: any) {
    message.error(e?.message ?? '読み込みに失敗しました')
  }
}

function goList() {
  router.push({ name: 'staff-list' })
}

function goEdit() {
  router.push({ name: 'staff-edit', params: { id: staffId } })
}

async function onDelete() {
  try {
    // 一貫性維持：中間 → 本体 の順に削除
    const { error: e1 } = await supabase
      .from('staff_branch_memberships')
      .delete()
      .eq('staff_id', staffId)
    if (e1) throw e1

    const { error: e2 } = await supabase
      .from('staffs')
      .delete()
      .eq('id', staffId)
    if (e2) throw e2

    message.success('削除しました')
    goList()
  } catch (e: any) {
    message.error(e?.message ?? '削除に失敗しました')
  }
}

onMounted(load)
</script>

<style scoped>
.p-4 { padding: 1rem; }
</style>```

## src/views/staffs/StaffList.vue

```vue
<template>
  <div>
    <n-space justify="space-between" style="margin-bottom: 16px;">
      <n-button type="primary" @click="goNew">新規スタッフ追加</n-button>
      <n-input v-model:value="search" placeholder="名前で検索" clearable style="width: 200px;" />
    </n-space>

    <n-data-table
      :columns="columns"
      :data="filteredStaffs"
      :pagination="pagination"
      :bordered="false"
    />
  </div>
</template>

<script setup lang="ts">
import { h, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NDataTable, NSpace, NInput } from 'naive-ui'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const staffs = ref<any[]>([])
const search = ref('')

const columns = [
  { title: '名前', key: 'name' },
  { title: 'メール', key: 'email' },
  { title: '役割', key: 'role' },
  {
    title: '操作',
    key: 'actions',
    render (row: any) {
      return h('div', {}, [
        h(
          NButton,
          {
            size: 'small',
            onClick: () => router.push({ name: 'staff-detail', params: { id: row.id } })
          },
          { default: () => '詳細' }
        ),
        h(
          NButton,
          {
            size: 'small',
            style: 'margin-left: 8px;',
            onClick: () => router.push({ name: 'staff-edit', params: { id: row.id } })
          },
          { default: () => '編集' }
        )
      ])
    }
  }
]

const pagination = { pageSize: 10 }

const filteredStaffs = computed(() => {
  if (!search.value) return staffs.value
  return staffs.value.filter((s) =>
    s.name.toLowerCase().includes(search.value.toLowerCase())
  )
})

async function fetchStaffs () {
  const { data, error } = await supabase
    .from('v_staff_with_branches')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('スタッフ一覧の取得エラー:', error)
  } else {
    staffs.value = data || []
  }
}

function goNew () {
  router.push({ name: 'staff-new' })
}

onMounted(fetchStaffs)
</script>```

## src/views/staffs/StaffUpsert.vue

```vue
<template>
  <div>
    <n-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-placement="top"
      require-mark-placement="right-hanging"
    >
      <n-form-item label="氏名" path="name">
        <n-input v-model:value="form.name" placeholder="例）田中 太郎" clearable />
      </n-form-item>

      <n-form-item label="フリガナ" path="kana">
        <n-input v-model:value="form.kana" placeholder="例）タナカ タロウ" clearable />
      </n-form-item>

      <n-form-item label="メールアドレス" path="email">
        <n-input v-model:value="form.email" placeholder="例）taro@example.com" clearable />
      </n-form-item>

      <n-form-item label="役割" path="role">
        <n-select
          v-model:value="form.role"
          :options="roleOptions"
          placeholder="選択してください"
          clearable
        />
      </n-form-item>

      <n-form-item label="所属拠点" path="branches">
        <n-select
          v-model:value="form.branches"
          multiple
          :options="branchOptions"
          placeholder="選択してください"
          clearable
        />
      </n-form-item>

      <n-space justify="end">
        <n-button ghost @click="goList">キャンセル</n-button>
        <n-button type="primary" :loading="submitting" @click="onSubmit">保存</n-button>
      </n-space>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NForm, NFormItem, NInput, NSelect, NSpace, NButton, useMessage } from 'naive-ui'
import { supabase } from '@/lib/supabase'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const formRef = ref()
const form = ref({
  id: null,
  name: '',
  kana: '',
  email: '',
  role: '',
  branches: [] as string[]
})
const submitting = ref(false)

const roleOptions = [
  { label: 'スタッフ', value: 'staff' },
  { label: '管理者', value: 'manager' },
  { label: '施設長', value: 'admin' }
]

const branchOptions = ref<any[]>([])

const rules = {
  name: { required: true, message: '氏名は必須です', trigger: 'blur' },
  role: { required: true, message: '役割は必須です', trigger: 'change' }
}

async function fetchBranches () {
  const { data, error } = await supabase.from('branches').select('id, name').order('name')
  if (error) {
    console.error('拠点一覧の取得エラー:', error)
  } else {
    branchOptions.value = (data || []).map((b) => ({ label: b.name, value: b.id }))
  }
}

async function fetchStaff (id: string) {
  const { data, error } = await supabase
    .from('v_staff_with_branches')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('スタッフ情報の取得エラー:', error)
  } else if (data) {
    form.value = {
      id: data.id,
      name: data.name,
      kana: data.kana,
      email: data.email,
      role: data.role,
      branches: (data.branches_json || []).map((b: any) => b.id)
    }
  }
}

async function onSubmit () {
  submitting.value = true
  try {
    const { id, branches, ...staffData } = form.value

    let upsertRes
    if (id) {
      upsertRes = await supabase.from('staffs').update(staffData).eq('id', id).select('id').single()
    } else {
      upsertRes = await supabase.from('staffs').insert(staffData).select('id').single()
    }

    if (upsertRes.error) throw upsertRes.error
    const staffId = upsertRes.data.id

    // 所属拠点の更新
    await supabase.from('staff_branch_memberships').delete().eq('staff_id', staffId)
    if (branches.length > 0) {
      const memberships = branches.map((branchId: string) => ({ staff_id: staffId, branch_id: branchId }))
      await supabase.from('staff_branch_memberships').insert(memberships)
    }

    // Auth 同期
    const { error: fnErr } = await supabase.functions.invoke('admin-sync-auth', {
      body: { staff_id: staffId }
    })
    if (fnErr) throw fnErr

    message.success('保存しました')
    router.push({ name: 'staff-list' })
  } catch (e: any) {
    console.error('保存エラー:', e)
    message.error('保存に失敗しました')
  } finally {
    submitting.value = false
  }
}

function goList () {
  router.push({ name: 'staff-list' })
}

onMounted(() => {
  fetchBranches()
  if (route.params.id) fetchStaff(route.params.id as string)
})
</script>```

## src/views/users/UserDetail.vue

```vue
<template>
  <div class="p-4">
    <n-card title="利用者詳細">
      <n-descriptions bordered :column="1">
        <n-descriptions-item label="氏名">{{ user?.name }}</n-descriptions-item>
        <n-descriptions-item label="メール">{{ user?.email || '（未設定）' }}</n-descriptions-item>
        <n-descriptions-item label="ロール">{{ user?.role }}</n-descriptions-item>
        <n-descriptions-item label="作成日時">{{ user?.created_at }}</n-descriptions-item>
        <n-descriptions-item label="更新日時">{{ user?.updated_at }}</n-descriptions-item>
      </n-descriptions>

      <template #footer>
        <n-space justify="end">
          <n-button @click="goList">一覧に戻る</n-button>
          <n-button type="primary" @click="goEdit">編集</n-button>
        </n-space>
      </template>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'

import { supabase } from '@/lib/supabase'
import { TABLE, ROUTE } from '@/lib/contracts'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const user = ref<any>(null)

async function load() {
  const id = route.params.id as string
  const { data, error } = await supabase
    .from(TABLE.users)
    .select('*')
    .eq('id', id)
    .single()
  if (error) {
    message.error(error.message)
    return
  }
  user.value = data
}

function goList() {
  router.push({ name: ROUTE.user.list })
}

function goEdit() {
  router.push({ name: ROUTE.user.edit, params: { id: route.params.id } })
}

onMounted(load)
</script>

<style scoped>
.p-4 { padding: 1rem; }
</style>```

## src/views/users/UserList.vue

```vue
<template>
  <div class="p-4">
    <n-card title="利用者一覧">
      <template #header-extra>
        <n-button type="primary" @click="goNew">新規追加</n-button>
      </template>

      <n-data-table
        :columns="columns"
        :data="rows"
        :loading="loading"
        :pagination="pagination"
        :bordered="false"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { h, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, useMessage } from 'naive-ui'

import { supabase } from '@/lib/supabase'
import { TABLE, ROUTE } from '@/lib/contracts'

const router = useRouter()
const message = useMessage()

const rows = ref<any[]>([])
const loading = ref(false)

const pagination = {
  pageSize: 20,
  showSizePicker: false,
}

const columns = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '氏名', key: 'name', width: 200 },
  { title: 'メールアドレス', key: 'email', width: 220 },
  { title: 'ロール', key: 'role', width: 100 },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render (row: any) {
      return h('div', { class: 'flex gap-2' }, [
        h(
          NButton,
          {
            size: 'small',
            onClick: () => router.push({ name: ROUTE.user.detail, params: { id: row.id } })
          },
          { default: () => '詳細' }
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            onClick: () => router.push({ name: ROUTE.user.edit, params: { id: row.id } })
          },
          { default: () => '編集' }
        )
      ])
    }
  }
]

async function load() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from(TABLE.users)
      .select('id, name, email, role')
      .order('created_at', { ascending: false })
    if (error) throw error
    rows.value = data || []
  } catch (e: any) {
    message.error(e?.message ?? '利用者一覧の取得に失敗しました')
  } finally {
    loading.value = false
  }
}

function goNew() {
  router.push({ name: ROUTE.user.new })
}

onMounted(load)
</script>

<style scoped>
.p-4 { padding: 1rem; }
.flex { display: flex; }
.gap-2 { gap: 0.5rem; }
</style>```

## src/views/users/UserUpsert.vue

```vue
<template>
  <div class="p-4">
    <n-card :title="isEdit ? '利用者編集' : '利用者追加'">
      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="top"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="氏名" path="name">
          <n-input v-model:value="form.name" placeholder="例）山田 花子" clearable />
        </n-form-item>

        <n-form-item label="メールアドレス" path="email">
          <n-input v-model:value="form.email" placeholder="example@example.com" clearable />
        </n-form-item>

        <n-form-item label="ロール" path="role">
          <n-select
            v-model:value="form.role"
            :options="roleOptions"
            placeholder="選択してください"
            clearable
          />
        </n-form-item>

        <n-space justify="end">
          <n-button ghost @click="goList">キャンセル</n-button>
          <n-button type="primary" :loading="submitting" @click="save">保存</n-button>
        </n-space>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'

import { supabase } from '@/lib/supabase'
import { TABLE, ROUTE } from '@/lib/contracts'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const formRef = ref()
const form = ref<any>({
  name: '',
  email: '',
  role: null
})
const submitting = ref(false)

const roleOptions = [
  { label: '利用者', value: 'user' },
  { label: '管理者', value: 'admin' },
]

const rules = {
  name: { required: true, message: '氏名を入力してください', trigger: 'blur' },
  email: { type: 'email', message: 'メールアドレスの形式が不正です', trigger: 'blur' },
}

const isEdit = ref(false)
const id = ref<string | null>(null)

async function load() {
  if (!route.params.id) return
  isEdit.value = true
  id.value = route.params.id as string

  const { data, error } = await supabase
    .from(TABLE.users)
    .select('id, name, email, role')
    .eq('id', id.value)
    .single()
  if (error) {
    message.error(error.message)
    return
  }
  form.value = data
}

async function save() {
  submitting.value = true
  try {
    if (isEdit.value) {
      const { error } = await supabase
        .from(TABLE.users)
        .update({
          name: form.value.name,
          email: form.value.email,
          role: form.value.role
        })
        .eq('id', id.value!)
      if (error) throw error
      message.success('更新しました')
    } else {
      const { error } = await supabase
        .from(TABLE.users)
        .insert([form.value])
      if (error) throw error
      message.success('追加しました')
    }
    router.push({ name: ROUTE.user.list })
  } catch (e: any) {
    message.error(e?.message ?? '保存に失敗しました')
  } finally {
    submitting.value = false
  }
}

function goList() {
  router.push({ name: ROUTE.user.list })
}

onMounted(load)
</script>

<style scoped>
.p-4 { padding: 1rem; }
</style>```

## src/vite-env.d.ts

```ts
/// <reference types="vite/client" />
```

## supabase/functions/admin-sync-auth/index.ts

```ts
// supabase/functions/admin-sync-auth/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ---- CORS -------------------------------------------------
const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*', // 必要があればドメインを絞る
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}
const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...corsHeaders, ...(init.headers || {}) },
  })
// -----------------------------------------------------------

const SUPABASE_URL = Deno.env.get('FUNC_SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('FUNC_SERVICE_ROLE_KEY')!
const ANON_KEY     = Deno.env.get('FUNC_ANON_KEY')!  // RLS検証用

// service-role（RLS無視）クライアント
const adminDb = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
  db: { schema: 'public' },
})

const isPrivileged = (role: string | null) => role === 'admin' || role === 'manager'

Deno.serve(async (req: Request) => {
  // Preflight
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    const jwt = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || null

    // --- 認証付き ping（開発用） ------------------------------
    if (url.searchParams.get('ping') === '1') {
      if (!jwt) return json({ code: 401, message: 'Missing authorization header' }, { status: 401 })

      const callerDb = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
        db: { schema: 'public' },
      })

      const { data: meUser, error: meUserErr } = await callerDb.auth.getUser()
      if (meUserErr) return json({ error: 'auth.getUser failed', detail: meUserErr.message }, { status: 401 })

      const { data: me, error: meErr } = await callerDb
        .from('staffs')
        .select('id, role, auth_user_id')
        .eq('auth_user_id', meUser.user?.id ?? '')
        .maybeSingle()

      if (meErr) return json({ error: 'fetch caller staff failed', detail: meErr.message }, { status: 500 })
      return json({ ok: true, me })
    }

    // --- POST 以外は拒否 -------------------------------------
    if (req.method !== 'POST') return json({ error: 'method not allowed' }, { status: 405 })
    if (!jwt) return json({ error: 'unauthorized' }, { status: 401 })

    const { staff_id } = await req.json().catch(() => ({}))
    if (!staff_id) return json({ error: 'staff_id required' }, { status: 400 })

    // --- 呼び出しユーザの権限確認（RLS 越し） -----------------
    const callerDb = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      db: { schema: 'public' },
    })

    const { data: callerUser, error: callerUserErr } = await callerDb.auth.getUser()
    if (callerUserErr) {
      console.error('[admin-sync-auth] caller getUser err:', callerUserErr)
      return json({ error: 'unauthorized' }, { status: 401 })
    }

    const { data: caller, error: callerErr } = await callerDb
      .from('staffs')
      .select('id, role')
      .eq('auth_user_id', callerUser.user?.id ?? '')
      .maybeSingle()

    if (callerErr) {
      console.error('[admin-sync-auth] fetch caller staff err:', callerErr)
      return json({ error: 'internal error', detail: callerErr.message }, { status: 500 })
    }
    if (!caller || !isPrivileged(caller.role)) {
      return json({ error: 'forbidden' }, { status: 403 })
    }

    // --- 対象スタッフ（service-roleで直参照） ----------------
    const { data: staff, error: staffErr } = await adminDb
      .from('staffs')
      .select('id, email, role, auth_user_id')
      .eq('id', staff_id)
      .single()

    if (staffErr) {
      console.error('[admin-sync-auth] load staff err:', staffErr)
      return json({ error: 'staff not found', detail: staffErr.message }, { status: 404 })
    }

    const needsAuth = isPrivileged(staff.role)
    const email = (staff.email ?? '').trim() || null

    // --- revoke: ログイン不要/メール無し -----------------------
    if (!needsAuth || !email) {
      if (staff.auth_user_id) {
        const { error: delErr } = await adminDb.auth.admin.deleteUser(staff.auth_user_id)
        if (delErr && !String(delErr.message || '').toLowerCase().includes('not found')) {
          console.error('[admin-sync-auth] deleteUser err:', delErr)
          return json({ error: 'internal error', detail: delErr.message }, { status: 500 })
        }
        const { error: updErr } = await adminDb
          .from('staffs')
          .update({ auth_user_id: null })
          .eq('id', staff.id)
        if (updErr) {
          console.error('[admin-sync-auth] unlink auth_user_id err:', updErr)
          return json({ error: 'internal error', detail: updErr.message }, { status: 500 })
        }
      }
      return json({ ok: true, action: 'revoke-auth', staff_id })
    }

    // --- ensure: ログイン必要（email あり） -------------------
    if (staff.auth_user_id) {
      const { data: u, error: getErr } = await adminDb.auth.admin.getUserById(staff.auth_user_id)
      if (getErr) {
        console.error('[admin-sync-auth] getUserById err:', getErr)
        return json({ error: 'internal error', detail: getErr.message }, { status: 500 })
      }
      if (u?.user && u.user.email !== email) {
        const { error: upErr } = await adminDb.auth.admin.updateUserById(staff.auth_user_id, { email })
        if (upErr) {
          const msg = String(upErr.message || '').toLowerCase()
          if (msg.includes('already registered') || msg.includes('already exists')) {
            return json({ error: 'email_conflict' }, { status: 409 })
          }
          console.error('[admin-sync-auth] updateUserById err:', upErr)
          return json({ error: 'internal error', detail: upErr.message }, { status: 500 })
        }
      }
      return json({ ok: true, action: 'update-email', staff_id })
    }

    // --- 新規作成 ---------------------------------------------
    const { data: created, error: createErr } = await adminDb.auth.admin.createUser({
      email,
      email_confirm: true,
      app_metadata: { role: staff.role },
      user_metadata: { source: 'admin-sync-auth', staff_id: staff.id },
    })
    if (createErr || !created?.user) {
      const msg = String(createErr?.message || '').toLowerCase()
      if (msg.includes('already registered') || msg.includes('already exists')) {
        return json({ error: 'email_conflict' }, { status: 409 })
      }
      console.error('[admin-sync-auth] createUser err:', createErr)
      return json({ error: 'internal error', detail: createErr?.message || 'create failed' }, { status: 500 })
    }

    const { error: linkErr } = await adminDb
      .from('staffs')
      .update({ auth_user_id: created.user.id })
      .eq('id', staff.id)
    if (linkErr) {
      console.error('[admin-sync-auth] link auth_user_id err:', linkErr)
      return json({ error: 'internal error', detail: linkErr.message }, { status: 500 })
    }

    return json({ ok: true, action: 'ensure-auth', staff_id })
  } catch (e: any) {
    console.error('[admin-sync-auth] unhandled error:', e)
    return json({ error: 'internal error', detail: e?.message ?? String(e) }, { status: 500 })
  }
})```

