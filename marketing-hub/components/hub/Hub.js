'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { startHub } from './engine'
import './hub.css'

const SHELL = `
<div class="app" id="app">
  <aside class="side" id="side" aria-label="Workspace navigation"></aside>
  <div class="scrim" data-act="closeSide"></div>
  <div class="main">
    <header class="top">
      <button class="ibtn menu-btn" data-act="openSide" aria-label="Open menu"><svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>
      <h1 id="topTitle">Dashboard</h1>
      <label class="search"><svg class="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><input id="q" type="text" placeholder="Search tasks, tags, briefs" aria-label="Search tasks"></label>
      <div class="topR" id="topR"></div>
    </header>
    <main class="content" id="main"></main>
  </div>
</div>
<div id="drawer" class="drawer" hidden></div>
<div id="modal" class="overlay" hidden></div>
<div id="toasts" class="toasts" aria-live="polite"></div>
<div id="mbox" class="mbox" hidden></div>
<input type="file" id="chatFile" hidden accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.zip">
<input type="file" id="libFile" hidden accept="video/*,audio/*">
<input type="file" id="taskFile" hidden>
`

export default function Hub({ meId, meName, meRole, data, maxMb }) {
  useEffect(() => {
    startHub({
      supabase: createClient(),
      meId,
      meName,
      meRole,
      data,
      maxMb,
      logo: '/finstreet-mark.png',
    })
    // The engine wires its own document listeners once; nothing to clean up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div id="hub-root" dangerouslySetInnerHTML={{ __html: SHELL }} suppressHydrationWarning />
}
