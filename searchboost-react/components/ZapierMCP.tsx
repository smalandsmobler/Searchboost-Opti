'use client'

import { useEffect, useRef } from 'react'
import type { MCPServerUrlDetail } from '@/types/zapier-mcp'

// ─── Props ────────────────────────────────────────────────────────────────────

interface ZapierMCPProps {
  /** Required — embed-id from Zapier dashboard */
  embedId?: string
  width?: string
  height?: string
  /** CSS class forwarded to the inner iframe */
  iframeClassName?: string
  /**
   * Quick Account Creation — all three must be supplied together.
   * Bypasses Zapier sign-up for the user.
   */
  signUpEmail?: string
  signUpFirstName?: string
  signUpLastName?: string
  /** Fired when the MCP server URL is received */
  onServerUrl?: (serverUrl: string) => void
  /** Fired whenever the user's tool list changes */
  onToolsChanged?: () => void
  /** Fired when the user clicks the close button inside the embed */
  onCloseRequested?: () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMBED_ID = 'd72f6f1f-cf88-4ed0-8aec-7dc24782b943'
const SCRIPT_SRC = 'https://mcp.zapier.com/embed/v1/mcp.js'

function ensureScript() {
  if (typeof document === 'undefined') return
  if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return
  const s = document.createElement('script')
  s.src = SCRIPT_SRC
  s.async = true
  document.head.appendChild(s)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ZapierMCP({
  embedId = EMBED_ID,
  width = '100%',
  height = '600px',
  iframeClassName,
  signUpEmail,
  signUpFirstName,
  signUpLastName,
  onServerUrl,
  onToolsChanged,
  onCloseRequested,
}: ZapierMCPProps) {
  const ref = useRef<HTMLElement>(null)

  // Inject embed script once per page
  useEffect(() => {
    ensureScript()
  }, [])

  // Attach event listeners to the custom element
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleServerUrl = (e: Event) => {
      const { serverUrl } = (e as CustomEvent<MCPServerUrlDetail>).detail
      onServerUrl?.(serverUrl)
    }

    const handleToolsChanged = () => onToolsChanged?.()
    const handleCloseRequested = () => onCloseRequested?.()

    el.addEventListener('mcp-server-url', handleServerUrl)
    el.addEventListener('tools-changed', handleToolsChanged)
    el.addEventListener('close-requested', handleCloseRequested)

    return () => {
      el.removeEventListener('mcp-server-url', handleServerUrl)
      el.removeEventListener('tools-changed', handleToolsChanged)
      el.removeEventListener('close-requested', handleCloseRequested)
    }
  }, [onServerUrl, onToolsChanged, onCloseRequested])

  return (
    <zapier-mcp
      ref={ref}
      embed-id={embedId}
      width={width}
      height={height}
      {...(iframeClassName ? { 'class-name': iframeClassName } : {})}
      {...(signUpEmail ? { 'sign-up-email': signUpEmail } : {})}
      {...(signUpFirstName ? { 'sign-up-first-name': signUpFirstName } : {})}
      {...(signUpLastName ? { 'sign-up-last-name': signUpLastName } : {})}
    />
  )
}
