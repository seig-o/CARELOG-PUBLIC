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