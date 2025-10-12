## src/stores/staff.ts

```ts
// src/stores/staff.ts
import { defineStore } from 'pinia'

export const useStaffStore = defineStore('staff', {
  state: () => ({
    role: null as 'superadmin' | 'admin' | 'manager' | null,
    companyId: null as string | null
  }),
  actions: {
    setRole(role: 'superadmin' | 'admin' | 'manager') {
      this.role = role
    },
    setCompanyId(id: string) {
      this.companyId = id
    }
  }
})
```

