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