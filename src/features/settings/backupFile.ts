/** Getting a backup file out of the app: share sheet on phones/tablets, download elsewhere. */
export type SaveOutcome = 'shared' | 'downloaded' | 'cancelled'

export async function saveTextFile(text: string, name: string, title: string): Promise<SaveOutcome> {
  const file = new File([text], name, { type: 'application/json' })
  const touch = matchMedia('(pointer: coarse)').matches
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title })
      return 'shared'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
      // Some browsers refuse share() outside very specific gestures: fall back to a download.
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'downloaded'
}
