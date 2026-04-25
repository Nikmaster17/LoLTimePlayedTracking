'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { formatTime, localDateStr } from '@/lib/utils'
import { CHAMPIONS, normalizeChampion } from '@/lib/champions'

const PAGE_SIZE = 20
const GAME_MODES =['Ranked Solo/Duo', 'Ranked Flex', 'Normal Draft', 'ARAM', 'Arena', 'TFT', 'Other']

export default function HistoryPage() {
  const { user, loading } = useAuth()

  const [allSessions, setAllSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [modeFilter, setModeFilter] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [editHours, setEditHours] = useState(0)
  const [editMinutes, setEditMinutes] = useState(0)
  const [editNotes, setEditNotes] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editGameMode, setEditGameMode] = useState('')
  const [editChampion, setEditChampion] = useState('')
  const [editWins, setEditWins] = useState('')
  const [editLosses, setEditLosses] = useState('')
  const [editError, setEditError] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  const fetchSessions = useCallback(async () => {
    if (!user) return
    setSessionsLoading(true)
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('session_date', { ascending: false })

    if (!error && data) setAllSessions(data)
    setSessionsLoading(false)
  }, [user])

  useEffect(() => {
    if (user) fetchSessions()
  }, [user, fetchSessions])

  useEffect(() => {
    setPage(0)
  }, [modeFilter])

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

  const filtered = modeFilter
    ? allSessions.filter((s) => s.game_mode === modeFilter)
    : allSessions

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  if (loading) {
    return (
      <div className="min-h-screen bg-lol-dark-navy p-8">
        <div className="max-w-2xl mx-auto">
          <div className="skeleton-shimmer rounded-[2px] h-10 mb-6 border border-lol-border-gold" />
          <div className="skeleton-shimmer rounded-[2px] h-10 mb-4 border border-lol-border-gold" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton-shimmer rounded-[2px] border border-lol-border-gold h-16 mb-2" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-lol-dark-navy p-8">
      <div className="max-w-2xl mx-auto">

        <div className="flex justify-between items-center pb-5 mb-6 border-b border-lol-border-gold">
          <h1 className="text-2xl font-bold text-lol-gold-primary tracking-widest uppercase">
            Session History
          </h1>
          <Link
            href="/dashboard"
            className="text-sm bg-lol-panel-light hover:bg-lol-panel-mid text-lol-text-primary px-3 py-1 rounded-[2px] border border-lol-border-gold"
          >
            Dashboard
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setModeFilter('')}
            className={`text-xs px-3 py-1 rounded-[2px] border transition-colors ${
              modeFilter === ''
                ? 'bg-lol-teal-primary text-lol-dark-navy border-lol-teal-primary font-medium'
                : 'bg-lol-panel-light text-lol-text-secondary border-lol-border-gold hover:text-lol-text-primary'
            }`}
          >
            All
          </button>
          {GAME_MODES.map((m) => (
            <button
              key={m}
              onClick={() => setModeFilter(m)}
              className={`text-xs px-3 py-1 rounded-[2px] border transition-colors ${
                modeFilter === m
                  ? 'bg-lol-teal-primary text-lol-dark-navy border-lol-teal-primary font-medium'
                  : 'bg-lol-panel-light text-lol-text-secondary border-lol-border-gold hover:text-lol-text-primary'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {deleteError && (
          <div role="alert" className="bg-lol-red-accent/10 border border-lol-red-accent rounded-[2px] px-3 py-2 text-lol-red-accent text-sm mb-4">
            {deleteError}
          </div>
        )}

        <div className="bg-lol-panel-gradient rounded-[2px] shadow-lol-card border border-lol-border-gold p-6">
          {sessionsLoading ? (
            <div className="flex flex-col gap-3" role="status" aria-label="Loading sessions">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton-shimmer rounded-[2px] border border-lol-border-gold h-16" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-lol-text-secondary text-sm">
              {modeFilter ? `No sessions found for "${modeFilter}".` : 'No sessions logged yet.'}
            </p>
          ) : (
            <>
              <p className="text-xs text-lol-text-muted mb-4">
                {filtered.length} session{filtered.length !== 1 ? 's' : ''}
                {modeFilter ? ` · ${modeFilter}` : ''}
              </p>
              <ul className="flex flex-col gap-3">
                {paginated.map((session) =>
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
                      <datalist id="champion-list">
                        {CHAMPIONS.map((c) => <option key={c} value={c} />)}
                      </datalist>
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
                      <div className="flex gap-2 shrink-0">
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

              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-lol-border-gold">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 0}
                    className="text-sm text-lol-text-secondary hover:text-lol-gold-light px-3 py-1 rounded-[2px] border border-lol-border-gold hover:bg-lol-panel-light disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs text-lol-text-muted">
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages - 1}
                    className="text-sm text-lol-text-secondary hover:text-lol-gold-light px-3 py-1 rounded-[2px] border border-lol-border-gold hover:bg-lol-panel-light disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  )
}
