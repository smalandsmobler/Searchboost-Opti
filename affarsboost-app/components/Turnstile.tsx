"use client";

import { useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact";
          language?: string;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

interface Props {
  onToken: (token: string) => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
}

// Cloudflare officiella testnycklar (alltid godkänd i dev/staging)
// Byt ut mot riktiga nycklar i produktion via NEXT_PUBLIC_TURNSTILE_SITE_KEY
const SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA";

const SCRIPT_ID = "cf-turnstile-script";

export default function Turnstile({
  onToken,
  onExpire,
  theme = "light",
  size = "normal",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const mounted = useRef(true);

  const stableOnToken = useCallback(onToken, []); // eslint-disable-line
  const stableOnExpire = useCallback(onExpire ?? (() => {}), []); // eslint-disable-line

  useEffect(() => {
    mounted.current = true;

    function renderWidget() {
      if (!containerRef.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token) => { if (mounted.current) stableOnToken(token); },
        "expired-callback": () => { if (mounted.current) stableOnExpire(); },
        theme,
        size,
        language: "sv",
      });
    }

    // Om Turnstile redan är laddat
    if (window.turnstile) {
      renderWidget();
      return;
    }

    // Lägg till script om det inte finns
    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    // Callback från Cloudflare-scriptet
    window.onTurnstileLoad = renderWidget;

    // Fallback polling ifall onload missar
    const poll = setInterval(() => {
      if (window.turnstile) {
        clearInterval(poll);
        renderWidget();
      }
    }, 200);

    return () => {
      mounted.current = false;
      clearInterval(poll);
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, []); // eslint-disable-line

  return <div ref={containerRef} className="mt-3" />;
}
