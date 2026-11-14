import { Page, Card } from '@/components/Page'
import { SegmentedControl } from '@/components/SegmentedControl'
import { useT } from '@/hooks/useT'
import { usePrefs, type ThemePref } from '@/store/prefs'
import type { Lang } from '@/lib/i18n'
import { DemoDataCard } from './DemoDataCard'
import { BackupCard } from './BackupCard'
import { SecurityCard } from './SecurityCard'
import { AboutCard, CurrencyCard, GoalSettingsCard, InstallCard } from './SettingsCards'

export function SettingsScreen() {
  const { t } = useT()
  const prefs = usePrefs()
  return (
    <Page title={t('settings.title')}>
      <div className="grid items-start gap-4 md:grid-cols-2">
        <Card>
          <h2 className="pb-3 font-extrabold">{t('settings.language')}</h2>
          <SegmentedControl<Lang>
            ariaLabel={t('settings.language')}
            value={prefs.lang}
            onChange={(lang) => prefs.set({ lang })}
            options={[
              { value: 'ru', label: 'Русский' },
              { value: 'en', label: 'English' },
            ]}
          />
        </Card>
        <Card>
          <h2 className="pb-3 font-extrabold">{t('settings.theme')}</h2>
          <SegmentedControl<ThemePref>
            ariaLabel={t('settings.theme')}
            value={prefs.theme}
            onChange={(theme) => prefs.set({ theme })}
            options={[
              { value: 'system', label: t('settings.themeSystem') },
              { value: 'light', label: t('settings.themeLight') },
              { value: 'dark', label: t('settings.themeDark') },
            ]}
          />
        </Card>
        <CurrencyCard />
        <GoalSettingsCard />
        <BackupCard />
        <SecurityCard />
        <InstallCard />
        <DemoDataCard />
        <AboutCard />
      </div>
    </Page>
  )
}
