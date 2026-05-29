import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()
const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const ALLOWED_CHAT = process.env.TELEGRAM_CHAT_ID ? Number(process.env.TELEGRAM_CHAT_ID) : null

// --------------- Telegram API helpers ---------------

async function tg(method, body) {
  if (!TOKEN) { console.error('[telegram] TELEGRAM_BOT_TOKEN is not set'); return }
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) console.error('[telegram] tg error', method, await res.text())
}

// --------------- UI builders ---------------

function prListKeyboard(prs) {
  const rows = []
  for (let i = 0; i < prs.length; i += 2) {
    const row = [{ text: prs[i].Event, callback_data: `sel:${prs[i].Event}` }]
    if (prs[i + 1]) row.push({ text: prs[i + 1].Event, callback_data: `sel:${prs[i + 1].Event}` })
    rows.push(row)
  }
  rows.push([{ text: '➕ Add PR', callback_data: 'add' }])
  return { inline_keyboard: rows }
}

function urlUpdateKeyboard(prs) {
  const rows = []
  for (let i = 0; i < prs.length; i += 2) {
    const row = [{ text: prs[i].Event, callback_data: `url_sel:${prs[i].Event}` }]
    if (prs[i + 1]) row.push({ text: prs[i + 1].Event, callback_data: `url_sel:${prs[i + 1].Event}` })
    rows.push(row)
  }
  return { inline_keyboard: rows }
}

function prListText(prs) {
  return prs.length
    ? prs.map(p => `${p.Event} — ${p.Time} (${p.Date})`).join('\n')
    : 'No PRs recorded yet.'
}

// --------------- Redis helpers ---------------

async function getPRs() {
  return (await redis.get('prs')) ?? []
}

async function setPRs(prs) {
  await redis.set('prs', prs)
}

async function getState(chatId) {
  return redis.get(`state:${chatId}`)
}

async function setState(chatId, state) {
  await redis.set(`state:${chatId}`, state, { ex: 300 })
}

async function clearState(chatId) {
  await redis.del(`state:${chatId}`)
}

// --------------- Race day helpers ---------------

function parseTime(str) {
  const parts = str.trim().split(':').map(Number)
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return Infinity
}

function toISO(input) {
  if (input.toLowerCase() === 'today') {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  const parts = input.split('/')
  if (parts.length === 3) {
    const [m, d, y] = parts
    const year = y.length === 2 ? `20${y}` : y
    return `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }
  return input
}

function isoToDisplay(iso) {
  const [y, m, d] = iso.split('-')
  return `${parseInt(m)}/${parseInt(d)}/${String(y).slice(-2)}`
}

async function getRaces() {
  return (await redis.get('races')) ?? []
}

async function setRaces(races) {
  await redis.set('races', races)
}

function raceEventKeyboard(prs, completed) {
  const done = new Set(completed.map(c => c.event))
  const remaining = prs.filter(p => !done.has(p.Event))
  const rows = []
  for (let i = 0; i < remaining.length; i += 2) {
    const row = [{ text: remaining[i].Event, callback_data: `rd_event:${remaining[i].Event}` }]
    if (remaining[i + 1]) row.push({ text: remaining[i + 1].Event, callback_data: `rd_event:${remaining[i + 1].Event}` })
    rows.push(row)
  }
  rows.push([{ text: '➕ Other event', callback_data: 'rd_other' }])
  rows.push([{ text: '✅ Done', callback_data: 'rd_done' }])
  return { inline_keyboard: rows }
}

// --------------- Shared actions ---------------

async function showPRList(chatId) {
  const prs = await getPRs()
  await clearState(chatId)
  await tg('sendMessage', {
    chat_id: chatId,
    text: prListText(prs),
    reply_markup: prListKeyboard(prs),
  })
}

// --------------- Main handler ---------------

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Webhook secret validation
  const secret = req.headers['x-telegram-bot-api-secret-token']
  if (process.env.TELEGRAM_SECRET && secret !== process.env.TELEGRAM_SECRET) {
    return res.status(403).end()
  }

  const update = req.body
  const chatId = update.message?.chat?.id ?? update.callback_query?.from?.id
  if (!chatId) return res.status(200).end()
  if (ALLOWED_CHAT && chatId !== ALLOWED_CHAT) return res.status(200).end()

  // ---- Callback queries (button taps) ----
  if (update.callback_query) {
    const { id: qid, data } = update.callback_query
    await tg('answerCallbackQuery', { callback_query_id: qid })

    if (data === 'back') {
      await showPRList(chatId)

    } else if (data === 'add') {
      await setState(chatId, { action: 'add', step: 'event' })
      await tg('sendMessage', { chat_id: chatId, text: 'Event name? (e.g. 1500m, Mile, 5K)' })

    } else if (data.startsWith('sel:')) {
      const event = data.slice(4)
      const prs = await getPRs()
      const pr = prs.find(p => p.Event === event)
      if (!pr) return res.status(200).end()
      await tg('sendMessage', {
        chat_id: chatId,
        text: `${pr.Event} — ${pr.Time}\n${pr.Date}${pr.Link ? `\n${pr.Link}` : ''}`,
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✏️ Edit', callback_data: `edit:${event}` },
              { text: '🗑️ Delete', callback_data: `del:${event}` },
            ],
            [{ text: '← Back', callback_data: 'back' }],
          ],
        },
      })

    } else if (data.startsWith('edit:')) {
      const event = data.slice(5)
      const prs = await getPRs()
      const pr = prs.find(p => p.Event === event)
      await setState(chatId, { action: 'edit', step: 'time', event, orig: pr })
      await tg('sendMessage', {
        chat_id: chatId,
        text: `Current time: ${pr.Time}\nNew time? (or "same")`,
      })

    } else if (data.startsWith('rd_event:')) {
      const eventName = data.slice(9)
      const rdState = await getState(chatId)
      if (rdState?.action === 'raceday') {
        await setState(chatId, { ...rdState, step: 'time', data: { ...rdState.data, currentEvent: eventName } })
        await tg('sendMessage', { chat_id: chatId, text: `What was your ${eventName} time?` })
      }

    } else if (data.startsWith('url_sel:')) {
      const event = data.slice(8)
      const prs = await getPRs()
      const pr = prs.find(p => p.Event === event)
      if (!pr) return res.status(200).end()
      await setState(chatId, { action: 'urlupdate', step: 'url', event })
      await tg('sendMessage', {
        chat_id: chatId,
        text: `${event}\nCurrent URL: ${pr.Link || '(none)'}\n\nNew URL? (or "remove" to clear)`,
      })

    } else if (data === 'rd_other') {
      const rdState = await getState(chatId)
      if (rdState?.action === 'raceday') {
        await setState(chatId, { ...rdState, step: 'other_name' })
        await tg('sendMessage', { chat_id: chatId, text: 'What event? (e.g. 5K, Mile, 4x800m)' })
      }

    } else if (data === 'rd_done') {
      const rdState = await getState(chatId)
      if (rdState?.action === 'raceday') {
        const { meet, completed } = rdState.data
        const prCount = completed.filter(c => c.prBroken).length
        await clearState(chatId)
        const lines = completed.map(c => `${c.event}: ${c.time}${c.prBroken ? ' 🎉' : ''}`).join('\n')
        const summary = completed.length ? `\n\n${lines}` : ''
        await tg('sendMessage', {
          chat_id: chatId,
          text: `Race day complete at ${meet}! ${prCount > 0 ? `${prCount} PR${prCount > 1 ? 's' : ''} broken.` : 'No PRs broken.'}${summary}`,
        })
      }

    } else if (data.startsWith('del:')) {
      const event = data.slice(4)
      const prs = await getPRs()
      const updated = prs.filter(p => p.Event !== event)
      await setPRs(updated)
      await clearState(chatId)
      await tg('sendMessage', {
        chat_id: chatId,
        text: `Deleted ${event} ✅`,
        reply_markup: prListKeyboard(updated),
      })
    }

    return res.status(200).end()
  }

  // ---- Regular messages ----
  if (update.message) {
    const text = update.message.text?.trim()
    if (!text) return res.status(200).end()

    if (text === '/pr' || text.startsWith('/pr@')) {
      await showPRList(chatId)
      return res.status(200).end()
    }

    if (text === '/urlupdate' || text.startsWith('/urlupdate@')) {
      const prs = await getPRs()
      await clearState(chatId)
      await tg('sendMessage', {
        chat_id: chatId,
        text: 'Which PR result URL do you want to update?',
        reply_markup: urlUpdateKeyboard(prs),
      })
      return res.status(200).end()
    }

    if (text === '/raceday' || text.startsWith('/raceday@')) {
      await setState(chatId, { action: 'raceday', step: 'meet', data: { completed: [] } })
      await tg('sendMessage', { chat_id: chatId, text: 'What meet is this?' })
      return res.status(200).end()
    }

    const state = await getState(chatId)
    if (!state) return res.status(200).end()

    const { action, step, event, orig } = state
    const keep = (current) => text.toLowerCase() === 'same' ? current : text
    const resolveDate = (input) => {
      if (input.toLowerCase() !== 'today') return input
      const d = new Date()
      return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(-2)}`
    }

    if (action === 'add') {
      if (step === 'event') {
        await setState(chatId, { ...state, step: 'time', event: text })
        await tg('sendMessage', { chat_id: chatId, text: `Time for ${text}? (e.g. 3:54.22)` })

      } else if (step === 'time') {
        await setState(chatId, { ...state, step: 'date', time: text })
        await tg('sendMessage', { chat_id: chatId, text: 'Date? (e.g. 5/26/26 or "today")' })

      } else if (step === 'date') {
        await setState(chatId, { ...state, step: 'link', date: resolveDate(text) })
        await tg('sendMessage', { chat_id: chatId, text: 'Link to result? (or "skip")' })

      } else if (step === 'link') {
        const link = text.toLowerCase() === 'skip' ? '' : text
        const prs = await getPRs()
        const newPR = { Event: event, Time: state.time, Date: state.date, Link: link }
        const updated = [...prs.filter(p => p.Event !== event), newPR]
        await setPRs(updated)
        await clearState(chatId)
        await tg('sendMessage', {
          chat_id: chatId,
          text: `Saved ${event} ✅  ${state.time} · ${state.date}`,
          reply_markup: prListKeyboard(updated),
        })
      }

    } else if (action === 'edit') {
      if (step === 'time') {
        await setState(chatId, { ...state, step: 'date', time: keep(orig.Time) })
        await tg('sendMessage', { chat_id: chatId, text: `Date? Current: ${orig.Date} (or "same"/"today")` })

      } else if (step === 'date') {
        const raw = text.toLowerCase() === 'same' ? orig.Date : resolveDate(text)
        await setState(chatId, { ...state, step: 'link', date: raw })
        await tg('sendMessage', { chat_id: chatId, text: `Link? Current: ${orig.Link || '(none)'} (or "same")` })

      } else if (step === 'link') {
        const prs = await getPRs()
        const updated = prs.map(p =>
          p.Event !== event ? p : { ...p, Time: state.time, Date: state.date, Link: keep(orig.Link) }
        )
        await setPRs(updated)
        await clearState(chatId)
        await tg('sendMessage', {
          chat_id: chatId,
          text: `Updated ${event} ✅`,
          reply_markup: prListKeyboard(updated),
        })
      }

    } else if (action === 'urlupdate') {
      if (step === 'url') {
        const link = text.toLowerCase() === 'remove' ? '' : text
        const prs = await getPRs()
        const updated = prs.map(p => p.Event !== event ? p : { ...p, Link: link })
        await setPRs(updated)
        await clearState(chatId)
        await tg('sendMessage', {
          chat_id: chatId,
          text: `${event} URL ${link ? 'updated' : 'removed'} ✅`,
          reply_markup: urlUpdateKeyboard(updated),
        })
      }

    } else if (action === 'raceday') {
      const { data } = state

      if (step === 'other_name') {
        const otherEvents = [...(data.otherEvents || []), text]
        await setState(chatId, { ...state, step: 'time', data: { ...data, currentEvent: text, otherEvents } })
        await tg('sendMessage', { chat_id: chatId, text: `What was your ${text} time?` })

      } else if (step === 'meet') {
        await setState(chatId, { ...state, step: 'date', data: { ...data, meet: text } })
        await tg('sendMessage', { chat_id: chatId, text: 'Date? (or "today")' })

      } else if (step === 'date') {
        const iso = toISO(text)
        await setState(chatId, { ...state, step: 'events', data: { ...data, date: iso } })
        const prs = await getPRs()
        await tg('sendMessage', {
          chat_id: chatId,
          text: `${data.meet} · ${iso}\nWhich events did you race?`,
          reply_markup: raceEventKeyboard(prs, data.completed),
        })

      } else if (step === 'time') {
        const { currentEvent, meet, date, completed, otherEvents } = data
        const isOther = (otherEvents || []).includes(currentEvent)
        const prs = await getPRs()

        const existingRaces = await getRaces()
        await setRaces([...existingRaces, { date, event: currentEvent, time: text, meet }])

        const newCompleted = [...completed, { event: currentEvent, time: text, prBroken: false }]

        if (!isOther) {
          const pr = prs.find(p => p.Event === currentEvent)
          const isPR = !pr || parseTime(text) < parseTime(pr.Time)
          newCompleted[newCompleted.length - 1].prBroken = isPR

          if (isPR) {
            await setState(chatId, { ...state, step: 'url', data: { ...data, pendingTime: text, completed: newCompleted } })
            const prev = pr ? ` Previous: ${pr.Time}.` : ' (new event!)'
            await tg('sendMessage', { chat_id: chatId, text: `🎉 New PR!${prev} Result URL? (or "skip")` })
            return res.status(200).end()
          }
        }

        await setState(chatId, { ...state, step: 'events', data: { ...data, completed: newCompleted } })
        await tg('sendMessage', {
          chat_id: chatId,
          text: `${currentEvent} recorded${isOther ? '.' : ' (not a PR).'}`,
          reply_markup: raceEventKeyboard(prs, newCompleted),
        })

      } else if (step === 'url') {
        const { currentEvent, pendingTime, date, completed } = data
        const link = text.toLowerCase() === 'skip' ? '' : text
        const prs = await getPRs()
        const displayDate = isoToDisplay(date)
        let updated
        if (prs.find(p => p.Event === currentEvent)) {
          updated = prs.map(p =>
            p.Event !== currentEvent ? p : { ...p, Time: pendingTime, Date: displayDate, Link: link }
          )
        } else {
          updated = [...prs, { Event: currentEvent, Time: pendingTime, Date: displayDate, Link: link }]
        }
        await setPRs(updated)
        await setState(chatId, { ...state, step: 'events', data: { ...data, pendingTime: undefined } })
        await tg('sendMessage', {
          chat_id: chatId,
          text: 'PR saved ✅',
          reply_markup: raceEventKeyboard(updated, completed),
        })
      }
    }
  }

  return res.status(200).end()
}
