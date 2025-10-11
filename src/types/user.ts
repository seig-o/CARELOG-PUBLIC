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
}