import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { LinguaAvatar } from '../ui/LinguaAvatar'
import { ThemeToggle } from '../ui/ThemeToggle'

function AuthShell({ children, back, onBack }) {
  const { t } = useApp()
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: 'linear-gradient(135deg, var(--violet), var(--blue))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                fill="rgba(255,255,255,0.3)" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--ink)' }}>LinguaChat</span>
        </div>
        <ThemeToggle compact />
      </div>

      {back && (
        <button onClick={onBack} className="flex items-center gap-1.5 mx-5 mt-4 self-start"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', fontWeight: 600, fontSize: '0.875rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          {t('back')}
        </button>
      )}

      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 20px 48px' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>{children}</div>
      </div>
    </div>
  )
}

function AuthInput({ label, type = 'text', value, onChange, placeholder, autoComplete }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink)' }}>{label}</label>
      <input
        type={type} value={value} onChange={onChange}
        placeholder={placeholder} autoComplete={autoComplete}
        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
        style={{ background: 'var(--bg-paper)', border: '1.5px solid var(--border)', color: 'var(--ink)', fontFamily: 'inherit' }}
        onFocus={e => { e.target.style.borderColor = 'var(--violet)' }}
        onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
      />
    </div>
  )
}

function PasswordField({ label, value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink)' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'} value={value} onChange={onChange}
          placeholder={placeholder} autoComplete={autoComplete}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={{ background: 'var(--bg-paper)', border: '1.5px solid var(--border)', color: 'var(--ink)', fontFamily: 'inherit', paddingRight: 44 }}
          onFocus={e => { e.target.style.borderColor = 'var(--violet)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
        />
        <button type="button" onClick={() => setShow(s => !s)}
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', display: 'flex', alignItems: 'center' }}>
          {show
            ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          }
        </button>
      </div>
    </div>
  )
}

function PasswordStrength({ password }) {
  if (!password) return null
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', 'var(--coral)', 'var(--yellow)', 'var(--blue)', 'var(--green)']
  return (
    <div className="flex items-center gap-2 mt-1">
      {[1,2,3,4].map(i => (
        <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: i <= score ? colors[score] : 'var(--border)', transition: 'background 0.3s' }} />
      ))}
      <span style={{ fontSize: 11, fontWeight: 600, color: colors[score] || 'var(--ink-muted)', minWidth: 36 }}>{labels[score]}</span>
    </div>
  )
}

/* ---- Entry Screen ---- */
function EntryScreen() {
  const { setAuthStep, t } = useApp()
  return (
    <AuthShell>
      <div className="flex flex-col items-center text-center animate-fade-up">
        <div style={{ marginBottom: 28 }}><LinguaAvatar size={80} online /></div>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--violet)', marginBottom: 14 }}>
          {t('entryEyebrow')}
        </p>
        <h1 style={{ fontWeight: 900, fontSize: 'clamp(1.75rem, 6vw, 2.25rem)', color: 'var(--ink)', lineHeight: 1.1, marginBottom: 12 }}>
          {t('entryTitle')}<br /><span className="gradient-text">{t('entryTitleAccent')}</span>
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--ink-muted)', lineHeight: 1.6, marginBottom: 36, maxWidth: 320 }}>
          {t('entrySubtitle')}
        </p>
        <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 340 }}>
          <button onClick={() => setAuthStep('signup')}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 hover:-translate-y-px active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, var(--violet), var(--blue))' }}>
            {t('entryStart')}
          </button>
          <button onClick={() => setAuthStep('login')}
            className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all hover:opacity-80 active:scale-[0.98]"
            style={{ background: 'var(--bg-paper)', border: '1.5px solid var(--border)', color: 'var(--ink)' }}>
            {t('entryContinue')}
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 28, lineHeight: 1.6 }}>{t('entryNote')}</p>
      </div>
    </AuthShell>
  )
}

/* ---- Login ---- */
function LoginForm() {
  const { setAuthStep, loginMock, t } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) { setError(t('fillAllFields')); return }
    if (!email.includes('@')) { setError(t('validEmail')); return }
    setLoading(true); setError('')
    await new Promise(r => setTimeout(r, 800))
    loginMock(email.trim())
  }
  return (
    <AuthShell back onBack={() => setAuthStep('entry')}>
      <div className="animate-fade-up">
        <div className="flex items-center gap-3 mb-7">
          <LinguaAvatar size={48} online />
          <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.5 }}>{t('loginBubble')}</p>
          </div>
        </div>
        <h2 style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--ink)', marginBottom: 6 }}>{t('loginTitle')}</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginBottom: 28 }}>{t('loginSubtitle')}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AuthInput label={t('email')} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          <div>
            <PasswordField label={t('password')} value={password} onChange={e => setPassword(e.target.value)} placeholder={t('password')} autoComplete="current-password" />
            <div className="flex justify-end mt-1.5">
              <button type="button" onClick={() => setAuthStep('forgot')}
                style={{ fontSize: '0.8125rem', color: 'var(--violet)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                {t('forgotPassword')}
              </button>
            </div>
          </div>
          {error && <p style={{ fontSize: '0.8125rem', color: 'var(--coral)', fontWeight: 500 }}>{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, var(--violet), var(--blue))', opacity: loading ? 0.7 : 1 }}>
            {loading ? t('oneMoment') : t('loginButton')}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.875rem', color: 'var(--ink-muted)' }}>
          {t('newHere')}{' '}
          <button onClick={() => setAuthStep('signup')} style={{ color: 'var(--violet)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>{t('startJourney')}</button>
        </p>
      </div>
    </AuthShell>
  )
}

/* ---- Signup ---- */
function SignupForm() {
  const { setAuthStep, signupMock, t } = useApp()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password || !confirm) { setError(t('fillAllFields')); return }
    if (!email.includes('@')) { setError(t('validEmail')); return }
    if (password.length < 6) { setError(t('passwordMin')); return }
    if (password !== confirm) { setError(t('passwordMismatch')); return }
    if (!agreed) { setError(t('checkCommitment')); return }
    setLoading(true); setError('')
    await new Promise(r => setTimeout(r, 700))
    signupMock(name.trim(), email.trim())
  }
  return (
    <AuthShell back onBack={() => setAuthStep('entry')}>
      <div className="animate-fade-up">
        <div className="flex items-center gap-3 mb-7">
          <LinguaAvatar size={48} online />
          <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.5 }}>{t('setupBubble')}</p>
          </div>
        </div>
        <h2 style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--ink)', marginBottom: 6 }}>{t('signupTitle')}</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginBottom: 28 }}>{t('signupSubtitle')}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AuthInput label={t('yourName')} value={name} onChange={e => setName(e.target.value)} placeholder={t('namePlaceholder')} autoComplete="given-name" />
          <AuthInput label={t('email')} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          <div>
            <PasswordField label={t('password')} value={password} onChange={e => setPassword(e.target.value)} placeholder={t('password')} autoComplete="new-password" />
            <PasswordStrength password={password} />
          </div>
          <PasswordField label={t('confirmPassword')} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder={t('confirmPassword')} autoComplete="new-password" />
          <label className="flex items-start gap-3 cursor-pointer" style={{ marginTop: 4 }}>
            <div onClick={() => setAgreed(a => !a)} style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
              border: agreed ? '2px solid var(--violet)' : '2px solid var(--border)',
              background: agreed ? 'var(--violet)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', cursor: 'pointer',
            }}>
              {agreed && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
              {t('commitment')}
            </span>
          </label>
          {error && <p style={{ fontSize: '0.8125rem', color: 'var(--coral)', fontWeight: 500 }}>{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, var(--violet), var(--blue))', opacity: loading ? 0.7 : 1 }}>
            {loading ? t('settingUp') : t('createAccount')}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.875rem', color: 'var(--ink-muted)' }}>
          {t('alreadyPracticing')}{' '}
          <button onClick={() => setAuthStep('login')} style={{ color: 'var(--violet)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>{t('signIn')}</button>
        </p>
      </div>
    </AuthShell>
  )
}

/* ---- Forgot Password ---- */
function ForgotPassword() {
  const { setAuthStep, t } = useApp()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.includes('@')) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 900))
    setLoading(false); setSent(true)
  }
  return (
    <AuthShell back onBack={() => setAuthStep('login')}>
      <div className="animate-fade-up">
        {!sent ? (
          <>
            <div className="flex items-center gap-3 mb-7">
              <LinguaAvatar size={48} online />
              <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.5 }}>{t('progressSafe')}</p>
              </div>
            </div>
            <h2 style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--ink)', marginBottom: 6 }}>{t('forgotTitle')}</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginBottom: 28 }}>{t('forgotSubtitle')}</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <AuthInput label={t('email')} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, var(--violet), var(--blue))', opacity: loading ? 0.7 : 1 }}>
                {loading ? t('sending') : t('sendRecovery')}
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center text-center py-8">
            <div style={{ width: 64, height: 64, borderRadius: '50%', marginBottom: 20, background: 'var(--green-soft)', border: '2px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
              </svg>
            </div>
            <h2 style={{ fontWeight: 800, fontSize: '1.375rem', color: 'var(--ink)', marginBottom: 8 }}>{t('recoverySent')}</h2>
            <p style={{ fontSize: '0.9375rem', color: 'var(--ink-muted)', lineHeight: 1.6, marginBottom: 28 }}>{t('recoverySentText')}</p>
            <button onClick={() => setAuthStep('login')}
              className="px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:opacity-80 active:scale-[0.98]"
              style={{ background: 'var(--bg-paper)', border: '1.5px solid var(--border)', color: 'var(--ink)' }}>
              {t('backToSignIn')}
            </button>
          </div>
        )}
      </div>
    </AuthShell>
  )
}

export function AuthFlow() {
  const { authStep } = useApp()
  const screens = {
    entry: <EntryScreen />,
    login: <LoginForm />,
    signup: <SignupForm />,
    forgot: <ForgotPassword />,
  }
  return screens[authStep] || <EntryScreen />
}
