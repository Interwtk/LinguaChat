import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { offeredCourses } from '../../learning/courses/registry.js'

/*
 * "What are you learning?" — the course the learner studies, separate from the
 * language the app speaks to them in. Shown only when there is a real choice:
 * a learner whose language no other course is explained in sees nothing,
 * rather than a Spanish option that would arrive in English.
 *
 * Switching keeps each course's progress; the confirmation line says so.
 */
const COURSE_NAME_KEY = { en: 'courseNameEnglish', es: 'courseNameSpanish' }

export function CourseSwitcher({ compact = false }) {
  const { t, activeCourse, chooseCourse, nativeLanguageInfo } = useApp()
  const [failed, setFailed] = useState(false)
  const courses = offeredCourses(nativeLanguageInfo)
  if (courses.length < 2) return null

  return (
    <section aria-labelledby="course-switcher-label" className={compact ? 'mb-4' : 'rounded-2xl p-4 mb-4 animate-fade-up'}
      style={compact ? undefined : { background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <p id="course-switcher-label" style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>{t('courseSwitcherLabel')}</p>
      <div role="radiogroup" aria-labelledby="course-switcher-label" className="flex gap-2 flex-wrap">
        {courses.map(id => {
          const selected = id === activeCourse
          return (
            <button key={id} type="button" role="radio" aria-checked={selected}
              onClick={() => { if (!selected) setFailed(chooseCourse(id) !== true) }}
              className="rounded-full px-4 py-2 text-sm font-bold transition-all active:scale-[0.98]"
              style={{
                minHeight: 40,
                background: selected ? 'var(--accent)' : 'var(--surface-soft)',
                color: selected ? '#fff' : 'var(--ink)',
                border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
              }}>
              {t(COURSE_NAME_KEY[id])}
              {id === 'es' && <span style={{ marginInlineStart: 6, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.85 }}>{t('courseNewBadge')}</span>}
            </button>
          )
        })}
      </div>
      <p style={{ fontSize: 12, color: failed ? 'var(--accent-strong)' : 'var(--muted)', marginTop: 8, lineHeight: 1.45 }} role={failed ? 'alert' : undefined}>
        {failed ? t('courseSwitchFailed') : t('courseSwitchKeepsProgress')}
      </p>
    </section>
  )
}
