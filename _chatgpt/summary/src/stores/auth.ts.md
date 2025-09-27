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

