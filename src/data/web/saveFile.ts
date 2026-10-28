// Hands a file to the user. On phones the share sheet is the reliable route
// (save to Files, send in WhatsApp, AirDrop); elsewhere a normal download.

export type SaveResult = 'shared' | 'downloaded' | 'cancelled'

export async function saveFile(text: string, fileName: string, type = 'application/json'): Promise<SaveResult> {
  const file = new File([text], fileName, { type })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: fileName })
      return 'shared'
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled'
      // Fall through to a download when sharing fails for another reason.
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'downloaded'
}
