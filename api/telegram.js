import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()
const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const ALLOWED_CHAT = process.env.TELEGRAM_CHAT_ID ? Number(process.env.TELEGRAM_CHAT_ID) : null

// --------------- Telegram API helpers ---------------

async function tg(method, body) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
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

function prListText(prs) {
  return prs.length
    ? prs.map(p => `*${p.Event}* — ${p.Time} (${p.Date})`).join('\n')
    : 'No PRs recorded yet\\.'
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

// --------------- Shared actions ---------------

async function showPRList(chatId) {
  const prs = await getPRs()
  await clearState(chatId)
  await tg('sendMessage', {
    chat_id: chatId,
    text: prListText(prs),
    parse_mode: 'MarkdownV2',
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

    const state = await getState(chatId)
    if (!state) return res.status(200).end()

    const { action, step, event, orig } = state
    const keep = (current) => text.toLowerCase() === 'same' ? current : text

    if (action === 'add') {
      if (step === 'event') {
        await setState(chatId, { ...state, step: 'time', event: text })
        await tg('sendMessage', { chat_id: chatId, text: `Time for ${text}? (e.g. 3:54.22)` })

      } else if (step === 'time') {
        await setState(chatId, { ...state, step: 'date', time: text })
        await tg('sendMessage', { chat_id: chatId, text: 'Date? (e.g. 2026-05-01)' })

      } else if (step === 'date') {
        await setState(chatId, { ...state, step: 'link', date: text })
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
        await tg('sendMessage', { chat_id: chatId, text: `Date? Current: ${orig.Date} (or "same")` })

      } else if (step === 'date') {
        await setState(chatId, { ...state, step: 'link', date: keep(orig.Date) })
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
    }
  }

  return res.status(200).end()
}
