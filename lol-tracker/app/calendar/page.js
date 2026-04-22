'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatTime(totalMinutes) {
  if (totalMinutes === 0) return '—'
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function getIntensityClass(minutes) {
  if (minutes === 0) return 'bg-gray-100 text-gray-400'
  if (minutes <= 30) return 'bg-blue-100 text-blue-800'
  if (minutes <= 60) return 'bg-blue-200 text-blue-800'
  if (minutes <= 120) return 'bg-blue-400 text-white'
  if (minutes <= 180) return 'bg-blue-600 text-white'
  return 'bg-blue-800 text-white'
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
  const todayStr = now.toISOString().split('T')[0]

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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Gaming Time Tracker</h1>
          <Link
            href="/dashboard"
            className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-lg"
          >
            Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={prevMonth}
              className="text-gray-500 hover:text-gray-900 px-2 py-1 rounded-lg hover:bg-gray-100"
            >
              ← Prev
            </button>
            <h2 className="text-lg font-semibold">{monthName} {viewYear}</h2>
            <button
              onClick={nextMonth}
              className="text-gray-500 hover:text-gray-900 px-2 py-1 rounded-lg hover:bg-gray-100"
            >
              Next →
            </button>
          </div>

          {sessionsLoading ? (
            <p className="text-gray-500 text-sm text-center py-8">Loading...</p>
          ) : (
            <div>
              <div className="grid grid-cols-7 mb-1">
                {DAY_LABELS.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">
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
                        aspect-square rounded-lg flex flex-col items-center justify-center text-xs cursor-pointer transition-opacity hover:opacity-75
                        ${getIntensityClass(mins)}
                        ${isToday ? 'ring-2 ring-blue-500 font-bold' : ''}
                        ${isSelected && !isToday ? 'ring-2 ring-blue-300 ring-offset-1' : ''}
                        ${isSelected && isToday ? 'ring-2 ring-blue-600 ring-offset-1' : ''}
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

        <div className="flex flex-wrap gap-3 items-center text-xs text-gray-500 mb-6 px-1">
          <span className="font-medium">Activity:</span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-gray-100 inline-block border border-gray-200" /> None
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-blue-100 inline-block" /> 1–30m
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-blue-200 inline-block" /> 31–60m
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-blue-400 inline-block" /> 1–2h
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-blue-600 inline-block" /> 2–3h
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-blue-800 inline-block" /> 3h+
          </span>
        </div>

        {selectedDate && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
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
                  <li key={s.id} className="border rounded-lg p-3">
                    <p className="font-medium">
                      {s.hours}h {s.minutes}m
                    </p>
                    {s.notes && (
                      <p className="text-sm text-gray-600 mt-1">{s.notes}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No sessions logged on this day.</p>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
