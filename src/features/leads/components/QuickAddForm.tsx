import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardPaste, Sparkles, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge, Button, Input, Textarea } from '@/components/ui'
import { StageBadge } from '@/components/StageBadge'
import { LEAD_SOURCES, type SourceId } from '@/constants'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { formatDateTime, tomorrowAt11 } from '@/lib/dates'
import { cn } from '@/lib/cn'
import { ask } from '@/services/ai'
import { useCrmStore } from '@/store/crmStore'
import { useNow } from '@/store/clockStore'
import { toast } from '@/store/toastStore'
import { createLead } from '../actions'
import { leadName } from '../format'
import { findDuplicate, normalizePhone } from '../phone'
import { FollowUpPicker } from './FollowUpPicker'
import { ProductPicker } from './ProductPicker'
import { openLogActivity } from '../openers'

interface Extra {
  city?: string
  quantity?: number
  budget?: number | null
  urgent?: boolean
  message?: string
}

/** Fast capture: only the phone number is required. Detects duplicates and can prefill from pasted text. */
export function QuickAddForm({ onDone }: { onDone: () => void }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const user = useCurrentUser()
  const { leads, products, users } = useCrmStore()
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [source, setSource] = useState<SourceId>('phone')
  const [productIds, setProductIds] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [followUp, setFollowUp] = useState<string | null>(tomorrowAt11().toISOString())
  const [extra, setExtra] = useState<Extra>({})
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parsedNote, setParsedNote] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const now = useNow()
  const normalized = normalizePhone(phone)
  const dup = useMemo(() => findDuplicate(phone, leads), [phone, leads])
  const canSave = !!normalized && !dup && !!followUp && Date.parse(followUp) > now - 60_000

  const parse = async () => {
    if (!pasteText.trim()) return
    setParsing(true)
    try {
      const { output: p } = await ask({
        task: 'parseLeadFromText',
        input: { text: pasteText, products, lang: i18n.language === 'ta' ? 'ta' : 'en' },
      })
      if (p.phone) setPhone(p.phone)
      if (p.name) setName(p.name)
      setSource(p.source)
      if (p.productIds.length) setProductIds(p.productIds)
      setNote((n) => n || p.notes)
      setExtra({
        city: p.city,
        quantity: p.quantity ?? undefined,
        budget: p.budget,
        urgent: p.urgent,
        message: p.notes,
      })
      setParsedNote(
        t(`quickAdd.detected.${p.detected}`) + (p.phone ? '' : ` · ${t('quickAdd.noPhoneFound')}`),
      )
      toast.info(t('quickAdd.parsed'))
    } catch {
      toast.error(t('errors.generic'))
    } finally {
      setParsing(false)
    }
  }

  const save = async () => {
    if (!user || !canSave || !normalized || !followUp) return
    setSaving(true)
    try {
      await createLead(
        {
          name,
          phone: normalized,
          source,
          productInterest: productIds,
          note,
          followUpAt: followUp,
          ...extra,
        },
        user,
      )
      toast.success(
        t('quickAdd.saved'),
        t('quickAdd.savedText', { when: formatDateTime(followUp) }),
      )
      onDone()
    } catch {
      toast.error(t('errors.generic'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        void save()
      }}
    >
      <Input
        label={t('quickAdd.phone')}
        type="tel"
        inputMode="numeric"
        autoFocus
        placeholder="98420 12345"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        error={
          phone && !normalized && phone.replace(/\D/g, '').length >= 10
            ? t('quickAdd.phoneInvalid')
            : undefined
        }
      />

      {dup && (
        <div
          role="alert"
          className="space-y-2 rounded-lg border border-warning/50 bg-warning/10 p-3"
        >
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <TriangleAlert className="size-4 text-warning" />
            {t('quickAdd.dup.title')}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">{leadName(dup)}</span>
            <StageBadge stage={dup.stage} />
            <span className="text-fg-muted">
              {dup.assignedTo
                ? t('quickAdd.dup.with', {
                    name: users.find((u) => u.id === dup.assignedTo)?.name ?? '—',
                  })
                : t('common.unassigned')}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onDone()
                openLogActivity(dup.id)
              }}
            >
              {t('quickAdd.dup.addActivity')}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onDone()
                navigate(`/leads/${dup.id}`)
              }}
            >
              {t('quickAdd.dup.open')}
            </Button>
          </div>
        </div>
      )}

      <Input
        label={`${t('quickAdd.name')} (${t('common.optional')})`}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="space-y-1">
        <span className="text-xs font-medium text-fg-muted">{t('quickAdd.source')}</span>
        <div className="grid grid-cols-4 gap-1.5">
          {LEAD_SOURCES.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={source === s.id}
              onClick={() => setSource(s.id)}
              className={cn(
                'h-9 rounded-md border px-1 text-xs font-medium sm:text-sm',
                source === s.id
                  ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300'
                  : 'border-border text-fg-muted hover:bg-surface-2',
              )}
            >
              {t(`sources.${s.id}`)}
            </button>
          ))}
        </div>
      </div>

      <ProductPicker
        label={t('quickAdd.products')}
        products={products}
        value={productIds}
        onChange={setProductIds}
      />
      <Textarea
        label={t('quickAdd.notes')}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
      />
      <FollowUpPicker value={followUp} onChange={setFollowUp} label={t('quickAdd.followUp')} />

      <div className="rounded-lg border border-dashed border-border p-3">
        <button
          type="button"
          onClick={() => setPasteOpen((o) => !o)}
          className="flex w-full items-center gap-2 text-sm font-medium text-fg-muted hover:text-fg"
        >
          <ClipboardPaste className="size-4" /> {t('quickAdd.pasteToggle')}
        </button>
        {pasteOpen && (
          <div className="mt-3 space-y-2">
            <Textarea
              aria-label={t('quickAdd.pasteToggle')}
              placeholder={t('quickAdd.pastePlaceholder')}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={4}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => void parse()}
                loading={parsing}
                disabled={!pasteText.trim()}
              >
                <Sparkles className="size-4" />
                {parsing ? t('quickAdd.parsing') : t('quickAdd.parse')}
              </Button>
              {parsedNote && <Badge tone="brand">{parsedNote}</Badge>}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="hidden text-xs text-fg-subtle sm:block">{t('quickAdd.shortcutHint')}</span>
        <div className="ml-auto flex gap-2">
          <Button onClick={onDone}>{t('common.cancel')}</Button>
          <Button type="submit" variant="primary" disabled={!canSave} loading={saving}>
            {t('common.save')}
          </Button>
        </div>
      </div>
    </form>
  )
}
