// src/router/index.ts
import { TABLE, ROUTE } from '@/lib/contracts'
import { useCtxStore } from '@/stores/ctx'
import { supabase, fromCare } from '@/lib/supabase'
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router'

// Users
import UserList from '@/views/users/UserList.vue'
import UserUpsert from '@/views/users/UserUpsert.vue'
const UserDetail = () => import('@/views/users/UserDetail.vue')

// Staffs
import StaffList from '@/views/staffs/StaffList.vue'
import StaffUpsert from '@/views/staffs/StaffUpsert.vue'
const StaffDetail = () => import('@/views/staffs/StaffDetail.vue')

// Branches
import BranchList from '@/views/branches/BranchList.vue'
import BranchUpsert from '@/views/branches/BranchUpsert.vue'
const BranchDetail = () => import('@/views/branches/BranchDetail.vue')

// Companies
import CompanyList from '@/views/companies/CompanyList.vue'
const CompanyUpsert = () => import('@/views/companies/CompanyUpsert.vue')
const CompanyDetail = () => import('@/views/companies/CompanyDetail.vue')

// CareLogs（新モジュール）
const CareLogList = () => import('@/views/carelogs/CareLogList.vue')
const CareLogDetail = () => import('@/views/carelogs/CareLogDetail.vue')
const CareLogUpsert = () => import('@/views/carelogs/CareLogUpsert.vue')

const routes = [
  // Login
  {
    path: '/login',
    name: 'login',
    meta: { public: true, hideHeader: true },
    component: () => import('@/views/LoginView.vue'),
  },

  // ルート：固定リダイレクトをやめ、ガードで動的に割り振る
  {
    path: '/',
    name: 'root',
    meta: { public: true },
    component: { render: () => null } // 空コンポーネント
  },

  // ========= 役割別トップ =========
  {
    path: '/top/superadmin',
    name: 'top-superadmin',
    component: () => import('@/views/TopSuperadmin.vue'),
    meta: { requiresSuperadmin: true }
  },
  {
    path: '/top/admin',
    name: 'top-admin',
    component: () => import('@/views/TopAdmin.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/top/manager',
    name: 'top-manager',
    component: () => import('@/views/TopManager.vue'),
    meta: { requiresManager: true }
  },

  // 会社ロビー（= その会社の拠点一覧を出す画面）
  { 
    path: '/company/:companyId/branches',
    name: 'company-lobby',
    component: BranchList,                       // 既存の BranchList を流用
    meta: { requiresAdmin: true }                // superadmin も通過可（beforeEachのALLOW_ADMIN_ROLESにより）
  },

  // 拠点ロビー（= その拠点のケアログ一覧を出す画面）
  {
    path: '/branch/:branchId/lobby',
    name: 'branch-lobby',
    component: () => import('@/views/BranchLobby.vue')
  },
  {
    path: '/branch/:branchId/care-logs',
    name: 'branch-care-logs',                    // ← 修正：重複を解消
    component: CareLogList,
    // meta は任意
  },

  // ========= 新URL（直感優先: /resource/list,new,:id,:id/edit） =========

  // Users
  { path: '/user/list',       name: 'user-list',   component: UserList,   meta: { requiresAdmin: true } },
  { path: '/user/new',        name: 'user-new',    component: UserUpsert, meta: { requiresAdmin: true } },
  { path: '/user/:id',        name: 'user-detail', component: UserDetail, meta: { requiresAdmin: true } },
  { path: '/user/:id/edit',   name: 'user-edit',   component: UserUpsert, meta: { requiresAdmin: true } },

  // Staffs
  { path: '/staff/list',      name: 'staff-list',   component: StaffList,   meta: { requiresAdmin: true } },
  { path: '/staff/new',       name: 'staff-new',    component: StaffUpsert, meta: { requiresAdmin: true } },
  { path: '/staff/:id',       name: 'staff-detail', component: StaffDetail, meta: { requiresAdmin: true } },
  { path: '/staff/:id/edit',  name: 'staff-edit',   component: StaffUpsert, meta: { requiresAdmin: true } },

  // Branches
  { path: '/branch/list',         name: 'branch-list', component: BranchList,   meta: { requiresAdmin: true } },
  { path: '/branch/new',          name: 'branch-new',  component: BranchUpsert, meta: { requiresAdmin: true } },
  { path: '/branch/:id',          name: 'branch-detail', component: BranchDetail, meta: { requiresAdmin: true } },
  { path: '/branch/:id/edit',     name: 'branch-edit', component: BranchUpsert, meta: { requiresAdmin: true } },

  // Companies（superadminのみ）
  { path: '/company/list',             name: 'company-list',   component: CompanyList, meta: { requiresSuperadmin: true }  },
  { path: '/company/new',              name: 'company-new',    component: CompanyUpsert, meta: { requiresSuperadmin: true }  },
  { path: '/company/:companyId',       name: 'company-detail', component: CompanyDetail, meta: { requiresSuperadmin: true }  },
  { path: '/company/:companyId/edit',  name: 'company-edit',   component: CompanyUpsert, meta: { requiresSuperadmin: true }  },

  // CareLogs
  { path: '/care-log/list',       name: 'care-log-list',   component: CareLogList },
  { path: '/care-log/new',        name: 'care-log-new',    component: CareLogUpsert },
  { path: '/care-log/:id',        name: 'care-log-detail', component: CareLogDetail },
  { path: '/care-log/:id/edit',   name: 'care-log-edit',   component: CareLogUpsert },

  // 短縮: /branches ＝ 現在会社の拠点一覧
  {
    path: '/branches',
    name: 'branches-short',
    meta: { requiresAdmin: true },
    beforeEnter: async () => true, // 既存 beforeEach が動く前提
    component: () => import('@/views/branches/BranchList.vue')
  },

  // 短縮: /care-logs ＝ 現在拠点のケアログ一覧
  {
    path: '/care-logs',
    name: 'care-logs-short',
    // RLS的には誰でもOKなら meta なしでもOK。管理UIなら requiresManager でも良い
    component: () => import('@/views/carelogs/CareLogList.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// ルーターガード（マージ版）
let _roleCache: { role: 'superadmin' | 'admin' | 'manager' | null; at: number } | null = null
const ROLE_TTL_MS = 5 * 60 * 1000
const ALLOW_ADMIN_ROLES = ['admin', 'manager', 'superadmin'] as const
const ALLOW_MANAGER_ROLES = ['manager', 'admin', 'superadmin'] as const

async function fetchRole(): Promise<'superadmin' | 'admin' | 'manager' | null> {
  const now = Date.now()
  if (_roleCache && now - _roleCache.at < ROLE_TTL_MS) return _roleCache.role

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    _roleCache = { role: null, at: now }
    return null
  }
  const { data: staff, error } = await supabase
    .from('staffs')
    .select('role')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[router] staff fetch error:', error)
    _roleCache = { role: null, at: now }
    return null
  }
  const r = (staff as any)?.role ?? null
  const role = r === 'superadmin' ? 'superadmin' : r === 'admin' ? 'admin' : r === 'manager' ? 'manager' : null
  _roleCache = { role, at: now }
  return role
}

function topNameByRole(role: 'superadmin' | 'admin' | 'manager' | null) {
  if (role === 'superadmin') return 'top-superadmin'
  if (role === 'admin')      return 'top-admin'
  return 'top-manager'
}

router.beforeEach(async (to) => {
  const { data: { session } } = await supabase.auth.getSession()
  const isPublic = !!to.meta.public

  // /login 特例
  if (to.name === 'login') {
    if (session) {
      const role = await fetchRole()
      return { name: topNameByRole(role), replace: true }
    }
    return true
  }

  // /（root）を動的に役割Topへ
  if (to.name === 'root') {
    if (!session) return { name: 'login' }
    const role = await fetchRole()
    return { name: topNameByRole(role), replace: true }
  }

  // 要認証
  if (!isPublic && !session) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  const role = await fetchRole()

  // Top直叩きの整列
  if (to.name === 'top-superadmin' && role !== 'superadmin') {
    return { name: topNameByRole(role), replace: true }
  }
  if (to.name === 'top-admin' && !(role === 'admin' || role === 'superadmin')) {
    return { name: topNameByRole(role), replace: true }
  }

  // requiresAdmin
  if (to.meta.requiresAdmin) {
    if (!role || !ALLOW_ADMIN_ROLES.includes(role)) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
  }

  // requiresManager
  if (to.meta.requiresManager) {
    if (!role || !ALLOW_MANAGER_ROLES.includes(role)) {
      return { name: topNameByRole(role), replace: true }
    }
  }

  // superadmin限定
  if (to.meta.requiresSuperadmin) {
    if (role !== 'superadmin') {
      return { name: topNameByRole(role), replace: true }
    }
  }

  // /branches は company コンテキスト必須
  if (to.name === 'branches-short') {
    const ctx = useCtxStore()
    if (!ctx.company?.id) {
      // 文脈が無ければ旧フルパスへ誘導（一覧でもOK）
      return { name: 'company-list' }
    }
  }

  // /care-logs は branch コンテキスト必須
  if (to.name === 'care-logs-short') {
    const ctx = useCtxStore()
    if (!ctx.branch?.id || !ctx.branch?.companyId) {
      // 文脈が無ければ旧フルパスへ誘導
      return { name: 'care-log-list' }
      // もしくは会社/拠点のトップへ戻す運用でもOK
    }
  }

  return true
})

export default router