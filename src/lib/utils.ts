// utils.ts
import { ref } from 'vue'

type ImeGuardOpts = {
  /** IME確定後、この時間内は「2回目のEnter」で実行する（ms） */
  doubleEnterWindowMs?: number
  /** compositionend直後の同一押下Enterを無視する猶予（ms） */
  suppressAfterCompMs?: number
}

export function useImeGuard(opts: ImeGuardOpts = {}) {
  const windowMs  = opts.doubleEnterWindowMs ?? 800
  const suppressMs = opts.suppressAfterCompMs ?? 60  // ★ 直後Enter抑止

  const isComposing = ref(false)
  const needDoubleUntil = ref(0)        // この時刻まで二度押し要求
  const awaitingSecond  = ref(false)    // 次のEnterで実行するフラグ
  const suppressUntil   = ref(0)        // compositionend直後の同一押下を食べる

  const onCompStart = () => { isComposing.value = true }
  const onCompEnd = () => {
    isComposing.value = false
    needDoubleUntil.value = performance.now() + windowMs
    awaitingSecond.value = true            // ★ すでに1回押された前提にする
    suppressUntil.value  = performance.now() + suppressMs // ★ 同一押下のEnterを抑止
  }

  /** Enter押下：IME中は無視。二度押し期間は awaitingSecond に応じて実行。 */
  const onEnter = (cb: () => void) => (e: KeyboardEvent) => {
    // @ts-ignore
    const composing = isComposing.value || e.isComposing === true || (e as any).keyCode === 229
    if (composing) return

    const now = performance.now()

    // compositionend直後の“同一押下”は食べる
    if (now <= suppressUntil.value) {
      e?.preventDefault?.()
      return
    }

    if (now <= needDoubleUntil.value) {
      // 二度押し期間中
      if (awaitingSecond.value) {
        // これが“2回目”
        awaitingSecond.value = false
        needDoubleUntil.value = 0
        e?.preventDefault?.()
        cb()
      } else {
        // ここには基本来ない想定（保険）
        awaitingSecond.value = true
        e?.preventDefault?.()
      }
      return
    }

    // 通常時は1回で実行（英数入力時のUX維持）
    e?.preventDefault?.()
    cb()
  }

  const onBlur = () => {
    awaitingSecond.value = false
    needDoubleUntil.value = 0
    suppressUntil.value = 0
    isComposing.value = false
  }

  return { isComposing, onCompStart, onCompEnd, onEnter, onBlur }
}

// そのまま（全角スペース正規化＋重複排除）
export function pushUniqueTag(list: string[] | undefined, tag: string): string[] {
  const t = String(tag ?? '').replace(/\u3000/g, ' ').trim()
  const arr = Array.isArray(list) ? list.slice() : []
  if (t && !arr.includes(t)) arr.push(t)
  return arr
}