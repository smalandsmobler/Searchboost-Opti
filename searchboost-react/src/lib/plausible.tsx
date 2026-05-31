/**
 * Searchboost Plausible-tracker for Next.js App Router.
 *
 * Bygger på den hostade tracker-builden på vår self-hosted instans (samma JS som
 * @plausible-analytics/tracker npm-paketet bundlar, men vi pekar mot vår domain
 * så vi äger datan).
 *
 * Användning i app/layout.tsx:
 *
 *   import { PlausibleScript } from '@/lib/plausible';
 *
 *   export default function RootLayout({ children }: { children: React.ReactNode }) {
 *     return (
 *       <html lang="sv">
 *         <head>
 *           <PlausibleScript domain="arbetsro.se" />
 *         </head>
 *         <body>{children}</body>
 *       </html>
 *     );
 *   }
 *
 * Tracker-features inkluderade i denna build:
 *   - outbound-links
 *   - tagged-events (window.plausible('Goal Name', { props: {...} }))
 *   - file-downloads
 *
 * Custom events:
 *
 *   plausible('Newsletter Signup', { props: { source: 'footer' } });
 */

import Script from 'next/script';

interface PlausibleScriptProps {
  /**
   * Domain som visas som site_id i Plausible UI. Default: window.location.host (om inte satt).
   */
  domain: string;
  /**
   * URL till self-hosted Plausible. Default: https://analytics.searchboost.se
   */
  baseUrl?: string;
  /**
   * Aktivera lokal-trafik-tracking (development). Default: false.
   */
  trackLocalhost?: boolean;
}

export function PlausibleScript({
  domain,
  baseUrl = 'https://analytics.searchboost.se',
  trackLocalhost = false,
}: PlausibleScriptProps) {
  const scriptName = trackLocalhost
    ? 'script.local.outbound-links.tagged-events.file-downloads.js'
    : 'script.outbound-links.tagged-events.file-downloads.js';

  return (
    <>
      <Script
        defer
        data-domain={domain}
        src={`${baseUrl}/js/${scriptName}`}
        strategy="afterInteractive"
      />
      <Script id="plausible-init" strategy="afterInteractive">
        {`window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}`}
      </Script>
    </>
  );
}

/**
 * TypeScript helper för custom events. Anropa från event-handlers:
 *
 *   import { trackEvent } from '@/lib/plausible';
 *   <button onClick={() => trackEvent('Newsletter Signup', { source: 'footer' })}>...</button>
 */
type PlausibleProps = Record<string, string | number | boolean>;

declare global {
  interface Window {
    plausible?: (eventName: string, options?: { props?: PlausibleProps; callback?: () => void }) => void;
  }
}

export function trackEvent(eventName: string, props?: PlausibleProps): void {
  if (typeof window === 'undefined') return;
  if (typeof window.plausible !== 'function') return;
  window.plausible(eventName, props ? { props } : undefined);
}
