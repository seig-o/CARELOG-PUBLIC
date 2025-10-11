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