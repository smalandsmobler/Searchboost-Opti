# SEO & Website Optimization — Basic

> Searchboost Standard Operating Procedures
> Use this checklist for every new client project from start to finish.

---

## Phase 1: Infrastructure & Security

Set up the foundation before any SEO work begins.

- [ ] **CDN & DNS** — Set up Cloudflare (or similar CDN) and point DNS correctly
- [ ] **Backups** — Turn on automatic daily backups through the hosting provider
- [ ] **SSL / HTTPS** — Make sure the site runs on HTTPS everywhere. Submit to HSTS Preload List
- [ ] **Security Headers** — Add CSP, X-Frame-Options, X-Content-Type-Options headers
- [ ] **Firewall** — Enable a Web Application Firewall (WAF) and bot protection
- [ ] **Server Software** — Update PHP (or other server software) to the latest stable version
- [ ] **Staging Site** — Set up a password-protected staging/test environment with `X-Robots-Tag: noindex`
- [ ] **robots.txt** — Block admin areas and staging from search engines, allow important bots
- [ ] **XML Sitemap** — Generate a dynamic sitemap and submit it to Google Search Console

---

## Phase 2: Analytics & Tracking

Get data flowing so you can measure everything from day one.

- [ ] **Google Tag Manager (GTM)** — Install GTM as the central tag manager
- [ ] **Cookie Consent** — Set up Consent Mode V2 with a cookie banner (GDPR compliance)
- [ ] **Google Analytics 4 (GA4)** — Create and configure the GA4 property
- [ ] **GA4 Settings** — Turn on cross-domain tracking, filter internal traffic, extend data retention
- [ ] **Conversion Events** — Track forms, phone clicks, email clicks, and purchases as conversions
- [ ] **Audiences** — Create retargeting lists and customer segments in GA4
- [ ] **Funnel Reports** — Set up funnel exploration reports to see where users drop off
- [ ] **Google Search Console (GSC)** — Verify the site and link it to GA4
- [ ] **Bing Webmaster Tools** — Verify and submit sitemap
- [ ] **Server-Side Tracking** — Optional but recommended for better data accuracy
- [ ] **Ad Platform Pixels** — Install Facebook CAPI / LinkedIn Insight Tag if running ads

---

## Phase 3: Data Reliability & Automation

Make sure form data, uptime, and error monitoring are solid.

- [ ] **Email Delivery** — Set up SMTP service (SendGrid/Mailgun) so form emails actually arrive
- [ ] **Spam Protection** — Add reCAPTCHA v3 or a honeypot to all forms
- [ ] **Form Backups** — Use Make.com or Zapier to send form data to a Google Sheet as backup
- [ ] **Uptime Monitoring** — Set up UptimeRobot or Pingdom to alert you if the site goes down
- [ ] **404 Monitoring** — Track and get alerts for 404 errors
- [ ] **Broken Links** — Set up automated broken link checking (Screaming Frog or Ahrefs)

---

## Phase 4: Technical Health & Core Web Vitals

Fix the technical issues that hurt rankings and user experience.

- [ ] **Crawl Errors** — Fix all 404s and server errors (5xx)
- [ ] **Core Web Vitals** — Optimize LCP (loading speed), INP (responsiveness), and CLS (visual stability)
- [ ] **Images** — Convert to WebP/AVIF, add lazy loading, set explicit width and height
- [ ] **Fonts** — Preload fonts, use `font-display: swap`, host fonts locally
- [ ] **CSS & JS** — Minify and defer non-critical CSS and JavaScript
- [ ] **Mobile Check** — Make sure the site works perfectly on mobile (Google indexes mobile first)
- [ ] **Canonical Tags** — Audit and fix canonical tags on all pages
- [ ] **Redirects** — Map and fix all 301 redirects, remove chains and loops
- [ ] **Duplicate Content** — Fix duplicate pages caused by URL parameters or pagination
- [ ] **Pagination** — Handle paginated pages properly with canonicals
- [ ] **Multi-Language** — Add hreflang tags if the site has multiple languages

---

## Phase 5: Top 5 Pages — Deep Optimization

Focus your best effort on the pages that matter most.

1. **Homepage** — Brand positioning, value proposition, navigation hub
2. **Service / Product Pages** — Highest conversion intent, the money pages
3. **About Us** — Critical for E-E-A-T (Experience, Expertise, Authority, Trust)
4. **Contact Page** — NAP info (Name, Address, Phone), working map, functional forms
5. **Case Studies / Portfolio** — Social proof that builds trust

---

## Phase 6: Content Strategy & Keywords

Plan what content to create, update, or remove.

- [ ] **Keyword Prioritization** — Use the Eisenhower Matrix (search volume vs. conversion intent)
- [ ] **Competitor Gap Analysis** — Find keywords your competitors rank for but you don't
- [ ] **Content Pruning** — Update, combine, or delete thin/low-quality content
- [ ] **Topic Clusters** — Plan pillar pages and supporting content (E-E-A-T content plan)
- [ ] **Internal Linking** — Build a Hub & Spoke internal linking structure
- [ ] **URL Structure** — Keep URLs clean, descriptive, and flat
- [ ] **Meta Templates** — Create title tag and meta description formulas (max 60 / 155 characters)

---

## Phase 7: E-E-A-T, Schema & Trust

Show Google (and users) that you are trustworthy and authoritative.

- [ ] **Organization Schema** — Add structured data for the company (logo, social profiles, contact)
- [ ] **Author Schema** — Add person/author markup for content creators
- [ ] **Local Business Schema** — Add if the business has a physical location
- [ ] **Breadcrumb Schema** — Help Google understand the site hierarchy
- [ ] **FAQ / HowTo Schema** — Add for pages that answer questions (rich snippet opportunity)
- [ ] **Author Bio Pages** — Create pages with credentials and LinkedIn links
- [ ] **Real Photos** — Replace stock photos with professional, original images
- [ ] **Legal Pages** — Privacy Policy, Terms of Service, and Impressum
- [ ] **External Citations** — Link out to authoritative sources when it makes sense

---

## Phase 8: UX, Accessibility & Conversion

Make the site easy to use, accessible, and optimized for conversions.

- [ ] **Accessibility Audit** — Check color contrast, ARIA labels, keyboard navigation (WCAG)
- [ ] **Heatmaps** — Install Hotjar or Microsoft Clarity to see how users interact
- [ ] **A/B Testing Plan** — Plan tests for headlines, CTAs, and key page elements
- [ ] **Form UX** — Reduce form fields, improve error messages
- [ ] **Trust Badges** — Add security seals, awards, review badges
- [ ] **CTA Visibility** — Make sure the main call-to-action is visible above the fold
- [ ] **Social Sharing** — Validate Open Graph and Twitter Card tags

---

## Phase 9: Local SEO

If the business serves a local area, do this.

- [ ] **Google Business Profile** — Optimize categories, products, services, photos
- [ ] **Bing Places** — Set up and optimize
- [ ] **Apple Maps Connect** — Register the business
- [ ] **NAP Consistency** — Same Name, Address, Phone everywhere online
- [ ] **Local Citations** — Build listings on Yelp, YellowPages, industry directories
- [ ] **Review Strategy** — Create a plan to get more (and better) reviews

---

## Phase 10: Off-Page & Authority

Build the site's reputation and backlink profile.

- [ ] **Competitor Backlinks** — Analyze what links your competitors have
- [ ] **Disavow Toxic Links** — Identify and disavow harmful backlinks
- [ ] **Brand Mentions** — Find unlinked mentions of the brand and ask for links
- [ ] **Digital PR & Guest Posts** — Create an outreach plan for high-quality backlinks

---

## Phase 11: Reporting

Set up dashboards so the client can see results.

- [ ] **Looker Studio Dashboard** — Blend GSC + GA4 data into one visual report
- [ ] **Rank Tracking** — Track target keywords with a rank tracker
- [ ] **Monthly Reports** — Schedule automated monthly reports by email

---

## Phase 12: Pre-Launch Checklist

Before going live, verify everything works.

- [ ] **Noindex Removed** — Check robots.txt and meta robots tags — nothing should block indexing
- [ ] **Redirects Work** — HTTP goes to HTTPS, non-www goes to www (or the other way around)
- [ ] **Tracking Test** — Submit a real form or test purchase. Check GA4 DebugView
- [ ] **Speed Test** — Run Google PageSpeed Insights on the live URL
- [ ] **Schema Test** — Run Google Rich Results Test on key pages
- [ ] **Request Indexing** — Manually request indexing of the homepage in GSC

---

## Phase 13: Ongoing Maintenance

Keep the site healthy after launch.

| Frequency | Tasks |
|-----------|-------|
| **Daily** | Verify backups are running, check uptime |
| **Weekly** | Check GSC for crawl errors, update plugins/CMS |
| **Monthly** | Send reports, refresh content, audit backlinks |
| **Quarterly** | Full technical audit, speed optimization review |

---

*This document is a Searchboost standard. Use it for every project, every time.*
