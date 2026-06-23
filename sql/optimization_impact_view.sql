-- optimization_impact_view.sql
--
-- Korrelerar varje loggad SEO-optimering mot GSC-data före/efter.
-- För varje optimering beräknas snittposition + totala klick/impressions
-- under 14 dagar före resp. 14 dagar efter optimeringens timestamp.
-- Baseras på (customer_id, page_url) där page_url matchar GSC.page.
--
-- Används för att svara på: "Vilka optimeringar flyttar faktiskt rankings?"
-- Feedback-loop för autonomous-optimizer — vi ser vilka optimization_type
-- som ger bäst delta och kan prioritera dem.
--
-- Kräver minst 14 dagars GSC-historik efter en optimering för att räknas.

CREATE OR REPLACE VIEW `searchboost-485810.seo_data.optimization_impact` AS
WITH opt AS (
  SELECT
    TIMESTAMP_TRUNC(timestamp, DAY) AS opt_day,
    customer_id,
    page_url,
    optimization_type,
    claude_reasoning
  FROM `searchboost-485810.seo_data.seo_optimization_log`
  WHERE page_url IS NOT NULL
),
before_14 AS (
  SELECT
    o.opt_day,
    o.customer_id,
    o.page_url,
    o.optimization_type,
    AVG(g.position) AS avg_position_before,
    SUM(g.clicks) AS clicks_before,
    SUM(g.impressions) AS impressions_before
  FROM opt o
  LEFT JOIN `searchboost-485810.seo_data.gsc_daily_metrics` g
    ON g.customer_id = o.customer_id
   AND g.page = o.page_url
   AND g.date BETWEEN DATE_SUB(DATE(o.opt_day), INTERVAL 14 DAY)
                  AND DATE_SUB(DATE(o.opt_day), INTERVAL 1 DAY)
  GROUP BY 1,2,3,4
),
after_14 AS (
  SELECT
    o.opt_day,
    o.customer_id,
    o.page_url,
    AVG(g.position) AS avg_position_after,
    SUM(g.clicks) AS clicks_after,
    SUM(g.impressions) AS impressions_after
  FROM opt o
  LEFT JOIN `searchboost-485810.seo_data.gsc_daily_metrics` g
    ON g.customer_id = o.customer_id
   AND g.page = o.page_url
   AND g.date BETWEEN DATE_ADD(DATE(o.opt_day), INTERVAL 1 DAY)
                  AND DATE_ADD(DATE(o.opt_day), INTERVAL 14 DAY)
  GROUP BY 1,2,3
)
SELECT
  b.opt_day,
  b.customer_id,
  b.page_url,
  b.optimization_type,
  ROUND(b.avg_position_before, 2) AS position_before,
  ROUND(a.avg_position_after, 2) AS position_after,
  ROUND(COALESCE(b.avg_position_before, 0) - COALESCE(a.avg_position_after, 0), 2) AS position_delta,
  b.clicks_before,
  a.clicks_after,
  COALESCE(a.clicks_after, 0) - COALESCE(b.clicks_before, 0) AS clicks_delta,
  b.impressions_before,
  a.impressions_after,
  COALESCE(a.impressions_after, 0) - COALESCE(b.impressions_before, 0) AS impressions_delta,
  -- mognad: har vi tillräckligt med efter-data?
  DATE_DIFF(CURRENT_DATE(), DATE(b.opt_day), DAY) >= 14 AS mature
FROM before_14 b
LEFT JOIN after_14 a USING (opt_day, customer_id, page_url)
ORDER BY b.opt_day DESC;

-- Sammanfattning per optimization_type (vilka typer ger bäst delta?)
CREATE OR REPLACE VIEW `searchboost-485810.seo_data.optimization_impact_by_type` AS
SELECT
  optimization_type,
  COUNT(*) AS n_optimizations,
  COUNTIF(mature) AS n_mature,
  ROUND(AVG(CASE WHEN mature THEN position_delta END), 2) AS avg_position_improvement,
  SUM(CASE WHEN mature THEN clicks_delta ELSE 0 END) AS total_clicks_gained,
  SUM(CASE WHEN mature THEN impressions_delta ELSE 0 END) AS total_impressions_gained,
  ROUND(COUNTIF(mature AND position_delta > 0) / NULLIF(COUNTIF(mature), 0), 3) AS win_rate
FROM `searchboost-485810.seo_data.optimization_impact`
GROUP BY optimization_type
ORDER BY avg_position_improvement DESC;

-- Per kund (vilka kunder får mest värde av optimeringarna?)
CREATE OR REPLACE VIEW `searchboost-485810.seo_data.optimization_impact_by_customer` AS
SELECT
  customer_id,
  COUNT(*) AS n_optimizations,
  COUNTIF(mature) AS n_mature,
  ROUND(AVG(CASE WHEN mature THEN position_delta END), 2) AS avg_position_improvement,
  SUM(CASE WHEN mature THEN clicks_delta ELSE 0 END) AS total_clicks_gained
FROM `searchboost-485810.seo_data.optimization_impact`
GROUP BY customer_id
ORDER BY total_clicks_gained DESC;
