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

