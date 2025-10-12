import { defineStore } from 'pinia'

type CtxCompany = { id: string; name?: string } | null
type CtxBranch  = { id: string; companyId?: string; name?: string } | null

export const useCtxStore = defineStore('ctx', {
  state: () => ({
    company: null as CtxCompany,
    branch:  null as CtxBranch
  }),
  actions: {
    setCompany(c: CtxCompany) {
      this.company = c
      if (!c) this.branch = null // 会社クリア時は拠点もクリア
    },
    setBranch(b: CtxBranch) { this.branch = b }
  }
})