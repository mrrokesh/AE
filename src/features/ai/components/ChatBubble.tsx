import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import type { ChatMsg } from '../useChat'
import { Typewriter } from './Typewriter'

const MARK = /\[\[lead:([^|\]]+)\|([^\]]+)\]\]/g

/** Renders `[[lead:ID|Name]]` markers as links. Assistant text types in only for plain replies. */
function Rich({ text }: { text: string }) {
  const parts: React.ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(MARK)) {
    parts.push(text.slice(last, m.index))
    parts.push(
      <Link key={m.index} to={`/leads/${m[1]}`} className="font-medium text-brand-600 underline">
        {m[2]}
      </Link>,
    )
    last = m.index + m[0].length
  }
  parts.push(text.slice(last))
  return <span className="whitespace-pre-wrap">{parts}</span>
}

export function ChatBubble({ msg }: { msg: ChatMsg }) {
  const mine = msg.role === 'user'
  const hasLinks = msg.text.includes('[[lead:')
  return (
    <div className={cn('flex', mine && 'justify-end')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm',
          mine ? 'bg-brand-600 text-white' : 'bg-surface-2',
        )}
      >
        {mine || hasLinks ? <Rich text={msg.text} /> : <Typewriter text={msg.text} />}
      </div>
    </div>
  )
}
