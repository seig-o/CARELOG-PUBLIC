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
})