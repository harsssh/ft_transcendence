// ============================================================================
// Helper Functions
// ============================================================================

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** 配列から安全に要素を取得する。存在しない場合はエラー */
export function at<T>(array: T[], index: number): T {
  const value = array[index]
  if (value === undefined) {
    throw new Error(`Array index out of bounds: ${index}`)
  }
  return value
}

/** 配列からランダムに要素を取得 */
export function randomElement<T>(array: readonly T[]): T {
  return at([...array], randomInt(0, array.length - 1))
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = at(shuffled, i)
    shuffled[i] = at(shuffled, j)
    shuffled[j] = temp
  }
  return shuffled
}

export function pickRandom<T>(array: T[], count: number): T[] {
  return shuffleArray(array).slice(0, Math.min(count, array.length))
}

export function generateUniqueNames(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}_${i + 1}`)
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
  const minutes = Math.floor(ms / 60000)
  const seconds = ((ms % 60000) / 1000).toFixed(1)
  return `${minutes}m ${seconds}s`
}
