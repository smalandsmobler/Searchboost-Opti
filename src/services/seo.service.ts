/**
 * SEO Service - Google Search Console & Analytics Integration
 * Provides SEO insights, keyword tracking, and analytics
 */

import axios from 'axios';

export interface GSCQuery {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCPageData {
  url: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SEOMetrics {
  totalClicks: number;
  totalImpressions: number;
  averageCTR: number;
  averagePosition: number;
  topQueries: GSCQuery[];
  topPages: GSCPageData[];
}

export class SEOService {
  private gscApiKey: string;
  private siteUrl: string;
  private serankingApiKey?: string;

  constructor(config: {
    gscApiKey: string;
    siteUrl: string;
    serankingApiKey?: string;
  }) {
    this.gscApiKey = config.gscApiKey;
    this.siteUrl = config.siteUrl;
    this.serankingApiKey = config.serankingApiKey;
  }

  /**
   * Get Search Console data for date range
   */
  async getSearchConsoleData(
    startDate: string,
    endDate: string
  ): Promise<SEOMetrics> {
    try {
      const response = await axios.post(
        `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(this.siteUrl)}/searchAnalytics/query`,
        {
          startDate,
          endDate,
          dimensions: ['query', 'page'],
          rowLimit: 100,
        },
        {
          headers: {
            Authorization: `Bearer ${this.gscApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const rows = response.data.rows || [];

      // Aggregate data
      const queryMap = new Map<string, GSCQuery>();
      const pageMap = new Map<string, GSCPageData>();

      let totalClicks = 0;
      let totalImpressions = 0;
      let totalPosition = 0;

      rows.forEach((row: any) => {
        const query = row.keys[0];
        const page = row.keys[1];

        totalClicks += row.clicks;
        totalImpressions += row.impressions;
        totalPosition += row.position;

        // Aggregate by query
        if (!queryMap.has(query)) {
          queryMap.set(query, {
            keys: [query],
            clicks: 0,
            impressions: 0,
            ctr: 0,
            position: 0,
          });
        }
        const queryData = queryMap.get(query)!;
        queryData.clicks += row.clicks;
        queryData.impressions += row.impressions;

        // Aggregate by page
        if (!pageMap.has(page)) {
          pageMap.set(page, {
            url: page,
            clicks: 0,
            impressions: 0,
            ctr: 0,
            position: 0,
          });
        }
        const pageData = pageMap.get(page)!;
        pageData.clicks += row.clicks;
        pageData.impressions += row.impressions;
      });

      // Calculate CTR and averages
      queryMap.forEach((data) => {
        data.ctr = data.clicks / data.impressions;
      });

      pageMap.forEach((data) => {
        data.ctr = data.clicks / data.impressions;
      });

      const topQueries = Array.from(queryMap.values())
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 20);

      const topPages = Array.from(pageMap.values())
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 20);

      return {
        totalClicks,
        totalImpressions,
        averageCTR: totalClicks / totalImpressions,
        averagePosition: totalPosition / rows.length,
        topQueries,
        topPages,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch GSC data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get SEranking keyword data
   */
  async getSERankingData(keywords: string[]): Promise<any> {
    if (!this.serankingApiKey) {
      throw new Error('SEranking API key not configured');
    }

    try {
      const response = await axios.post(
        'https://api4.seranking.com/research/keywords',
        {
          keywords,
          location: 'se', // Sweden
        },
        {
          headers: {
            Authorization: `Token ${this.serankingApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to fetch SEranking data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate SEO report for a blog post
   */
  async generateBlogPostReport(url: string): Promise<{
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    topKeywords: string[];
  }> {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const startDate = thirtyDaysAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    const data = await this.getSearchConsoleData(startDate, endDate);

    const pageData = data.topPages.find((p) => p.url === url);

    if (!pageData) {
      return {
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: 0,
        topKeywords: [],
      };
    }

    // Get top keywords for this page
    const topKeywords = data.topQueries
      .filter((q) => q.keys[0]) // Filter out empty queries
      .slice(0, 10)
      .map((q) => q.keys[0]);

    return {
      clicks: pageData.clicks,
      impressions: pageData.impressions,
      ctr: pageData.ctr,
      position: pageData.position,
      topKeywords,
    };
  }
}
