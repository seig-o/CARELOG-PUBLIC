## src/components/AppHeader.vue

```vue
<template>
  <n-layout-header bordered class="bg-white/80 backdrop-blur">
    <div class="mx-auto max-w-6xl px-4 h-14 flex items-center gap-4">
      <!-- Brand -->
      <RouterLink to="/" class="font-semibold text-lg hover:opacity-80">
        CARELOG
      </RouterLink>

      <!-- Flat Global Nav (no dropdown) -->
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

      <!-- Right Area -->
      <div class="ml-auto flex items-center gap-3">
        <!-- 事業所セレクタ（null-safe） -->
        <div v-if="companiesSafe.length > 0" class="flex items-center gap-2">
          <span class="text-xs text-gray-500">事業所</span>
          <n-select
            size="small"
            :value="selectedCompanyId"
            :options="companyOptions"
            :consistent-menu-width="false"
            class="min-w-[160px]"
            @update:value="onChangeCompany"
          />
        </div>

        <!-- 認証表示（staff名 + email） -->
        <span v-if="userSafe" class="text-sm text-gray-600">
          {{ currentStaffName ?? '(no-name)' }} /
          {{ userSafe.email ?? 'signed-in' }}
        </span>
        <n-button v-if="isSignedIn" size="small" quaternary @click="logout">
          ログアウト
        </n-button>
        <RouterLink v-else :to="{ name: 'login' }">
          <n-button size="small" quaternary>ログイン</n-button>
        </RouterLink>
      </div>
    </div>

    <!-- 👇 現在の会社名を表示 -->
    <div v-if="currentCompanyName" class="ml-4 mb-1 text-xs text-gray-500">
      Company: {{ currentCompanyName }}
    </div>
  </n-layout-header>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { NLayoutHeader, NSelect, NButton, useMessage } from 'naive-ui'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const message = useMessage?.()

const currentCompanyName = ref<string | null>(null)
const currentCompanyId   = ref<string | null>(null)
const currentStaffName   = ref<string | null>(null)

const isSuperadmin = computed(() => auth?.staff?.role === 'superadmin')

/** ====== Flat Menu ======
 * company-* は superadmin 限定（requiresSuperadmin: true）
 */
type FlatItem = { label: string; key: string; requiresSuperadmin?: boolean }
const flatNav: FlatItem[] = [
  { label: 'ホーム',        key: 'care-log-list' }, // '/'
  { label: 'ケアログ一覧',  key: 'care-log-list'  },
  { label: 'ケアログ新規',  key: 'care-log-new'   },
  { label: '利用者一覧',    key: 'user-list'      },
  { label: '利用者新規',    key: 'user-new'       },
  { label: 'スタッフ一覧',  key: 'staff-list'     },
  { label: 'スタッフ新規',  key: 'staff-new'      },
  { label: '拠点一覧',      key: 'branch-list'    },
  { label: '拠点新規',      key: 'branch-new'     },
  { label: '会社一覧',      key: 'company-list',  requiresSuperadmin: true },
  { label: '会社新規',      key: 'company-new',   requiresSuperadmin: true },
]
const filteredNav = computed(() =>
  isSuperadmin.value ? flatNav : flatNav.filter(i => !i.requiresSuperadmin)
)

const activeKey = computed(() => (route.name as string | undefined) ?? 'care-log-list')

async function go(name: string, params?: Record<string, any>) {
  try {
    const resolved = router.resolve({ name, params })
    if (!resolved || !resolved.name) {
      console.warn('[AppHeader] Unknown route name:', name)
      message?.warning?.(`未定義のルートです: ${name}`)
      return
    }
    await router.push({ name, params })
  } catch (err: any) {
    console.error('[AppHeader] navigation error:', err)
    message?.warning?.('遷移できませんでした（権限やセッションをご確認ください）')
  }
}

const companiesSafe = computed(() =>
  Array.isArray(auth.companies) ? auth.companies : []
)
const companyOptions = computed(() =>
  companiesSafe.value.map((c: any) => ({ label: c.name ?? '（名称未設定）', value: c.id }))
)
const userSafe   = computed(() => auth.user ?? null)
const isSignedIn = computed(() => !!userSafe.value)

const selectedCompanyId = ref<string | null>(auth.companyId ?? null)

watch(
  companiesSafe,
  (list) => {
    if (!selectedCompanyId.value) {
      selectedCompanyId.value = list[0]?.id ?? null
    } else if (list.length > 0 && !list.some(c => c.id === selectedCompanyId.value)) {
      selectedCompanyId.value = list[0].id
    }
  },
  { immediate: true }
)

function onChangeCompany(id: string | null) {
  selectedCompanyId.value = id
  if (typeof auth.setCompanyId === 'function') {
    auth.setCompanyId(id)
  }
}

async function logout() {
  try {
    if (typeof auth.signOut === 'function') {
      await auth.signOut()
    } else if (auth.supabase?.auth?.signOut) {
      await auth.supabase.auth.signOut()
    }
    router.replace({ name: 'login' })
  } catch (e) {
    console.error('[AppHeader] signOut failed:', e)
  }
}

/** companyId をストア→DBの順で解決し、名前も補完 */
watch(
  () => auth.companyId,
  (val) => { currentCompanyId.value = val ?? null },
  { immediate: true }
)

watch(
  () => currentCompanyId.value,
  async (id) => {
    if (!id) {
      currentCompanyName.value = null
      return
    }
    // 1) ストアから即解決
    const fromStore = companiesSafe.value.find((c: any) => c.id === id)?.name ?? null
    if (fromStore) {
      currentCompanyName.value = fromStore
      return
    }
    // 2) 無ければ DB で補完（1回）
    const { data, error } = await supabase
      .from('companies')
      .select('name')
      .eq('id', id)
      .maybeSingle()
    currentCompanyName.value = data?.name ?? id
    if (error) console.warn('[AppHeader] company name fetch error:', error)
  },
  { immediate: true }
)

onMounted(async () => {
  // まず store 優先
  if (auth.companyId) {
    currentCompanyId.value = auth.companyId
  }
  // staff から補完（名前も）
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: staff } = await supabase
      .from('staffs')
      .select('company_id, name, role')
      .eq('auth_user_id', user.id)
      .maybeSingle()
    if (staff) {
      currentCompanyId.value = staff.company_id ?? currentCompanyId.value
      currentStaffName.value = staff.name ?? null
      // 可能ならストアへ反映（ヘッダー以外にも広げる）
      if (staff.company_id && typeof auth.setCompanyId === 'function') {
        auth.setCompanyId(staff.company_id)
      }
      // 役職をストアに持っているなら同期（isSuperadmin 判定に利用）
      if (typeof auth.setStaff === 'function') {
        auth.setStaff({ ...(auth.staff ?? {}), role: staff.role })
      }
    }
  }
})
</script>

<style scoped>
/* 必要なら色味や余白をここで微調整できます */
</style>```

