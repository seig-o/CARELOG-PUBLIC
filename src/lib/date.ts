// ローカル時間基準で 'YYYY-MM-DD' ⇄ epoch(ms) を相互変換（UTC系APIは使わない）

/** 'YYYY-MM-DD' → epoch(ms) | null */
export function ymdStringToMs(ymd: string | null): number | null {
  if (!ymd) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd)
  if (!m) throw new Error(`ymdStringToMs: invalid format: ${ymd}`)
  const y = Number(m[1]); const mon = Number(m[2]); const d = Number(m[3])
  const dt = new Date(y, mon - 1, d, 0, 0, 0, 0) // ローカル00:00
  return dt.getTime()
}

/** epoch(ms) → 'YYYY-MM-DD' | null */
export function msToYmdString(ms: number | null): string | null {
  if (ms === null || ms === undefined) return null
  const d = new Date(ms)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** 任意入力（string|Date|number|null）を 'YYYY-MM-DD' に正規化 */
export function toYmd(value: string | Date | number | null): string | null {
  if (value == null) return null
  if (typeof value === 'string') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new Error(`toYmd: invalid string: ${value}`)
    }
    return value
  }
  if (value instanceof Date) return msToYmdString(value.getTime())
  if (typeof value === 'number') return msToYmdString(value)
  return null
}