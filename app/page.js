'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const CURRENT_MONTH = MONTHS[new Date().getMonth()]
const CURRENT_YEAR  = new Date().getFullYear()

const TYPE_META = {
  annual:     { label: '★ Annual',    pts: 2, badge: 'bg-amber-900 text-amber-300 border-amber-700' },
  beer_blast: { label: '🍺 Beer Blast', pts: 1, badge: 'bg-blue-900  text-blue-300  border-blue-700'  },
  bike_night: { label: '🏍️ Bike Night', pts: 1, badge: 'bg-sky-900   text-sky-300   border-sky-700'   },
}

// ─── Utility ──────────────────────────────────────────────────────────────────
function calcPoints(memberId, events, attendance) {
  let total = 0, annual = 0, regular = 0
  for (const evt of events) {
    if (attendance.some(a => a.member_id === memberId && a.event_id === evt.id)) {
      const p = evt.event_type === 'annual' ? 2 : 1
      total += p
      evt.event_type === 'annual' ? (annual += p) : (regular += p)
    }
  }
  return { total, annual, regular }
}

// ─── Root Component ───────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed]         = useState(false)
  const [tab, setTab]               = useState('leaderboard')
  const [members, setMembers]       = useState([])
  const [events, setEvents]         = useState([])
  const [attendance, setAtt]        = useState([])
  const [loading, setLoading]       = useState(true)
  const [selEvt, setSelEvt]         = useState(null)
  const [form, setForm]             = useState({ name: '', month: CURRENT_MONTH, type: 'annual' })
  const [saving, setSaving]         = useState(false)
  const [memberName, setMemberName] = useState('')
  const [savingMember, setSavingM]  = useState(false)
  const [pendingDel, setPendingDel] = useState(null)

  useEffect(() => {
    if (sessionStorage.getItem('rr_admin') === '1') setAuthed(true)
  }, [])

  const signOut = () => {
    sessionStorage.removeItem('rr_admin')
    setAuthed(false)
  }

  if (!authed) return <LoginScreen onLogin={() => { sessionStorage.setItem('rr_admin', '1'); setAuthed(true) }} />

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: m }, { data: e }, { data: a }] = await Promise.all([
      supabase.from('members').select('*').order('name'),
      supabase.from('events').select('*').order('created_at'),
      supabase.from('attendance').select('*'),
    ])
    setMembers(m || [])
    setEvents(e  || [])
    setAtt(a     || [])
    if (e?.length && !selEvt) setSelEvt(e[0].id)
    setLoading(false)
  }, [])               // eslint-disable-line

  useEffect(() => { load() }, [load])

  // Add event
  const addEvent = async () => {
    if (!form.name.trim() || saving) return
    setSaving(true)
    const { data, error } = await supabase
      .from('events')
      .insert({ name: form.name.trim(), month: form.month, event_type: form.type })
      .select().single()
    if (!error && data) {
      setEvents(p => [...p, data])
      setSelEvt(data.id)
      setForm(p => ({ ...p, name: '' }))
    }
    setSaving(false)
  }

  // Delete event
  const deleteEvent = async id => {
    await supabase.from('events').delete().eq('id', id)
    setEvents(p => p.filter(e => e.id !== id))
    setAtt(p => p.filter(a => a.event_id !== id))
    if (selEvt === id) {
      const next = events.find(e => e.id !== id)
      setSelEvt(next?.id || null)
    }
  }

  // Add member
  const addMember = async () => {
    if (!memberName.trim() || savingMember) return
    setSavingM(true)
    const { data, error } = await supabase
      .from('members')
      .insert({ name: memberName.trim() })
      .select().single()
    if (!error && data) {
      setMembers(p => [...p, data].sort((a, b) => a.name.localeCompare(b.name)))
      setMemberName('')
    }
    setSavingM(false)
  }

  // Delete member (cascades attendance via FK)
  const deleteMember = async id => {
    await supabase.from('members').delete().eq('id', id)
    setMembers(p => p.filter(m => m.id !== id))
    setAtt(p => p.filter(a => a.member_id !== id))
    setPendingDel(null)
  }

  // Toggle attendance
  const toggle = async (memberId, eventId) => {
    const hit = attendance.find(a => a.member_id === memberId && a.event_id === eventId)
    if (hit) {
      await supabase.from('attendance').delete().eq('id', hit.id)
      setAtt(p => p.filter(a => a.id !== hit.id))
    } else {
      const { data } = await supabase
        .from('attendance')
        .insert({ member_id: memberId, event_id: eventId })
        .select().single()
      if (data) setAtt(p => [...p, data])
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center space-y-3">
        <div className="text-5xl">🏍️</div>
        <div className="text-red-500 font-bold text-xl">Loading...</div>
        <div className="text-gray-500 text-sm">Pittsburgh Ruff Ryders</div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-md mx-auto">

      {/* ── Header ── */}
      <header className="bg-red-700 px-4 pt-4 pb-3 shadow-xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏍️</span>
          <div className="flex-1">
            <h1 className="font-black text-lg leading-tight tracking-wide">Pittsburgh Ruff Ryders</h1>
            <p className="text-red-200 text-xs">Attendance Tracker · 2026</p>
          </div>
          <button
            onClick={signOut}
            className="text-red-200 hover:text-white text-xs font-medium
                       border border-red-500 hover:border-red-300
                       px-3 py-1.5 rounded-lg transition-colors active:scale-95"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto pb-20">
        {tab === 'leaderboard' && (
          <Leaderboard members={members} events={events} attendance={attendance} />
        )}
        {tab === 'events' && (
          <Events
            events={events} form={form} setForm={setForm}
            addEvent={addEvent} deleteEvent={deleteEvent} saving={saving}
          />
        )}
        {tab === 'attendance' && (
          <Attendance
            events={events} members={members} attendance={attendance}
            selEvt={selEvt} setSelEvt={setSelEvt} toggle={toggle}
          />
        )}
        {tab === 'members' && (
          <Members
            members={members}
            memberName={memberName} setMemberName={setMemberName}
            addMember={addMember} savingMember={savingMember}
            deleteMember={deleteMember}
            pendingDel={pendingDel} setPendingDel={setPendingDel}
          />
        )}
      </main>

      {/* ── Bottom Nav ── */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md
                      bg-gray-900 border-t border-gray-800 flex z-20 shadow-2xl">
        {[
          { id: 'leaderboard', icon: '🏆', label: 'Leaderboard' },
          { id: 'events',      icon: '📅', label: 'Events'      },
          { id: 'attendance',  icon: '✅', label: 'Attendance'  },
          { id: 'members',     icon: '👥', label: 'Members'     },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-3 flex flex-col items-center gap-0.5 transition-colors active:scale-95
              ${tab === t.id ? 'text-red-500' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <span className="text-xl leading-none">{t.icon}</span>
            <span className="text-xs font-medium">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

// ─── Leaderboard Tab ──────────────────────────────────────────────────────────
function Leaderboard({ members, events, attendance }) {
  const [monthFilter, setMonthFilter] = useState(CURRENT_MONTH)

  const activeMonths = MONTHS.filter(mo => events.some(e => e.month === mo))

  const visibleEvents = monthFilter === 'All Time'
    ? events
    : events.filter(e => e.month === monthFilter)

  const leaderboard = [...members]
    .map(m => ({ ...m, ...calcPoints(m.id, visibleEvents, attendance) }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))

  const medals      = ['🥇', '🥈', '🥉']
  const max         = leaderboard[0]?.total || 1
  const annualCount = visibleEvents.filter(e => e.event_type === 'annual').length
  const blastCount  = visibleEvents.filter(e => e.event_type !== 'annual').length
  const isAllTime   = monthFilter === 'All Time'

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold">
          {isAllTime ? 'All-Time Standings' : `${monthFilter} ${CURRENT_YEAR} Standings`}
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          {isAllTime
            ? 'Cumulative points across all months'
            : `Points reset each month · ${visibleEvents.length} event${visibleEvents.length !== 1 ? 's' : ''} this month`}
        </p>
      </div>

      {/* Month filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {[...activeMonths, 'All Time'].map(mo => (
          <button
            key={mo}
            onClick={() => setMonthFilter(mo)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors
              ${monthFilter === mo
                ? 'bg-red-600 text-white'
                : mo === 'All Time'
                  ? 'bg-gray-800 text-gray-500 hover:text-white border border-gray-700'
                  : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'}`}
          >
            {mo === CURRENT_MONTH ? `${mo} ·  Now` : mo}
          </button>
        ))}
      </div>

      {/* Summary pills */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-amber-950 border border-amber-800 rounded-xl p-3 text-center">
          <div className="text-amber-400 font-black text-2xl">{annualCount}</div>
          <div className="text-amber-600 text-xs mt-0.5">Annual Events · 2 pts each</div>
        </div>
        <div className="bg-blue-950 border border-blue-800 rounded-xl p-3 text-center">
          <div className="text-blue-400 font-black text-2xl">{blastCount}</div>
          <div className="text-blue-600 text-xs mt-0.5">Blast / Bike Nights · 1 pt</div>
        </div>
      </div>

      {members.length === 0 && (
        <p className="text-center text-gray-500 py-8">No members found. Check your database.</p>
      )}

      {members.length > 0 && visibleEvents.length === 0 && (
        <div className="text-center text-gray-500 py-10 space-y-1">
          <div className="text-4xl">📅</div>
          <p className="font-medium">No events in {monthFilter} yet.</p>
          <p className="text-xs">Add events in the Events tab to start tracking points.</p>
        </div>
      )}

      {leaderboard.map((m, i) => (
        <div key={m.id}
          className={`rounded-2xl p-4 flex items-center gap-3 border transition-all
            ${i === 0 ? 'bg-amber-950  border-amber-700' :
              i === 1 ? 'bg-gray-800   border-gray-600'  :
              i === 2 ? 'bg-orange-950 border-orange-700':
                        'bg-gray-900   border-gray-800'  }`}
        >
          {/* Rank */}
          <div className="w-9 text-center flex-shrink-0">
            {i < 3
              ? <span className="text-2xl">{medals[i]}</span>
              : <span className="text-gray-500 font-bold text-sm">{i + 1}</span>}
          </div>

          {/* Name + bar */}
          <div className="flex-1 min-w-0">
            <div className="font-bold truncate leading-tight">{m.name}</div>
            <div className="flex gap-3 mt-1 text-xs">
              {m.annual  > 0 && <span className="text-amber-400">★ {m.annual} annual</span>}
              {m.regular > 0 && <span className="text-blue-400">🍺 {m.regular} blast/night</span>}
              {m.total === 0 && <span className="text-gray-600">No points yet</span>}
            </div>
            <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-700 to-red-500 rounded-full transition-all duration-500"
                style={{ width: `${(m.total / max) * 100}%` }}
              />
            </div>
          </div>

          {/* Score */}
          <div className={`text-3xl font-black w-10 text-center flex-shrink-0
            ${i === 0 ? 'text-amber-400' :
              i === 1 ? 'text-gray-300'  :
              i === 2 ? 'text-orange-400': 'text-white'}`}>
            {m.total}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Events Tab ───────────────────────────────────────────────────────────────
function Events({ events, form, setForm, addEvent, deleteEvent, saving }) {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">Events</h2>

      {/* Add form */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-300">Add New Event</p>

        <input
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && addEvent()}
          placeholder="Event name…"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3
                     text-sm text-white placeholder-gray-500
                     focus:border-red-500 focus:outline-none transition-colors"
        />

        <div className="grid grid-cols-2 gap-2">
          <select
            value={form.month}
            onChange={e => setForm(p => ({ ...p, month: e.target.value }))}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-3
                       text-sm text-white focus:border-red-500 focus:outline-none"
          >
            {MONTHS.map(m => <option key={m}>{m}</option>)}
          </select>

          <select
            value={form.type}
            onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-3
                       text-sm text-white focus:border-red-500 focus:outline-none"
          >
            <option value="annual">Annual — 2 pts</option>
            <option value="beer_blast">Beer Blast — 1 pt</option>
            <option value="bike_night">Bike Night — 1 pt</option>
          </select>
        </div>

        <button
          onClick={addEvent}
          disabled={saving || !form.name.trim()}
          className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800
                     disabled:bg-gray-700 disabled:text-gray-500
                     text-white font-bold py-3 rounded-xl transition-colors text-sm"
        >
          {saving ? 'Adding…' : '+ Add Event'}
        </button>
      </div>

      {/* Event list grouped by month */}
      {events.length === 0 ? (
        <div className="text-center text-gray-500 py-12 space-y-2">
          <div className="text-5xl">📅</div>
          <p>No events yet.</p>
          <p className="text-xs">Add your first event above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {MONTHS.filter(mo => events.some(e => e.month === mo)).map(mo => (
            <div key={mo}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{mo}</span>
                <div className="flex-1 h-px bg-gray-800" />
                <span className="text-xs text-gray-600">{events.filter(e => e.month === mo).length} event{events.filter(e => e.month === mo).length !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-2">
                {events.filter(e => e.month === mo).map(evt => {
                  const meta = TYPE_META[evt.event_type]
                  return (
                    <div key={evt.id}
                      className={`rounded-2xl p-4 flex items-center justify-between border ${meta.badge}`}
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">{evt.name}</div>
                        <div className="text-xs mt-0.5 flex items-center gap-1.5 opacity-80">
                          <span>{meta.label}</span>
                          <span>·</span>
                          <span className="font-bold">{meta.pts} pt{meta.pts > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteEvent(evt.id)}
                        className="text-gray-500 hover:text-red-400 active:scale-90
                                   transition-all p-2 ml-2 flex-shrink-0 text-lg leading-none"
                        aria-label="Delete event"
                      >
                        ×
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Attendance Tab ───────────────────────────────────────────────────────────
function Attendance({ events, members, attendance, selEvt, setSelEvt, toggle }) {
  const [monthFilter, setMonthFilter] = useState(CURRENT_MONTH)

  const activeMonths  = MONTHS.filter(mo => events.some(e => e.month === mo))
  const visibleEvents = monthFilter === 'All' ? events : events.filter(e => e.month === monthFilter)

  const evt      = events.find(e => e.id === selEvt)
  const attCount = attendance.filter(a => a.event_id === selEvt).length
  const isAnnual = evt?.event_type === 'annual'

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">Mark Attendance</h2>

      {events.length === 0 ? (
        <div className="text-center text-gray-500 py-12 space-y-2">
          <div className="text-5xl">📅</div>
          <p>No events yet.</p>
          <p className="text-xs">Go to the Events tab to add one.</p>
        </div>
      ) : (
        <>
          {/* Month filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
            {[...activeMonths, 'All'].map(mo => (
              <button
                key={mo}
                onClick={() => setMonthFilter(mo)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors
                  ${monthFilter === mo
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'}`}
              >
                {mo === CURRENT_MONTH ? `${mo} · Now` : mo}
              </button>
            ))}
          </div>

          {/* Event selector */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block font-medium">Select Event</label>
            <select
              value={selEvt || ''}
              onChange={e => setSelEvt(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3
                         text-white text-sm focus:border-red-500 focus:outline-none"
            >
              {visibleEvents.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name} — {e.month} · {e.event_type === 'annual' ? '2 pts' : '1 pt'}
                </option>
              ))}
            </select>
          </div>

          {/* Event summary banner */}
          {evt && (
            <div className={`rounded-xl p-3 flex items-center justify-between border
              ${isAnnual
                ? 'bg-amber-950 border-amber-800'
                : 'bg-blue-950 border-blue-800'}`}
            >
              <div>
                <span className="font-bold text-white text-sm">{evt.name}</span>
                <span className="text-gray-400 text-xs ml-2">· {evt.month}</span>
              </div>
              <div className={`font-black text-xl ${isAnnual ? 'text-amber-400' : 'text-blue-400'}`}>
                {attCount}<span className="text-xs font-normal text-gray-400">/{members.length}</span>
              </div>
            </div>
          )}

          {/* Member toggles */}
          <div className="space-y-2">
            {members.map(m => {
              const attended = attendance.some(a => a.member_id === m.id && a.event_id === selEvt)
              return (
                <button
                  key={m.id}
                  onClick={() => toggle(m.id, selEvt)}
                  className={`w-full rounded-2xl p-4 flex items-center justify-between
                              transition-all active:scale-[0.98] border
                              ${attended
                                ? 'bg-green-900 border-green-700'
                                : 'bg-gray-900 border-gray-800 hover:border-gray-600'}`}
                >
                  <span className={`font-semibold text-sm ${attended ? 'text-white' : 'text-gray-400'}`}>
                    {m.name}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center
                                   font-bold text-sm flex-shrink-0 transition-all
                                   ${attended
                                     ? 'bg-green-500 text-white shadow-lg shadow-green-900'
                                     : 'bg-gray-800 text-gray-600 border border-gray-700'}`}>
                    {attended ? '✓' : ''}
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Members Tab ──────────────────────────────────────────────────────────────
function Members({ members, memberName, setMemberName, addMember, savingMember, deleteMember, pendingDel, setPendingDel }) {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Members</h2>
        <span className="text-xs text-gray-400">{members.length} member{members.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Add form */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-300">Add New Member</p>
        <input
          value={memberName}
          onChange={e => setMemberName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addMember()}
          placeholder="Member name…"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3
                     text-sm text-white placeholder-gray-500
                     focus:border-red-500 focus:outline-none transition-colors"
        />
        <button
          onClick={addMember}
          disabled={savingMember || !memberName.trim()}
          className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800
                     disabled:bg-gray-700 disabled:text-gray-500
                     text-white font-bold py-3 rounded-xl transition-colors text-sm"
        >
          {savingMember ? 'Adding…' : '+ Add Member'}
        </button>
      </div>

      {/* Member list */}
      <div className="space-y-2">
        {members.map((m, i) => {
          const armed = pendingDel === m.id
          return (
            <div key={m.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3
                         flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-gray-500 text-xs w-5 text-right flex-shrink-0">{i + 1}</span>
                <span className="font-semibold text-sm truncate">{m.name}</span>
              </div>
              {armed ? (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-red-400">Sure?</span>
                  <button
                    onClick={() => deleteMember(m.id)}
                    className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white
                               text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setPendingDel(null)}
                    className="text-gray-500 hover:text-gray-300 text-xs px-2 py-1.5"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setPendingDel(m.id)}
                  className="text-gray-600 hover:text-red-400 active:scale-90
                             transition-all p-2 text-lg leading-none flex-shrink-0"
                  aria-label="Remove member"
                >
                  ×
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [user, setUser]   = useState('')
  const [pass, setPass]   = useState('')
  const [error, setError] = useState(false)
  const [show, setShow]   = useState(false)

  const attempt = () => {
    if (user === 'ADMIN' && pass === 'Pittsburgh2022') {
      onLogin()
    } else {
      setError(true)
      setPass('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="text-6xl">🏍️</div>
          <h1 className="font-black text-2xl tracking-wide">Pittsburgh Ruff Ryders</h1>
          <p className="text-gray-400 text-sm">Admin Access</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          {error && (
            <div className="bg-red-950 border border-red-800 text-red-300 text-sm
                            rounded-xl px-4 py-3 text-center">
              Incorrect username or password.
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-medium">Username</label>
            <input
              value={user}
              onChange={e => { setUser(e.target.value); setError(false) }}
              onKeyDown={e => e.key === 'Enter' && attempt()}
              autoCapitalize="none"
              autoComplete="username"
              placeholder="Username"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3
                         text-sm text-white placeholder-gray-500
                         focus:border-red-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-medium">Password</label>
            <div className="relative">
              <input
                value={pass}
                onChange={e => { setPass(e.target.value); setError(false) }}
                onKeyDown={e => e.key === 'Enter' && attempt()}
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Password"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 pr-12
                           text-sm text-white placeholder-gray-500
                           focus:border-red-500 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500
                           hover:text-gray-300 text-xs transition-colors px-1"
              >
                {show ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            onClick={attempt}
            disabled={!user.trim() || !pass.trim()}
            className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800
                       disabled:bg-gray-700 disabled:text-gray-500
                       text-white font-bold py-3 rounded-xl transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  )
}
