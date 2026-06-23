'use client'

import { useState } from 'react'
import { ZapierMCP } from '@/components/ZapierMCP'

export default function ZapierMCPPage() {
  const [serverUrl, setServerUrl] = useState<string | null>(null)
  const [toolsUpdated, setToolsUpdated] = useState(false)

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Zapier MCP</h1>
        <p className="text-gray-400 mb-8 text-sm">
          Koppla dina Zapier-integrationer och använd dem direkt via MCP.
        </p>

        {/* Status badge */}
        {serverUrl && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-800 bg-green-950/40 px-4 py-3 text-sm">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-300 font-medium">Ansluten</span>
            <code className="ml-auto text-green-400/70 truncate max-w-[340px]">
              {serverUrl}
            </code>
          </div>
        )}

        {toolsUpdated && (
          <div className="mb-4 text-xs text-blue-400">
            Verktyg uppdaterade — anropas om vid nästa MCP-session.
          </div>
        )}

        {/* Embed widget */}
        <ZapierMCP
          onServerUrl={(url) => {
            setServerUrl(url)
            setToolsUpdated(false)
            // Spara till localStorage för återanvändning
            localStorage.setItem('zapier_mcp_url', url)
          }}
          onToolsChanged={() => setToolsUpdated(true)}
          onCloseRequested={() => {
            // Hantera stängning — t.ex. navigera tillbaka
            window.history.back()
          }}
          height="640px"
        />

        {/* Instruktioner */}
        {serverUrl && (
          <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-5 text-sm">
            <p className="text-white/70 mb-3 font-medium">Använd i .mcp.json:</p>
            <pre className="text-green-400/80 text-xs overflow-x-auto">
              {JSON.stringify(
                {
                  mcpServers: {
                    zapier: {
                      type: 'http',
                      url: serverUrl,
                      headers: {
                        Authorization: 'Bearer 0EAfxnAJiaTxdk6MmRZUQinoQBmqzc0DKpt-2jgTsTE',
                      },
                    },
                  },
                },
                null,
                2,
              )}
            </pre>
          </div>
        )}
      </div>
    </main>
  )
}
