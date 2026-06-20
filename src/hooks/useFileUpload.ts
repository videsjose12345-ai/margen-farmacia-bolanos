import { useRef, useCallback } from 'react'
import { parseExcelFile } from '../lib/excelParser'
import type { AnalysisFile } from '../types'

interface UseFileUploadOptions {
  onSuccess: (parsed: AnalysisFile) => void
  onError:   (msg: string) => void
  onStart?:  () => void
  onEnd?:    () => void
}

export function useFileUpload({ onSuccess, onError, onStart, onEnd }: UseFileUploadOptions) {
  const inputRef = useRef<HTMLInputElement>(null)

  const trigger = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    onStart?.()
    try {
      const parsed = await parseExcelFile(file)
      onSuccess(parsed)
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err))
    } finally {
      onEnd?.()
    }
  }, [onSuccess, onError, onStart, onEnd])

  return { inputRef, trigger, handleChange }
}
