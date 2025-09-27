<template>
  <div>
    <h2 class="text-xl font-bold mb-4">
      {{ isEdit ? '拠点を編集' : '拠点を追加' }}
    </h2>

    <n-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-placement="top"
      require-mark-placement="right-hanging"
    >
      <n-form-item label="拠点名" path="name">
        <n-input v-model:value="form.name" placeholder="例）カモミールハウス松本" clearable />
      </n-form-item>

      <n-space justify="end">
        <n-button ghost @click="goList">キャンセル</n-button>
        <n-button type="primary" :loading="submitting" @click="save">
          保存
        </n-button>
      </n-space>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useMessage } from 'naive-ui'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const formRef = ref()
const form = ref<{ id?: string; name: string }>({ name: '' })
const submitting = ref(false)
const isEdit = computed(() => !!route.params.id)

const rules = {
  name: { required: true, message: '拠点名は必須です', trigger: 'blur' }
}

const goList = () => router.push({ name: 'branch-list' })

const fetchBranch = async (id: string) => {
  const { data, error } = await supabase.from('branches').select('*').eq('id', id).single()
  if (error) {
    console.error('fetchBranch error:', error)
    message.error('拠点の取得に失敗しました')
  } else if (data) {
    form.value = data
  }
}

const save = async () => {
  submitting.value = true
  if (isEdit.value) {
    const { error } = await supabase.from('branches').update({ name: form.value.name }).eq('id', form.value.id)
    if (error) {
      console.error('update branch error:', error)
      message.error('更新に失敗しました')
    } else {
      message.success('更新しました')
      goList()
    }
  } else {
    const { error } = await supabase.from('branches').insert([{ name: form.value.name }])
    if (error) {
      console.error('insert branch error:', error)
      message.error('追加に失敗しました')
    } else {
      message.success('追加しました')
      goList()
    }
  }
  submitting.value = false
}

onMounted(() => {
  if (isEdit.value && typeof route.params.id === 'string') {
    fetchBranch(route.params.id)
  }
})
</script>

