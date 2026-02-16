# SEO & Website Optimization — Advanced

> Searchboost Standard Operating Procedures
> Extended checklist for clients that need deeper technical work, enterprise-level optimization, or compete in tough markets.

---

## Phase 1: Infrastructure, Security & Compliance

Everything from Basic, plus hardened security and compliance.

- [ ] **Backups** — Automatic daily + hourly incremental backups
- [ ] **CDN & DNS** — Cloudflare (or equivalent) with optimized settings
- [ ] **SSL / HTTPS** — Full verification, no mixed content
- [ ] **HSTS Preload** — Submit to the HSTS Preload List
- [ ] **Security Headers** — CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- [ ] **Staging Blocked** — robots.txt + HTTP auth on staging/dev environments
- [ ] **XML Sitemap** — Dynamic generation, auto-submitted to GSC and Bing
- [ ] **HTML Sitemap** — Create a user-facing sitemap page
- [ ] **robots.txt** — Full configuration check
- [ ] **Manual Actions** — Check for Google penalties in GSC
- [ ] **Consent Mode V2** — Cookie banner with GTM integration (GDPR/CCPA)
- [ ] **Data Retention & Cookies** — GDPR and CCPA compliant cookie policy
- [ ] **Uptime Monitoring** — UptimeRobot or Pingdom alerts
- [ ] **Malware Scanning** — Set up Sucuri, Wordfence, or Snyk
- [ ] **Penetration Testing** — Run OWASP scans on forms and file uploads
- [ ] **Secrets & MFA** — Proper secrets management, MFA on all critical accounts
- [ ] **Favicon & Web Manifest** — favicon.ico and Web App Manifest present
- [ ] **WWW Resolution** — WWW vs non-WWW and HTTPS all resolve correctly
- [ ] **Compression** — Brotli compression enabled, HTTP/2 or HTTP/3 verified

---

## Phase 2: Analytics & Tracking Ecosystem

Full measurement plan with governance and documentation.

- [ ] **GTM Installation** — Central tag management
- [ ] **Tag Governance** — Naming conventions, version control, changelog for all tags
- [ ] **Measurement Plan** — Written data layer specification document
- [ ] **GA4 Setup** — Basic property creation and configuration
- [ ] **GA4 Optimization** — Cross-domain tracking, internal filters, session timeout settings
- [ ] **Data Retention** — Configure GA4 data retention period
- [ ] **Conversion Events** — Goals and conversion actions for all key interactions
- [ ] **Funnel Reports** — Journey mapping with funnel exploration
- [ ] **Audiences** — Retargeting lists and buyer segments
- [ ] **Enhanced Ecommerce** — Cart abandonment, product impressions, purchase tracking
- [ ] **Event Strategy** — Track scroll depth, video plays, downloads, outbound clicks, form interactions
- [ ] **Server-Side Tracking** — Server-side GTM/GA4 for better accuracy
- [ ] **UTM Documentation** — Written UTM parameter naming convention
- [ ] **Google Ads Link** — GA4 connected to Google Ads
- [ ] **GSC Verification** — Google Search Console verified and linked
- [ ] **Bing Webmaster Tools** — Verified and sitemap submitted
- [ ] **Consent Audit** — Verify analytics is blocked before user gives consent
- [ ] **Event Testing** — Test plans using GTM Preview + GA4 DebugView + automated checks

---

## Phase 3: Data Reliability & Automation

Form delivery, backup systems, and conversion testing.

- [ ] **SMTP Service** — SendGrid or Mailgun for reliable email delivery
- [ ] **Delivery Retry** — Retry logic and failure alerts for transactional emails
- [ ] **Spam Protection** — reCAPTCHA v3 or honeypot on all forms
- [ ] **Form Backups** — Webhook to Google Sheets via Make.com or Zapier
- [ ] **Form Logging** — Server-side logging with rate limiting
- [ ] **Form Analytics** — Track field abandonment and errors via GTM/GA4
- [ ] **Webhook Security** — Signature verification and rate limiting
- [ ] **Conversion Debug** — Test all conversions in debug mode
- [ ] **Smoke Tests** — Automated smoke tests for conversion events
- [ ] **Double Opt-In** — Email verification workflow for leads
- [ ] **Thank You Page** — Optimize the post-conversion experience
- [ ] **Broken Links** — Automated monitoring and alerting

---

## Phase 4: Priority Page Optimization

Optimize the most important pages first, in this order:

1. **Homepage** — Brand positioning, value proposition, navigation hub
2. **Service / Product Pages** — Money pages, highest conversion intent
3. **About Us** — E-E-A-T and trust building
4. **Contact Page** — NAP info, working map, functional forms
5. **Case Studies / Portfolio** — Social proof
6. **Blog / Resource Hub** — Content strategy hub
7. **Category Pages** — For ecommerce or content-heavy sites

### Checklist for Every Important Page:

- [ ] Title tag optimized (max 70 characters, includes keyword)
- [ ] Meta description written (max 160 characters, unique)
- [ ] Only one H1 tag per page
- [ ] Logical heading structure (H2 through H6)
- [ ] Target keyword appears in the first 100 words
- [ ] All images have descriptive alt text
- [ ] URL is clean and keyword-relevant
- [ ] Open Graph tags present
- [ ] Twitter Card tags present
- [ ] Canonical tag is correct
- [ ] Clear primary CTA with micro-conversions mapped

---

## Phase 5: Structured Data & Rich Results

Go beyond basic schema. Target rich snippets and Knowledge Panel features.

- [ ] **Organization Schema** — Company info, logo, social profiles
- [ ] **Logo Schema** — Properly linked
- [ ] **Breadcrumb Schema** — Site hierarchy for search results
- [ ] **FAQ Schema** — On high-value pages
- [ ] **HowTo Schema** — On tutorial and guide content
- [ ] **Review / Rating Schema** — For products and services
- [ ] **Product Schema** — If ecommerce
- [ ] **Video Schema** — VideoObject for all embedded videos
- [ ] **Article Schema** — For blog posts and news content
- [ ] **Local Business Schema** — With proper `@id` references
- [ ] **SiteLinks SearchBox** — Enable the search box in Google results
- [ ] **Event Schema** — If the business runs events
- [ ] **JSON-LD Implementation** — Use JSON-LD format (not Microdata)
- [ ] **Rich Results Test** — Validate all schema with Google's tool
- [ ] **Schema Monitoring** — Watch for warnings and errors over time

---

## Phase 6: Keyword & Content Strategy

Deeper content planning with documentation and processes.

- [ ] **Keyword Prioritization** — Eisenhower Matrix (volume vs. conversion intent)
- [ ] **Full Keyword Research** — Intent mapping for every target keyword
- [ ] **Competitor Gap Analysis** — Topics and keywords competitors rank for
- [ ] **SERP Feature Analysis** — Find Featured Snippet and People Also Ask opportunities
- [ ] **Topic Clusters** — E-E-A-T content plan with pillar pages
- [ ] **Content Gap Analysis** — Find topics you haven't covered yet
- [ ] **Internal Linking** — Hub & Spoke model
- [ ] **Content Briefs** — Template with intent, keywords, internal links, CTAs for every piece
- [ ] **Content Freshness Audit** — Decide what to update, delete, or combine
- [ ] **Content Pruning** — Remove thin and underperforming pages
- [ ] **Skyscraper Research** — Find 10x content opportunities
- [ ] **Content Repurposing** — Blog to video to infographic pipeline
- [ ] **Publishing Schedule** — Documented cadence and SLAs
- [ ] **Style Guide** — Editorial and SEO writing guidelines
- [ ] **Refresh Policy** — When and how to update old content
- [ ] **Localization Plan** — hreflang and translated content strategy

---

## Phase 7: Technical Health & Performance

Deep technical SEO including JavaScript rendering, crawl budget, and performance budgets.

### Core Web Vitals
- [ ] **CWV Assessment** — Measure LCP, INP, CLS
- [ ] **LCP Fix** — Preload above-the-fold images, prioritize critical resources
- [ ] **INP Fix** — Simplify JavaScript, optimize interactions
- [ ] **CLS Fix** — Set image dimensions, reserve ad space
- [ ] **Lighthouse Baseline** — Run and save a baseline score
- [ ] **WebPageTest Baseline** — Run and save detailed performance data
- [ ] **Performance Budgets** — Enforce in CI with Lighthouse CI

### Images
- [ ] WebP/AVIF conversion
- [ ] Compression optimized
- [ ] Lazy loading on all below-the-fold images
- [ ] Responsive `srcset` attributes
- [ ] `decoding=async` + `fetchpriority` on LCP image
- [ ] Alt text complete on all images

### Technical SEO
- [ ] Crawl errors fixed (404s, 5xx)
- [ ] Mobile-first audit passed
- [ ] Canonical tags correct
- [ ] 301 redirects mapped (no chains)
- [ ] Duplicate content resolved
- [ ] **JavaScript SEO** — Fetch and Render test in GSC
- [ ] **JavaScript Rendering** — Check if SPA/React/Vue content is indexed
- [ ] **SSR / Prerendering** — Implement for JavaScript-heavy sites
- [ ] Pagination handled properly
- [ ] Faceted navigation handled (ecommerce)
- [ ] URL parameters configured in GSC
- [ ] hreflang implemented (if multilingual)
- [ ] **Index Coverage** — Audit and fix all issues in GSC
- [ ] **Internal Link Flow** — Find orphan pages and fix authority flow
- [ ] **Crawl Budget** — Optimize for large sites

### Performance
- [ ] Preload / preconnect resource hints
- [ ] Cache-control headers and CDN TTL strategy
- [ ] Third-party script audit (check GTM tag load times)
- [ ] Font optimization (font-display: swap, subsetting)
- [ ] Critical CSS extraction (above-the-fold rendering)
- [ ] HTML, CSS, JS minification

---

## Phase 8: E-E-A-T & Brand Trust

Build strong author authority and brand signals.

- [ ] **Author Bios** — Full bio pages with credentials and schema
- [ ] **Original Photography** — Replace stock photos everywhere possible
- [ ] **Legal Pages** — Privacy Policy, Terms of Service
- [ ] **External Citing** — Link to authoritative sources
- [ ] **Review Strategy** — Plan for generating quality reviews
- [ ] **Trust Signals** — Awards, press mentions, partner logos with schema
- [ ] **Brand Mention Tracking** — Monitor unlinked mentions and convert to links
- [ ] **Mention Alerts** — Set up alerts for brand name mentions
- [ ] **Wikipedia / Wikidata** — Create or improve entries if the brand qualifies
- [ ] **Social Proof** — Testimonials with photos, case study numbers
- [ ] **Social Profiles** — Claim and optimize all brand social accounts

---

## Phase 9: Accessibility (WCAG Compliance)

Make the site usable for everyone.

- [ ] **Color Contrast** — Meet WCAG AA minimum contrast ratios
- [ ] **Keyboard Navigation** — All interactive elements reachable via keyboard
- [ ] **Screen Reader** — ARIA labels, semantic HTML
- [ ] **Focus Indicators** — Visible focus styles on interactive elements
- [ ] **Form Labels** — All fields properly labeled, clear error messages
- [ ] **Skip Navigation** — Skip-to-content link for screen readers
- [ ] **Video Captions** — Captions and transcripts for all videos

---

## Phase 10: Conversion Rate Optimization (CRO)

Systematic testing to increase conversions.

- [ ] **Above the Fold** — Key content and CTA visible without scrolling
- [ ] **Page Speed as CRO** — Fast pages convert better
- [ ] **A/B Test Roadmap** — Plan tests for headlines, CTAs, layouts
- [ ] **Hypothesis List** — Prioritized conversion rate improvement ideas
- [ ] **Experiment QA** — Checklist for tracking, sample size, goal registration
- [ ] **Heatmaps** — Install Hotjar or Clarity
- [ ] **CTA Audit** — Review all calls-to-action
- [ ] **Trust Badges** — Security seals, awards, reviews
- [ ] **Exit Intent** — Popup strategy with lead magnets (if appropriate)
- [ ] **Micro-Conversions** — Optimize email signups, demo requests
- [ ] **Form Optimization** — Test field count reduction
- [ ] **Multi-Step Forms** — Break long forms into steps
- [ ] **Progressive Disclosure** — Show information gradually

---

## Phase 11: Reporting & Visualization

Comprehensive dashboards with alerting and monitoring.

- [ ] **Looker Studio Dashboard** — GSC + GA4 blended data
- [ ] **Monthly Reports** — Automated email reports
- [ ] **Rank Tracking** — Integration with SEMrush, Ahrefs, or similar
- [ ] **Backlink Dashboard** — Monitor link growth and losses
- [ ] **Web Vitals Monitoring** — Alerts for CWV regressions
- [ ] **SERP Feature Tracking** — Featured Snippets, Knowledge Panel changes
- [ ] **Weekly Health Snapshot** — Index coverage, crawl errors, organic trends
- [ ] **KPI Tracking** — Monitor these metrics:
  - Organic sessions, users, conversion rate
  - Impressions and average CTR (GSC)
  - LCP, INP, CLS benchmarks
  - Pages indexed and crawl errors
  - New/lost referring domains and Domain Rating

---

## Phase 12: Local SEO

Full local optimization for businesses with physical locations.

- [ ] **Google Business Profile** — Fully optimized
- [ ] **Bing Places** — Set up and verified
- [ ] **NAP Consistency** — Same everywhere
- [ ] **NAP in Structured Data** — In schema markup and footer
- [ ] **Local Schema** — LocalBusiness with `@id`
- [ ] **Citation Building** — Yelp, YellowPages, industry directories
- [ ] **Citation Audit** — Clean up incorrect listings (Moz Local, BrightLocal)
- [ ] **Review Response** — Strategy and guidelines for responding to reviews
- [ ] **Local Content** — Service area pages, local news/events
- [ ] **Geo-Targeted Pages** — Separate pages per location if multi-location
- [ ] **Service Area Pages** — Neighborhood-specific content

---

## Phase 13: Off-Page SEO & Authority

Strategic link building and PR.

- [ ] **Backlink Audit** — Full profile analysis with Ahrefs or SEMrush
- [ ] **Backlink Gap** — Compare your links to competitors
- [ ] **Disavow File** — Identify and disavow toxic links
- [ ] **Digital PR** — HARO, journalist outreach, data-driven content
- [ ] **Link Playbook** — Documented strategy: guest posts, digital PR, data assets
- [ ] **Guest Posting** — Identify and prioritize opportunities
- [ ] **Resource Page Links** — Find relevant resource pages in your niche
- [ ] **Broken Link Building** — Find broken links on other sites and offer your content
- [ ] **Broken Backlink Recovery** — Reclaim your own broken backlinks
- [ ] **Unlinked Mentions** — Find and convert brand mentions to links

---

## Phase 14: User Experience & Site Architecture

Make the site intuitive and easy to navigate.

- [ ] **Site Search** — Working search with good results
- [ ] **Search Analytics** — Track what users search for on your site
- [ ] **Breadcrumbs** — Visible breadcrumb navigation
- [ ] **Custom 404 Page** — Helpful page with navigation and search
- [ ] **Loading Perception** — Skeleton screens, loading animations
- [ ] **Navigation Heatmaps** — See which menu items get the most clicks

---

## Phase 15: Conversion Path Optimization

Build the journey from first visit to conversion.

- [ ] **Lead Magnets** — Create ebooks, checklists, or free tools
- [ ] **Email Capture** — Sidebar, inline, and footer opt-in forms
- [ ] **Retargeting Pixels** — Facebook, LinkedIn, Google Ads pixels installed
- [ ] **Cart Abandonment** — Recovery workflow (if ecommerce)
- [ ] **Multi-Touch Attribution** — Track every touchpoint in the conversion path

---

## Phase 16: Launch QA Checklist

Verify everything before going live.

### Content & Meta
- [ ] Title tag present, correct format, max 70 characters
- [ ] Meta description present and unique, max 160 characters
- [ ] Single H1, logical H2-H6 structure
- [ ] Canonical tag correct
- [ ] Open Graph and Twitter Card tags present

### Technical & Indexing
- [ ] Page returns 200 (or intended redirect)
- [ ] robots meta set to index/follow as intended
- [ ] robots.txt is not blocking important pages
- [ ] XML sitemap updated and submitted
- [ ] Schema markup present and passes validation

### Performance & UX
- [ ] LCP element preloaded, PageSpeed Insights score acceptable
- [ ] Images optimized with alt text
- [ ] Mobile/responsive verified

### Tracking & Conversion
- [ ] GA4 + GTM firing correctly (preview/debug mode)
- [ ] Conversion events verified (test a real conversion)
- [ ] Forms send confirmation emails

### Security & Compliance
- [ ] HTTPS valid, HSTS header present
- [ ] Staging environment blocked from indexing
- [ ] Cookie consent working correctly

---

## Phase 17: Ongoing Monitoring & Maintenance

Long-term operations to keep the site performing.

| Frequency | Tasks |
|-----------|-------|
| **Monthly** | Mini-audit (crawl, index, backlinks, top pages) |
| **Quarterly** | Deep audit (content, technical, competitors, keywords) |

### Ongoing
- [ ] **SEO Playbook** — Written runbook with roles, SLAs, dashboard links
- [ ] **Broken Link Monitoring** — Automated and alerting
- [ ] **Rank Tracking** — Target keywords monitored weekly
- [ ] **Competitor Monitoring** — Watch their rankings and content
- [ ] **Algorithm Updates** — Stay aware of Google updates and SERP volatility
- [ ] **Content Performance** — Review quarterly, update what is declining
- [ ] **Backlink Growth** — Monitor new and lost links
- [ ] **Search Visibility** — Track branded vs. non-branded search trends
- [ ] **Knowledge Base** — Document all SEO fixes and decisions

---

*This document is a Searchboost standard. Use it for every advanced project, every time.*
