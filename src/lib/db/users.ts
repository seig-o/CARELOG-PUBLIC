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