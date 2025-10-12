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
// --------------------------------------------------------------