'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { formatTime, localDateStr } from '@/lib/utils'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getIntensityClass(minutes) {
  if (minutes === 0) return 'bg-lol-panel-light text-lol-text-muted'
  if (minutes <= 30) return 'bg-[#062830] text-lol-teal-dim'
  if (minutes <= 60) return 'bg-[#073D47] text-lol-teal-dim'
  if (minutes <= 120) return 'bg-[#095A6B] text-lol-crystal-blue'
  if (minutes <= 180) return 'bg-lol-teal-dim text-lol-dark-navy'
  return 'bg-lol-teal-primary text-lol-dark-navy'
}

function buildCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  let startDow = firstDay.getDay()
  startDow = startDow === 0 ? 6 : startDow - 1

  const days = []
  for (let i = 0; i < startDow; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d)
  while (days.length % 7 !== 0) days.push(null)

  return days
}

export default function CalendarPage() {
  const { user, loading } = useAuth()

  const now = new Date()
  const todayStr = localDateStr(now)

  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [minutesByDate, setMinutesByDate] = useState({})
  const [sessionsByDate, setSessionsByDate] = useState({})
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)

  const fetchSessions = useCallback(async () => {
    if (!user) return
    setSessionsLoading(true)
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('session_date', { ascending: false })

    if (!error && data) {
      const mins = {}
      const byDate = {}
      for (const s of data) {
        const key = s.session_date
        mins[key] = (mins[key] || 0) + s.hours * 60 + s.minutes
        if (!byDate[key]) byDate[key] = []
        byDate[key].push(s)
      }
      setMinutesByDate(mins)
      setSessionsByDate(byDate)
    }
    setSessionsLoading(false)
  }, [user])

  useEffect(() => {
    if (user) fetchSessions()
  }, [user, fetchSessions])

  function prevMonth() {
    setSelectedDate(null)
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }

  function nextMonth() {
    setSelectedDate(null)
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString('default', { month: 'long' })
  const calendarDays = buildCalendarGrid(viewYear, viewMonth)

  if (loading) {
    return (
      <div className="min-h-screen bg-lol-dark-navy p-8">
        <div className="max-w-2xl mx-auto">
          <div className="skeleton-shimmer rounded-[2px] h-10 mb-6 border border-lol-border-gold" />
          <div className="skeleton-shimmer rounded-[2px] border border-lol-border-gold h-80 mb-4" />
          <div className="skeleton-shimmer rounded-[2px] border border-lol-border-gold h-8" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-lol-dark-navy p-8">
      <div className="max-w-2xl mx-auto">

        <div className="flex justify-between items-center pb-5 mb-6 border-b border-lol-border-gold">
          <h1 className="text-2xl font-bold text-lol-gold-primary tracking-widest uppercase">
            League Of Legends Playtime Tracker
          </h1>
          <Link
            href="/dashboard"
            className="text-sm bg-lol-panel-light hover:bg-lol-panel-mid text-lol-text-primary px-3 py-1 rounded-[2px] border border-lol-border-gold"
          >
            Dashboard
          </Link>
        </div>

        <div className="bg-lol-panel-gradient rounded-[2px] shadow-lol-card border border-lol-border-gold p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={prevMonth}
              className="text-lol-text-secondary hover:text-lol-gold-light px-2 py-1 rounded-[2px] hover:bg-lol-panel-light border border-lol-border-gold"
            >
              ← Prev
            </button>
            <h2 className="text-lg font-semibold text-lol-gold-light tracking-wide uppercase">
              {monthName} {viewYear}
            </h2>
            <button
              onClick={nextMonth}
              className="text-lol-text-secondary hover:text-lol-gold-light px-2 py-1 rounded-[2px] hover:bg-lol-panel-light border border-lol-border-gold"
            >
              Next →
            </button>
          </div>

          {sessionsLoading ? (
            <div role="status" aria-label="Loading calendar">
              <div className="grid grid-cols-7 mb-1">
                {DAY_LABELS.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-lol-text-secondary py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {[...Array(35)].map((_, i) => (
                  <div key={i} className="skeleton-shimmer aspect-square rounded-[2px]" />
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-7 mb-1">
                {DAY_LABELS.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-lol-text-secondary py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  if (day === null) return <div key={`empty-${i}`} />

                  const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const mins = minutesByDate[dateStr] || 0
                  const isSelected = selectedDate === dateStr
                  const isToday = dateStr === todayStr

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                      className={`
                        aspect-square rounded-[2px] flex flex-col items-center justify-center text-xs cursor-pointer transition-opacity hover:opacity-75
                        ${getIntensityClass(mins)}
                        ${isToday ? 'ring-2 ring-lol-teal-primary font-bold' : ''}
                        ${isSelected && !isToday ? 'ring-2 ring-lol-gold-primary ring-offset-1 ring-offset-lol-panel-dark' : ''}
                        ${isSelected && isToday ? 'ring-2 ring-lol-teal-primary ring-offset-1 ring-offset-lol-panel-dark' : ''}
                      `}
                    >
                      <span>{day}</span>
                      {mins > 0 && (
                        <span className="text-[10px] leading-tight opacity-80">
                          {formatTime(mins)}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 items-center text-xs text-lol-text-secondary mb-6 px-1">
          <span className="font-medium">Activity:</span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-[2px] bg-lol-panel-light inline-block border border-lol-border-gold" /> None
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-[2px] bg-[#062830] inline-block" /> 1–30m
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-[2px] bg-[#073D47] inline-block" /> 31–60m
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-[2px] bg-[#095A6B] inline-block" /> 1–2h
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-[2px] bg-lol-teal-dim inline-block" /> 2–3h
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-[2px] bg-lol-teal-primary inline-block" /> 3h+
          </span>
        </div>

        {selectedDate && (
          <div className="bg-lol-panel-gradient rounded-[2px] shadow-lol-card border border-lol-border-gold p-6">
            <h2 className="text-lg font-semibold mb-4 text-lol-gold-light">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('default', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </h2>
            {sessionsByDate[selectedDate] ? (
              <ul className="flex flex-col gap-3">
                {sessionsByDate[selectedDate].map((s) => (
                  <li key={s.id} className="border border-lol-border-gold rounded-[2px] p-3 bg-lol-panel-light">
                    <p className="font-medium text-lol-gold-light">
                      {s.hours}h {s.minutes}m
                      {s.game_mode && (
                        <span className="ml-2 text-lol-teal-primary text-sm font-normal">{s.game_mode}</span>
                      )}
                    </p>
                    {s.champion && (
                      <p className="text-sm text-lol-text-secondary mt-0.5">Champion: {s.champion}</p>
                    )}
                    {(s.wins != null || s.losses != null) && (
                      <p className="text-sm mt-0.5">
                        {s.wins != null && <span className="text-lol-teal-primary">{s.wins}W</span>}
                        {s.wins != null && s.losses != null && <span className="text-lol-text-muted mx-1">·</span>}
                        {s.losses != null && <span className="text-lol-red-accent">{s.losses}L</span>}
                      </p>
                    )}
                    {s.notes && (
                      <p className="text-sm text-lol-text-secondary mt-1">{s.notes}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-lol-text-secondary text-sm">No sessions logged on this day.</p>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
