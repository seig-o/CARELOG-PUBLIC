## src/components/AppHeader.vue

```vue
<template>
  <n-layout-header bordered class="bg-white/80 backdrop-blur">
    <div class="mx-auto max-w-6xl px-4 h-14 flex items-center gap-4">
      <!-- Brand -->
      <RouterLink to="/" class="font-semibold text-lg hover:opacity-80">
        CARELOG
      </RouterLink>

      <!-- Flat Nav -->
      <div class="flex items-center gap-2 flex-1">
        <n-button
          v-for="item in filteredNav"
          :key="item.key"
          size="small"
          quaternary
          :type="activeKey === item.key ? 'primary' : 'default'"
          @click="go(item.key)"
        >
          {{ item.label }}
        </n-button>
      </div>

      <!-- 右側は親からのスロットで自由に（例：ログイン名表示など） -->
      <slot name="right" />

    </div>
  </n-layout-header>
  <!-- CompanySwitcher（superadminのみ表示） -->
  <CompanySwitcher v-if="isSuperadmin" />
  {{ auth.companyId }}
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { NLayoutHeader, NButton } from 'naive-ui'
import CompanySwitcher from '@/components/CompanySwitcher.vue'
import { useStaffStore } from '@/stores/staff' // ロール判定用
import { useAuthStore } from '@/stores/auth' // ログアウト用

const router = useRouter()
const route = useRoute()
const staff = useStaffStore()
const auth = useAuthStore()

type FlatItem = { label: string; key: string }

/** 必要最低限のルート名だけ定義（存在しないものは自動で除外） */
const flatNav: FlatItem[] = [
  { label: 'ホーム',         key: 'care-log-list' },
  { label: 'ケアログ一覧',   key: 'care-log-list'  },
  { label: 'ケアログ新規',   key: 'care-log-new'   },
  { label: '利用者一覧',     key: 'user-list'      },
  { label: '利用者新規',     key: 'user-new'       },
  { label: 'スタッフ一覧',   key: 'staff-list'     },
  { label: 'スタッフ新規',   key: 'staff-new'      },
  { label: '拠点一覧',       key: 'branch-list'    },
  { label: '拠点新規',       key: 'branch-new'     },
  { label: '会社一覧',       key: 'company-list'   },
  { label: '会社新規',       key: 'company-new'    },
  { label: 'ログアウト',       key: 'login'    },
]

/** ルートが存在するものだけ表示 */
const filteredNav = computed(() =>
  flatNav.filter(i => router.hasRoute(i.key as any))
)

/** DataTable等で route.name が symbol の場合があるので文字列化 */
const activeKey = computed(() => String(route.name ?? ''))

/** superadmin判定（Piniaストアから） */
const isSuperadmin = computed(() => auth.role === 'superadmin')

async function go(name: string) {
  if (!router.hasRoute(name as any)) {
    console.warn('[AppHeader] Unknown route name:', name)
    return
  }
  if (name === 'login') {
    // ログアウト時は強制的にリロード（状態クリアのため）
    auth.signOut()
    return
  }
  await router.push({ name: name as any })
}

const emit = defineEmits(['company-changed'])

async function onCompanyChange (companyId: string | null) {
  if (!companyId) return
  await auth.setCompanyId(companyId)
  emit('company-changed') // ← これで親に通知
}
</script>

<style scoped>
/* 見た目の微調整があればここに */
</style>
```

