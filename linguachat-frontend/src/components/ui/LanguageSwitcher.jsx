import { useApp } from '../../context/AppContext'
import { getLanguageOption } from '../../services/language'
import { SUPPORTED_LOCALES } from '../../i18n/translations'

/*
 * The manual override `docs/product/language-detection-contract.md` requires
 * "before/inside login/onboarding": automatic detection can pick wrong (an
 * unsupported device preference, a shared/borrowed device, a traveller who
 * wants their own language anyway), so a learner must be able to fix it
 * immediately, without first creating an account. Only the locales
 * LinguaChat can honestly serve end to end are offered — the same
 * `SUPPORTED_LOCALES` the interface loader ships — never the full 46-row
 * aspirational picker `LanguageIdentity` shows post-login.
 */
export function LanguageSwitcher({ compact = false }) {
  const { nativeLanguageInfo, setNativeLanguage, t } = useApp()
  const options = SUPPORTED_LOCALES.map((code) => getLanguageOption(code))

  return (
    <select
      value={nativeLanguageInfo.base}
      onChange={(event) => setNativeLanguage(event.target.value)}
      aria-label={t('selectLanguage')}
      className="transition-all hover:opacity-90"
      style={{
        height: compact ? 32 : 38,
        borderRadius: 999,
        padding: '0 10px',
        background: 'var(--surface-soft)',
        border: '1px solid var(--border)',
        color: 'var(--ink)',
        fontSize: '0.8125rem',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {options.map((option) => (
        <option key={option.code} value={option.code}>
          {option.nativeName}
        </option>
      ))}
    </select>
  )
}
