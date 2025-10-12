export type StaffRole = 'admin' | 'manager' | 'caregiver' | 'nurse' | string

export type Staff = {
  id: string
  auth_user_id: string | null
  name: string
  role: StaffRole
  // branch_id は廃止。所属は staff_branch_memberships を参照
}

export type StaffBranchMembership = {
  id: string
  staff_id: string
  branch_id: string
  is_primary?: boolean
}