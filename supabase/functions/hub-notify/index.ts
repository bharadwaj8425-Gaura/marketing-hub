// hub-notify: sends a FinStreet Hub notification by email and WhatsApp.
// Called by the trg_hub_notif database trigger with {id} of a new "notif" row.
// It reads the row itself with the service role, so callers cannot inject content,
// and claims the row first so a notification is never delivered twice.
import { createClient } from 'npm:@supabase/supabase-js@2'

const DEFAULT_EV = ['assign', 'start', 'review', 'approved', 'changes', 'done', 'cancel', 'mention', 'test']
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } })
const clean = (s: string) => String(s || '').replace(/[\n\t]+/g, ' ').replace(/ {4,}/g, '   ').trim()
const escH = (s: string) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const phoneOf = (p: string) => { let d = String(p || '').replace(/\D/g, ''); if (d.length === 10) d = '91' + d; if (d.length === 11 && d.startsWith('0')) d = '91' + d.slice(1); return d }

async function sendMail(cfg: Record<string, string>, to: string, subject: string, html: string) {
  const from = cfg.MAIL_FROM, name = cfg.MAIL_FROM_NAME || 'FinStreet Marketing Hub'
  if (!cfg.MAIL_KEY || !from) return 'not set up'
  if ((cfg.MAIL_PROVIDER || 'brevo') === 'resend') {
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + cfg.MAIL_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: name + ' <' + from + '>', to: [to], subject, html }) })
    return r.ok ? 'sent' : 'error ' + r.status + ': ' + (await r.text()).slice(0, 200)
  }
  const r = await fetch('https://api.brevo.com/v3/smtp/email', { method: 'POST', headers: { 'api-key': cfg.MAIL_KEY, 'Content-Type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ sender: { email: from, name }, to: [{ email: to }], subject, htmlContent: html }) })
  return r.ok ? 'sent' : 'error ' + r.status + ': ' + (await r.text()).slice(0, 200)
}

async function sendWa(cfg: Record<string, string>, phone: string, params: string[]) {
  const to = phoneOf(phone)
  if (!to) return 'no number'
  const n = Math.max(0, Math.min(3, parseInt(cfg.WA_PARAMS || '3', 10) || 0))
  const vals = n === 0 ? [] : n === 1 ? [clean(params.join(' '))] : n === 2 ? [clean(params[0]), clean(params.slice(1).join(' '))] : params.slice(0, 3).map(clean)
  if ((cfg.WA_PROVIDER || 'meta') === 'aisensy') {
    if (!cfg.WA_TOKEN || !cfg.WA_TEMPLATE) return 'not set up'
    const r = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: cfg.WA_TOKEN, campaignName: cfg.WA_TEMPLATE, destination: to, userName: 'FinStreet Hub', templateParams: vals }) })
    return r.ok ? 'sent' : 'error ' + r.status + ': ' + (await r.text()).slice(0, 200)
  }
  if (!cfg.WA_TOKEN || !cfg.WA_PHONE_ID || !cfg.WA_TEMPLATE) return 'not set up'
  const template: Record<string, unknown> = { name: cfg.WA_TEMPLATE, language: { code: cfg.WA_LANG || 'en' } }
  if (vals.length) template.components = [{ type: 'body', parameters: vals.map((text) => ({ type: 'text', text: text.slice(0, 900) || '-' })) }]
  const r = await fetch('https://graph.facebook.com/v21.0/' + cfg.WA_PHONE_ID + '/messages', { method: 'POST', headers: { Authorization: 'Bearer ' + cfg.WA_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'template', template }) })
  return r.ok ? 'sent' : 'error ' + r.status + ': ' + (await r.text()).slice(0, 200)
}

Deno.serve(async (req) => {
  const body = await req.json().catch(() => ({}))
  const id = String(body?.id || '')
  if (!id) return json({ ok: false, error: 'missing id' }, 400)
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: doc, error: ce } = await sb.rpc('hub_claim_notif', { p_id: id })
  if (ce) return json({ ok: false, error: ce.message }, 500)
  if (!doc) return json({ ok: true, skipped: 'already handled' })
  const n = doc as Record<string, string>
  const out: Record<string, string> = {}
  const finish = async () => { await sb.from('hub_docs').update({ doc: { ...n, sent: true, out } }).eq('kind', 'notif').eq('id', id); return json({ ok: true, out }) }
  try {
    const [memR, profR, fromR, cfgR] = await Promise.all([
      sb.from('hub_docs').select('doc').eq('kind', 'member').eq('id', n.to).maybeSingle(),
      sb.from('profiles').select('email, full_name').eq('id', n.to).maybeSingle(),
      sb.from('profiles').select('full_name, email').eq('id', n.from).maybeSingle(),
      sb.from('hub_secrets').select('name, value'),
    ])
    const nt = (memR.data?.doc?.nt || {}) as Record<string, unknown>
    const cfg: Record<string, string> = {}
    ;(cfgR.data || []).forEach((r: { name: string; value: string }) => { cfg[r.name] = r.value })
    const ev = n.ev || 'other'
    const evs = Array.isArray(nt.ev) ? (nt.ev as string[]) : DEFAULT_EV
    if (ev !== 'test' && !evs.includes(ev)) { out.skip = 'event ' + ev + ' is off for this person'; return await finish() }
    const who = fromR.data?.full_name || String(fromR.data?.email || 'Someone').split('@')[0]
    const task = n.tn ? '#' + n.tn + ' ' + (n.title || '') : ''
    const url = cfg.APP_URL || 'https://marketing-hub-sigma-virid.vercel.app'
    const what = String(n.tx || '')
    const subject = 'FinStreet Hub: ' + who + ' ' + what.slice(0, 90) + (task && !what.includes('#' + n.tn) ? ' (' + task.slice(0, 60) + ')' : '')
    const html = '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#13201C;max-width:560px">'
      + '<p style="margin:0 0 12px"><b>' + escH(who) + '</b> ' + escH(what) + '</p>'
      + (task ? '<p style="margin:0 0 12px;padding:10px 12px;background:#EDF1EF;border-radius:8px">' + escH(task) + '</p>' : '')
      + '<p style="margin:0 0 16px"><a href="' + escH(url) + '" style="background:#0B6E5B;color:#fff;padding:9px 14px;border-radius:8px;text-decoration:none;display:inline-block">Open the Marketing Hub</a></p>'
      + '<p style="margin:0;color:#586964;font-size:12px">You get this because email alerts are on for your FinStreet Hub account. An admin can turn them off in Team and access.</p></div>'
    const email = String(nt.email || profR.data?.email || '')
    if (nt.mail && email) out.mail = await sendMail(cfg, email, subject, html)
    else out.mail = nt.mail ? 'no email' : 'off'
    if (nt.wa && nt.phone) out.wa = await sendWa(cfg, String(nt.phone), [who, what, task || url])
    else out.wa = nt.wa ? 'no number' : 'off'
  } catch (e) {
    out.error = String((e as Error)?.message || e).slice(0, 200)
  }
  return await finish()
})
