import { useState } from 'react'
import { Database, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/PageHeader'
import { Button, Card, Input, Modal, Skeleton, Switch, Tabs } from '@/components/ui'
import { useDemoData } from '@/features/demo/useDemoData'
import { useSettingsStore } from '@/store/settingsStore'
import { useUiStore, type Language, type Theme } from '@/store/uiStore'

const clamp = (v: string, min: number, max: number) =>
  Math.min(max, Math.max(min, Number(v) || min))

export default function Settings() {
  const { t } = useTranslation()
  const { theme, setTheme, language, setLanguage } = useUiStore()
  const settings = useSettingsStore()
  const { counts, resetting, reset } = useDemoData()
  const [confirm, setConfirm] = useState(false)

  const themes = (['light', 'dark', 'system'] as Theme[]).map((id) => ({
    id,
    label: t(`theme.${id}`),
  }))
  const langs = (['en', 'ta'] as Language[]).map((id) => ({ id, label: t(`language.${id}`) }))

  return (
    <>
      <PageHeader title={t('settings.title')} description={t('settings.description')} />
      <div className="max-w-2xl space-y-4">
        <Card className="space-y-4 p-5">
          <h2 className="text-sm font-semibold">{t('settings.appearance')}</h2>
          <div className="flex flex-wrap items-center gap-4">
            <Tabs items={themes} value={theme} onChange={setTheme} />
            <Tabs items={langs} value={language} onChange={setLanguage} />
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="text-sm font-semibold">{t('settings.alerts')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('settings.slaMinutes')}
              hint={t('settings.slaHint')}
              type="number"
              min={1}
              max={240}
              value={settings.slaMinutes}
              onChange={(e) => settings.set({ slaMinutes: clamp(e.target.value, 1, 240) })}
            />
            <Input
              label={t('settings.escalationMinutes')}
              hint={t('settings.escalationHint')}
              type="number"
              min={5}
              max={1440}
              value={settings.escalationMinutes}
              onChange={(e) => settings.set({ escalationMinutes: clamp(e.target.value, 5, 1440) })}
            />
          </div>
          <Switch
            label={t('settings.simulate')}
            hint={t('settings.simulateHint')}
            checked={settings.simulateEnquiries}
            onChange={(v) => settings.set({ simulateEnquiries: v })}
          />
          <Switch
            label={t('settings.sound')}
            hint={t('settings.soundHint')}
            checked={settings.soundOn}
            onChange={(v) => settings.set({ soundOn: v })}
          />
        </Card>

        <Card className="p-5">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
            <Database className="size-4" /> {t('settings.demoData')}
          </h2>
          <p className="mb-4 text-sm text-fg-muted">{t('settings.demoHint')}</p>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(['leads', 'products', 'customers', 'users'] as const).map((k) => (
              <div key={k} className="rounded-md bg-surface-2 p-3">
                <p className="text-xs text-fg-muted">{t(`settings.counts.${k}`)}</p>
                {counts ? (
                  <p className="text-lg font-semibold">{counts[k]}</p>
                ) : (
                  <Skeleton className="mt-1 h-6 w-10" />
                )}
              </div>
            ))}
          </div>
          <Button variant="danger" onClick={() => setConfirm(true)} loading={resetting}>
            <RotateCcw className="size-4" /> {t('settings.reset')}
          </Button>
        </Card>
      </div>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={t('settings.resetTitle')}
        description={t('settings.resetText')}
        size="sm"
      >
        <div className="flex justify-end gap-2">
          <Button onClick={() => setConfirm(false)}>{t('common.cancel')}</Button>
          <Button
            variant="danger"
            onClick={() => {
              setConfirm(false)
              void reset()
            }}
          >
            {t('settings.resetConfirm')}
          </Button>
        </div>
      </Modal>
    </>
  )
}
