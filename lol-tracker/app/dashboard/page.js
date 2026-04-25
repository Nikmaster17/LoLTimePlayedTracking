'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatTime, localDateStr } from '@/lib/utils'
import { CHAMPIONS, normalizeChampion } from '@/lib/champions'

const GAME_MODES =['Ranked Solo/Duo', 'Ranked Flex', 'Normal Draft', 'ARAM', 'Arena', 'TFT', 'Other']

function GoalBar({ label, current, goalMinutes }) {
  if (!goalMinutes) return null
  const pct = Math.min(100, Math.round((current / goalMinutes) * 100))
  return (
    <div>
      <div className="flex justify-between text-xs text-lol-text-secondary mb-1">
        <span>{label}</span>
        <span>{formatTime(current)} / {formatTime(goalMinutes)} ({pct}%)</span>
      </div>
      <div className="h-2 bg-lol-panel-light rounded-[2px] overflow-hidden">
        <div className="h-full bg-lol-teal-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

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
  let totalWins = 0
  let totalLosses = 0
  const dateSet = new Set()

  for (const s of allSessions) {
    const mins = s.hours * 60 + s.minutes
    if (s.session_date === todayStr) todayMinutes += mins
    if (s.session_date >= mondayStr) weekMinutes += mins
    if (s.session_date >= firstOfMonthStr) monthMinutes += mins
    if (mins > longestSession) longestSession = mins
    dateSet.add(s.session_date)
    if (s.wins) totalWins += s.wins
    if (s.losses) totalLosses += s.losses
  }

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

  const totalGames = totalWins + totalLosses
  const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : null

  return { todayMinutes, weekMinutes, monthMinutes, longestSession, streak, avgMinutes, streakIncludesToday, totalWins, totalLosses, winRate }
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
  const [gameMode, setGameMode] = useState('')
  const [champion, setChampion] = useState('')
  const [wins, setWins] = useState('')
  const [losses, setLosses] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [editError, setEditError] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  const [editHours, setEditHours] = useState(0)
  const [editMinutes, setEditMinutes] = useState(0)
  const [editNotes, setEditNotes] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editGameMode, setEditGameMode] = useState('')
  const [editChampion, setEditChampion] = useState('')
  const [editWins, setEditWins] = useState('')
  const [editLosses, setEditLosses] = useState('')

  const [goals, setGoals] = useState(null)
  const [editingGoals, setEditingGoals] = useState(false)
  const [goalWeekHours, setGoalWeekHours] = useState('')
  const [goalMonthHours, setGoalMonthHours] = useState('')
  const [goalsSubmitting, setGoalsSubmitting] = useState(false)

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

  const fetchGoals = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (data) setGoals(data)
  }, [user])

  useEffect(() => {
    if (user) {
      fetchSessions()
      fetchGoals()
    }
  }, [user, fetchSessions, fetchGoals])

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
      game_mode: gameMode || null,
      champion: champion.trim() || null,
      wins: wins !== '' ? Number(wins) : null,
      losses: losses !== '' ? Number(losses) : null,
    })

    if (error) {
      setFormError(error.message)
    } else {
      setHours(0)
      setMinutes(0)
      setNotes('')
      setSessionDate(today)
      setGameMode('')
      setChampion('')
      setWins('')
      setLosses('')
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
    setEditGameMode(session.game_mode || '')
    setEditChampion(session.champion || '')
    setEditWins(session.wins != null ? String(session.wins) : '')
    setEditLosses(session.losses != null ? String(session.losses) : '')
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
        game_mode: editGameMode || null,
        champion: editChampion.trim() || null,
        wins: editWins !== '' ? Number(editWins) : null,
        losses: editLosses !== '' ? Number(editLosses) : null,
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

  async function handleGoalSubmit(e) {
    e.preventDefault()
    setGoalsSubmitting(true)
    const { error } = await supabase.from('goals').upsert({
      user_id: user.id,
      weekly_minutes: goalWeekHours !== '' ? Math.round(Number(goalWeekHours) * 60) : 0,
      monthly_minutes: goalMonthHours !== '' ? Math.round(Number(goalMonthHours) * 60) : 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    if (!error) {
      await fetchGoals()
      setEditingGoals(false)
    }
    setGoalsSubmitting(false)
  }

  function openGoalEdit() {
    setGoalWeekHours(goals ? String(Math.round(goals.weekly_minutes / 60 * 10) / 10) : '')
    setGoalMonthHours(goals ? String(Math.round(goals.monthly_minutes / 60 * 10) / 10) : '')
    setEditingGoals(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-lol-dark-navy p-8">
        <div className="max-w-2xl mx-auto">
          <div className="skeleton-shimmer rounded-[2px] h-10 mb-6 border border-lol-border-gold" />
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-shimmer rounded-[2px] border border-lol-border-gold h-20" />
            ))}
          </div>
          <div className="skeleton-shimmer rounded-[2px] border border-lol-border-gold h-52 mb-6" />
          <div className="skeleton-shimmer rounded-[2px] border border-lol-border-gold h-36" />
        </div>
      </div>
    )
  }

  const hasGoals = goals && (goals.weekly_minutes > 0 || goals.monthly_minutes > 0)

  return (
    <div className="min-h-screen bg-lol-dark-navy p-8">
      <div className="max-w-2xl mx-auto">

        <div className="flex justify-between items-center pb-5 mb-6 border-b border-lol-border-gold">
          <h1 className="text-2xl font-bold text-lol-gold-primary tracking-widest uppercase">
            League Of Legends Playtime Tracker
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-lol-text-secondary">{user?.email}</span>
            <Link
              href="/history"
              className="text-sm bg-lol-panel-light hover:bg-lol-panel-mid text-lol-text-primary px-3 py-1 rounded-[2px] border border-lol-border-gold"
            >
              History
            </Link>
            <Link
              href="/calendar"
              className="text-sm bg-lol-panel-light hover:bg-lol-panel-mid text-lol-text-primary px-3 py-1 rounded-[2px] border border-lol-border-gold"
            >
              Calendar
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm bg-lol-panel-light hover:bg-lol-panel-mid text-lol-text-primary px-3 py-1 rounded-[2px] border border-lol-border-gold"
            >
              Log out
            </button>
          </div>
        </div>

        {sessionsLoading ? (
          <div className="grid grid-cols-3 gap-4 mb-6" role="status" aria-label="Loading stats">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-shimmer rounded-[2px] border border-lol-border-gold h-20" />
            ))}
          </div>
        ) : allSessions.length === 0 ? (
          <div className="bg-lol-panel-gradient rounded-[2px] shadow-lol-card border border-lol-border-gold p-8 mb-6 text-center">
            <p className="text-lol-gold-light font-semibold text-lg mb-2 tracking-wide uppercase">Your Journey Begins Here</p>
            <p className="text-lol-text-secondary text-sm">Log your first session below to start tracking your progress.</p>
          </div>
        ) : stats ? (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-lol-panel-gradient rounded-[2px] shadow-lol-card border border-lol-border-gold p-4 text-center">
              <p className="text-xs text-lol-text-secondary mb-1">Today</p>
              <p className="text-xl font-bold text-lol-gold-light">{formatTime(stats.todayMinutes)}</p>
            </div>
            <div className="bg-lol-panel-gradient rounded-[2px] shadow-lol-card border border-lol-border-gold p-4 text-center">
              <p className="text-xs text-lol-text-secondary mb-1">This Week</p>
              <p className="text-xl font-bold text-lol-gold-light">{formatTime(stats.weekMinutes)}</p>
            </div>
            <div className="bg-lol-panel-gradient rounded-[2px] shadow-lol-card border border-lol-border-gold p-4 text-center">
              <p className="text-xs text-lol-text-secondary mb-1">This Month</p>
              <p className="text-xl font-bold text-lol-gold-light">{formatTime(stats.monthMinutes)}</p>
            </div>
            <div className="bg-lol-panel-gradient rounded-[2px] shadow-lol-card border border-lol-border-gold p-4 text-center">
              <p className="text-xs text-lol-text-secondary mb-1">Streak</p>
              <p className="text-xl font-bold text-lol-gold-light">{stats.streak} {stats.streak === 1 ? 'day' : 'days'}</p>
              {stats.streak > 0 && !stats.streakIncludesToday && (
                <p className="text-xs text-lol-gold-primary mt-1">Play today to keep it!</p>
              )}
            </div>
            <div className="bg-lol-panel-gradient rounded-[2px] shadow-lol-card border border-lol-border-gold p-4 text-center">
              <p className="text-xs text-lol-text-secondary mb-1">Daily Average</p>
              <p className="text-xl font-bold text-lol-gold-light">{formatTime(stats.avgMinutes)}</p>
            </div>
            <div className="bg-lol-panel-gradient rounded-[2px] shadow-lol-card border border-lol-border-gold p-4 text-center">
              <p className="text-xs text-lol-text-secondary mb-1">Longest Session</p>
              <p className="text-xl font-bold text-lol-gold-light">{formatTime(stats.longestSession)}</p>
            </div>
            {stats.winRate !== null && (
              <div className="col-span-3 bg-lol-panel-gradient rounded-[2px] shadow-lol-card border border-lol-border-gold p-4 text-center">
                <p className="text-xs text-lol-text-secondary mb-1">Win Rate</p>
                <p className="text-xl font-bold text-lol-gold-light">{stats.winRate}%</p>
                <p className="text-xs text-lol-text-muted mt-1">
                  <span className="text-lol-teal-primary">{stats.totalWins}W</span>
                  <span className="mx-1">·</span>
                  <span className="text-lol-red-accent">{stats.totalLosses}L</span>
                </p>
              </div>
            )}
          </div>
        ) : null}

        {!sessionsLoading && (
          <div className="bg-lol-panel-gradient rounded-[2px] shadow-lol-card border border-lol-border-gold p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-lol-gold-light tracking-wide uppercase">Goals</h2>
              {!editingGoals && (
                <button onClick={openGoalEdit} className="text-sm text-lol-teal-primary hover:underline">
                  {hasGoals ? 'Edit' : 'Set Goals'}
                </button>
              )}
            </div>
            {editingGoals ? (
              <form onSubmit={handleGoalSubmit} className="flex flex-col gap-3">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1 text-lol-text-primary">Weekly Goal (hours)</label>
                    <input
                      type="number"
                      min="0"
                      max="168"
                      step="0.5"
                      value={goalWeekHours}
                      onChange={(e) => setGoalWeekHours(e.target.value === '' ? '' : String(Math.min(168, Math.max(0, Number(e.target.value)))))}
                      placeholder="e.g. 10"
                      className="w-full bg-lol-panel-light border border-lol-border-gold text-lol-text-primary rounded-[2px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lol-teal-primary"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1 text-lol-text-primary">Monthly Goal (hours)</label>
                    <input
                      type="number"
                      min="0"
                      max="672"
                      step="0.5"
                      value={goalMonthHours}
                      onChange={(e) => setGoalMonthHours(e.target.value === '' ? '' : String(Math.min(672, Math.max(0, Number(e.target.value)))))}
                      placeholder="e.g. 40"
                      className="w-full bg-lol-panel-light border border-lol-border-gold text-lol-text-primary rounded-[2px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lol-teal-primary"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={goalsSubmitting}
                    className="bg-lol-teal-primary text-lol-dark-navy text-sm px-4 py-1 rounded-[2px] transition-shadow hover:shadow-lol-teal-glow disabled:opacity-50"
                  >
                    {goalsSubmitting ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingGoals(false)}
                    className="bg-lol-panel-mid text-lol-text-primary text-sm px-4 py-1 rounded-[2px] hover:bg-lol-panel-light"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : hasGoals && stats ? (
              <div className="flex flex-col gap-3">
                {goals.weekly_minutes > 0 && (
                  <GoalBar label="This Week" current={stats.weekMinutes} goalMinutes={goals.weekly_minutes} />
                )}
                {goals.monthly_minutes > 0 && (
                  <GoalBar label="This Month" current={stats.monthMinutes} goalMinutes={goals.monthly_minutes} />
                )}
              </div>
            ) : (
              <p className="text-lol-text-secondary text-sm">No goals set. Set a weekly or monthly playtime goal to track your progress.</p>
            )}
          </div>
        )}

        <div className="bg-lol-panel-gradient rounded-[2px] shadow-lol-card border border-lol-border-gold p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-lol-gold-light tracking-wide uppercase">Log a Session</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1 text-lol-text-primary">Hours</label>
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
                  className="w-full bg-lol-panel-light border border-lol-border-gold text-lol-text-primary rounded-[2px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lol-teal-primary"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1 text-lol-text-primary">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max={Number(hours) === 24 ? 0 : 59}
                  value={minutes}
                  onChange={(e) => setMinutes(Math.min(Number(hours) === 24 ? 0 : 59, Math.max(0, Number(e.target.value))))}
                  className="w-full bg-lol-panel-light border border-lol-border-gold text-lol-text-primary rounded-[2px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lol-teal-primary"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1 text-lol-text-primary">Date</label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full bg-lol-panel-light border border-lol-border-gold text-lol-text-primary rounded-[2px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lol-teal-primary"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1 text-lol-text-primary">Game Mode</label>
                <select
                  value={gameMode}
                  onChange={(e) => setGameMode(e.target.value)}
                  className="w-full bg-lol-panel-light border border-lol-border-gold text-lol-text-primary rounded-[2px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lol-teal-primary"
                >
                  <option value="">— Select —</option>
                  {GAME_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1 text-lol-text-primary">Champion</label>
                <input
                  type="text"
                  list="champion-list"
                  value={champion}
                  onChange={(e) => setChampion(e.target.value)}
                  onBlur={(e) => setChampion(normalizeChampion(e.target.value))}
                  placeholder="e.g. Jinx"
                  className="w-full bg-lol-panel-light border border-lol-border-gold text-lol-text-primary placeholder-lol-text-muted rounded-[2px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lol-teal-primary"
                />
              </div>
            </div>
            <datalist id="champion-list">
              {CHAMPIONS.map((c) => <option key={c} value={c} />)}
            </datalist>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1 text-lol-text-primary">Wins</label>
                <input
                  type="number"
                  min="0"
                  value={wins}
                  onChange={(e) => setWins(e.target.value)}
                  placeholder="0"
                  className="w-full bg-lol-panel-light border border-lol-border-gold text-lol-text-primary placeholder-lol-text-muted rounded-[2px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lol-teal-primary"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1 text-lol-text-primary">Losses</label>
                <input
                  type="number"
                  min="0"
                  value={losses}
                  onChange={(e) => setLosses(e.target.value)}
                  placeholder="0"
                  className="w-full bg-lol-panel-light border border-lol-border-gold text-lol-text-primary placeholder-lol-text-muted rounded-[2px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lol-teal-primary"
                />
              </div>
              <div className="flex-1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-lol-text-primary">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Any notes about this session?"
                className="w-full bg-lol-panel-light border border-lol-border-gold text-lol-text-primary placeholder-lol-text-muted rounded-[2px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lol-teal-primary resize-none"
              />
            </div>
            {formError && (
              <div role="alert" className="bg-lol-red-accent/10 border border-lol-red-accent rounded-[2px] px-3 py-2 text-lol-red-accent text-sm">
                {formError}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="bg-lol-teal-primary text-lol-dark-navy rounded-[2px] py-2 font-medium transition-shadow hover:shadow-lol-teal-glow disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Log Session'}
            </button>
          </form>
        </div>

        <div className="bg-lol-panel-gradient rounded-[2px] shadow-lol-card border border-lol-border-gold p-6">
          <h2 className="text-lg font-semibold mb-4 text-lol-gold-light tracking-wide uppercase">
            Today&apos;s Sessions
          </h2>
          {deleteError && (
            <div role="alert" className="bg-lol-red-accent/10 border border-lol-red-accent rounded-[2px] px-3 py-2 text-lol-red-accent text-sm mb-3">
              {deleteError}
            </div>
          )}
          {sessionsLoading ? (
            <div className="flex flex-col gap-3" role="status" aria-label="Loading sessions">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="skeleton-shimmer rounded-[2px] border border-lol-border-gold h-16" />
              ))}
            </div>
          ) : todaySessions.length === 0 ? (
            <p className="text-lol-text-secondary text-sm">No sessions logged today yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {todaySessions.map((session) =>
                editingId === session.id ? (
                  <li key={session.id} className="border border-lol-border-gold rounded-[2px] p-4 flex flex-col gap-3 bg-lol-panel-light">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1 text-lol-text-primary">Hours</label>
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
                          className="w-full bg-lol-panel-mid border border-lol-border-gold text-lol-text-primary rounded-[2px] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-lol-teal-primary"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1 text-lol-text-primary">Minutes</label>
                        <input
                          type="number"
                          min="0"
                          max={Number(editHours) === 24 ? 0 : 59}
                          value={editMinutes}
                          onChange={(e) => setEditMinutes(Math.min(Number(editHours) === 24 ? 0 : 59, Math.max(0, Number(e.target.value))))}
                          className="w-full bg-lol-panel-mid border border-lol-border-gold text-lol-text-primary rounded-[2px] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-lol-teal-primary"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1 text-lol-text-primary">Date</label>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full bg-lol-panel-mid border border-lol-border-gold text-lol-text-primary rounded-[2px] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-lol-teal-primary"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1 text-lol-text-primary">Game Mode</label>
                        <select
                          value={editGameMode}
                          onChange={(e) => setEditGameMode(e.target.value)}
                          className="w-full bg-lol-panel-mid border border-lol-border-gold text-lol-text-primary rounded-[2px] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-lol-teal-primary"
                        >
                          <option value="">— Select —</option>
                          {GAME_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1 text-lol-text-primary">Champion</label>
                        <input
                          type="text"
                          list="champion-list"
                          value={editChampion}
                          onChange={(e) => setEditChampion(e.target.value)}
                          onBlur={(e) => setEditChampion(normalizeChampion(e.target.value))}
                          placeholder="e.g. Jinx"
                          className="w-full bg-lol-panel-mid border border-lol-border-gold text-lol-text-primary placeholder-lol-text-muted rounded-[2px] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-lol-teal-primary"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1 text-lol-text-primary">Wins</label>
                        <input
                          type="number"
                          min="0"
                          value={editWins}
                          onChange={(e) => setEditWins(e.target.value)}
                          placeholder="0"
                          className="w-full bg-lol-panel-mid border border-lol-border-gold text-lol-text-primary placeholder-lol-text-muted rounded-[2px] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-lol-teal-primary"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1 text-lol-text-primary">Losses</label>
                        <input
                          type="number"
                          min="0"
                          value={editLosses}
                          onChange={(e) => setEditLosses(e.target.value)}
                          placeholder="0"
                          className="w-full bg-lol-panel-mid border border-lol-border-gold text-lol-text-primary placeholder-lol-text-muted rounded-[2px] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-lol-teal-primary"
                        />
                      </div>
                      <div className="flex-1" />
                    </div>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={2}
                      placeholder="Notes (optional)"
                      className="w-full bg-lol-panel-mid border border-lol-border-gold text-lol-text-primary placeholder-lol-text-muted rounded-[2px] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-lol-teal-primary resize-none"
                    />
                    {editError && (
                      <div role="alert" className="bg-lol-red-accent/10 border border-lol-red-accent rounded-[2px] px-3 py-2 text-lol-red-accent text-sm">
                        {editError}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(session.id)}
                        className="bg-lol-teal-primary text-lol-dark-navy text-sm px-3 py-1 rounded-[2px] transition-shadow hover:shadow-lol-teal-glow"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditError(null) }}
                        className="bg-lol-panel-mid text-lol-text-primary text-sm px-3 py-1 rounded-[2px] hover:bg-lol-panel-light"
                      >
                        Cancel
                      </button>
                    </div>
                  </li>
                ) : (
                  <li
                    key={session.id}
                    className="border border-lol-border-gold rounded-[2px] p-4 flex justify-between items-start bg-lol-panel-light"
                  >
                    <div>
                      <p className="font-medium text-lol-gold-light">
                        {session.hours}h {session.minutes}m
                        {session.game_mode && (
                          <span className="ml-2 text-lol-teal-primary text-sm font-normal">{session.game_mode}</span>
                        )}
                      </p>
                      {session.champion && (
                        <p className="text-sm text-lol-text-secondary mt-0.5">Champion: {session.champion}</p>
                      )}
                      {(session.wins != null || session.losses != null) && (
                        <p className="text-sm mt-0.5">
                          {session.wins != null && <span className="text-lol-teal-primary">{session.wins}W</span>}
                          {session.wins != null && session.losses != null && <span className="text-lol-text-muted mx-1">·</span>}
                          {session.losses != null && <span className="text-lol-red-accent">{session.losses}L</span>}
                        </p>
                      )}
                      {session.notes && (
                        <p className="text-sm text-lol-text-secondary mt-1">{session.notes}</p>
                      )}
                      <p className="text-xs text-lol-text-muted mt-1">{session.session_date}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(session)}
                        className="text-sm text-lol-teal-primary hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(session.id)}
                        className="text-sm text-lol-red-accent hover:underline"
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
