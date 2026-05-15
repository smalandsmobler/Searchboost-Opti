import Script from "next/script";

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || "";
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "";
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "";

export default function TrackingScripts() {
  return (
    <>
      {GTM_ID && (
        <Script
          id="gtm-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');
            `,
          }}
        />
      )}

      {META_PIXEL_ID && (
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');
            `,
          }}
        />
      )}

      {GA4_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga4-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA4_MEASUREMENT_ID}', { anonymize_ip: true });
${GOOGLE_ADS_ID ? `gtag('config', '${GOOGLE_ADS_ID}');` : ""}
              `,
            }}
          />
        </>
      )}
    </>
  );
}

// Hjälpfunktioner för conversion-events
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackLead(value = 0, currency = "SEK") {
  if (typeof window === "undefined") return;
  window.fbq?.("track", "Lead", { value, currency });
  window.gtag?.("event", "generate_lead", { value, currency });
}

export function trackSubscribe(planName: string, value: number, currency = "SEK") {
  if (typeof window === "undefined") return;
  window.fbq?.("track", "Subscribe", { value, currency, predicted_ltv: value * 12, plan: planName });
  window.gtag?.("event", "purchase", { value, currency, items: [{ item_name: planName }] });
  if (GOOGLE_ADS_ID && process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL) {
    window.gtag?.("event", "conversion", {
      send_to: `${GOOGLE_ADS_ID}/${process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL}`,
      value,
      currency,
    });
  }
}
