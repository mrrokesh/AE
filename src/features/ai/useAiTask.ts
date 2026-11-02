import { useEffect, useState } from 'react'
import { ask, type AiTask } from '@/services/ai'
import type { AiInputs, AiOutputs } from '@/services/ai/aiClient'

interface Result<T> {
  key: string
  data?: T
  error?: boolean
}

/** Runs one AI task whenever `key` changes (or `rerun` is called). Input is read at run time. */
export function useAiTask<T extends AiTask>(
  task: T,
  input: AiInputs[T],
  key: string,
  enabled = true,
) {
  const [nonce, setNonce] = useState(0)
  const [res, setRes] = useState<Result<AiOutputs[T]> | null>(null)
  const runKey = `${task}|${key}|${nonce}`

  useEffect(() => {
    if (!enabled) return
    let live = true
    ask({ task, input })
      .then((r) => live && setRes({ key: runKey, data: r.output }))
      .catch(() => live && setRes({ key: runKey, error: true }))
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey, enabled])

  const current = res?.key === runKey ? res : null
  return {
    data: current?.data,
    error: !!current?.error,
    loading: enabled && !current,
    rerun: () => setNonce((n) => n + 1),
  }
}
