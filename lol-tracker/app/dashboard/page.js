'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatTime, localDateStr } from '@/lib/utils'

function computeStats(allSessions) {
  const now = new Date()
  const todayStr = localDateStr(now)

  const dayOfWeek = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  const mondayStr = localDateStr(monday)

  const firstOfMonthStr = localDateStr(new Date(now.getFullYear(), now.getMonth(), 1))

  let todayMinutes = 0
  let weekMinutes = 0
  let monthMinutes = 0
  let longestSession = 0
  const dateSet = new Set()

  for (const s of allSessions) {
    const mins = s.hours * 60 + s.minutes
    if (s.session_date === todayStr) todayMinutes += mins
    if (s.session_date >= mondayStr) weekMinutes += mins
    if (s.session_date >= firstOfMonthStr) monthMinutes += mins
    if (mins > longestSession) longestSession = mins
    dateSet.add(s.session_date)
  }

  // If no session today yet, start streak from yesterday so it doesn't drop to 0 before first play
  const streakStart = new Date(now)
  if (!dateSet.has(todayStr)) streakStart.setDate(streakStart.getDate() - 1)
  const streakIncludesToday = dateSet.has(todayStr)

  let streak = 0
  const checkDate = new Date(streakStart)
  while (dateSet.has(localDateStr(checkDate))) {
    streak++
    checkDate.setDate(checkDate.getDate() - 1)
  }

  const totalMinutes = allSessions.reduce((sum, s) => sum + s.hours * 60 + s.minutes, 0)
  const avgMinutes = dateSet.size > 0 ? Math.round(totalMinutes / dateSet.size) : 0

  return { todayMinutes, weekMinutes, monthMinutes, longestSession, streak, avgMinutes, streakIncludesToday }
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [allSessions, setAllSessions] = useState([])
  const [todaySessions, setTodaySessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [stats, setStats] = useState(null)

  const today = localDateStr()

  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [notes, setNotes] = useState('')
  const [sessionDate, setSessionDate] = useState(today)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [editError, setEditError] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  const [editHours, setEditHours] = useState(0)
  const [editMinutes, setEditMinutes] = useState(0)
  const [editNotes, setEditNotes] = useState('')
  const [editDate, setEditDate] = useState('')

  const fetchSessions = useCallback(async () => {
    if (!user) return
    setSessionsLoading(true)
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('session_date', { ascending: false })

    if (!error && data) {
      setAllSessions(data)
      setTodaySessions(data.filter((s) => s.session_date === today))
      setStats(computeStats(data))
    }
    setSessionsLoading(false)
  }, [user, today])

  useEffect(() => {
    if (user) fetchSessions()
  }, [user, fetchSessions])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (Number(hours) === 0 && Number(minutes) === 0) {
      setFormError('Please enter at least 1 minute.')
      return
    }
    setSubmitting(true)
    setFormError(null)

    const { error } = await supabase.from('sessions').insert({
      user_id: user.id,
      hours: Number(hours),
      minutes: Number(minutes),
      notes: notes || null,
      session_date: sessionDate,
    })

    if (error) {
      setFormError(error.message)
    } else {
      setHours(0)
      setMinutes(0)
      setNotes('')
      setSessionDate(today)
      await fetchSessions()
    }
    setSubmitting(false)
  }

  function startEdit(session) {
    setEditingId(session.id)
    setEditHours(session.hours)
    setEditMinutes(session.minutes)
    setEditNotes(session.notes || '')
    setEditDate(session.session_date)
    setEditError(null)
  }

  async function handleEdit(id) {
    if (Number(editHours) === 0 && Number(editMinutes) === 0) {
      setEditError('Please enter at least 1 minute.')
      return
    }
    setEditError(null)
    const { error } = await supabase
      .from('sessions')
      .update({
        hours: Number(editHours),
        minutes: Number(editMinutes),
        notes: editNotes || null,
        session_date: editDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      setEditError(error.message)
    } else {
      setEditingId(null)
      fetchSessions()
    }
  }

  async function handleDelete(id) {
    setDeleteError(null)
    const { error } = await supabase.from('sessions').delete().eq('id', id)
    if (error) {
      setDeleteError(error.message)
    } else {
      fetchSessions()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-amber-400">Gaming Time Tracker</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{user?.email}</span>
            <Link
              href="/calendar"
              className="text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded-lg"
            >
              Calendar
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded-lg"
            >
              Log out
            </button>
          </div>
        </div>

        {stats && allSessions.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Today</p>
              <p className="text-xl font-bold text-white">{formatTime(stats.todayMinutes)}</p>
            </div>
            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">This Week</p>
              <p className="text-xl font-bold text-white">{formatTime(stats.weekMinutes)}</p>
            </div>
            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">This Month</p>
              <p className="text-xl font-bold text-white">{formatTime(stats.monthMinutes)}</p>
            </div>
            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Streak</p>
              <p className="text-xl font-bold text-white">{stats.streak} {stats.streak === 1 ? 'day' : 'days'}</p>
              {stats.streak > 0 && !stats.streakIncludesToday && (
                <p className="text-xs text-orange-400 mt-1">Play today to keep it!</p>
              )}
            </div>
            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Daily Average</p>
              <p className="text-xl font-bold text-white">{formatTime(stats.avgMinutes)}</p>
            </div>
            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Longest Session</p>
              <p className="text-xl font-bold text-white">{formatTime(stats.longestSession)}</p>
            </div>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-white">Log a Session</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1 text-gray-300">Hours</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={(e) => {
                    const val = Math.min(24, Math.max(0, Number(e.target.value)))
                    setHours(val)
                    if (val === 24) setMinutes(0)
                  }}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1 text-gray-300">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max={Number(hours) === 24 ? 0 : 59}
                  value={minutes}
                  onChange={(e) => setMinutes(Math.min(Number(hours) === 24 ? 0 : 59, Math.max(0, Number(e.target.value))))}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1 text-gray-300">Date</label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="What did you play?"
                className="w-full bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>
            {formError && <p className="text-red-400 text-sm">{formError}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="bg-teal-600 text-white rounded-lg py-2 font-medium hover:bg-teal-500 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Log Session'}
            </button>
          </form>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 text-white">Today&apos;s Sessions</h2>
          {deleteError && <p className="text-red-400 text-sm mb-3">{deleteError}</p>}
          {sessionsLoading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : todaySessions.length === 0 ? (
            <p className="text-gray-400 text-sm">No sessions logged today yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {todaySessions.map((session) =>
                editingId === session.id ? (
                  <li key={session.id} className="border border-gray-600 rounded-lg p-4 flex flex-col gap-3 bg-gray-700">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1 text-gray-300">Hours</label>
                        <input
                          type="number"
                          min="0"
                          max="24"
                          value={editHours}
                          onChange={(e) => {
                            const val = Math.min(24, Math.max(0, Number(e.target.value)))
                            setEditHours(val)
                            if (val === 24) setEditMinutes(0)
                          }}
                          className="w-full bg-gray-600 border border-gray-500 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1 text-gray-300">Minutes</label>
                        <input
                          type="number"
                          min="0"
                          max={Number(editHours) === 24 ? 0 : 59}
                          value={editMinutes}
                          onChange={(e) => setEditMinutes(Math.min(Number(editHours) === 24 ? 0 : 59, Math.max(0, Number(e.target.value))))}
                          className="w-full bg-gray-600 border border-gray-500 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1 text-gray-300">Date</label>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full bg-gray-600 border border-gray-500 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={2}
                      placeholder="Notes (optional)"
                      className="w-full bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    />
                    {editError && <p className="text-red-400 text-sm">{editError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(session.id)}
                        className="bg-teal-600 text-white text-sm px-3 py-1 rounded-lg hover:bg-teal-500"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditError(null) }}
                        className="bg-gray-600 text-gray-200 text-sm px-3 py-1 rounded-lg hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </li>
                ) : (
                  <li
                    key={session.id}
                    className="border border-gray-600 rounded-lg p-4 flex justify-between items-start bg-gray-700"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {session.hours}h {session.minutes}m
                      </p>
                      {session.notes && (
                        <p className="text-sm text-gray-400 mt-1">{session.notes}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">{session.session_date}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(session)}
                        className="text-sm text-teal-400 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(session.id)}
                        className="text-sm text-red-400 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                )
              )}
            </ul>
          )}
        </div>

      </div>
    </div>
  )
}
