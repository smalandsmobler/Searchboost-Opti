interface GoogleAdsOptions {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  developerToken: string;
  customerId: string;
}

export class GoogleAdsClient {
  private options: GoogleAdsOptions;

  constructor(options: GoogleAdsOptions) {
    this.options = options;
  }

  private async getAccessToken(): Promise<string> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.options.clientId,
        client_secret: this.options.clientSecret,
        refresh_token: this.options.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(`Google OAuth error: ${response.status}`);
    }

    const data = (await response.json()) as { access_token: string };
    return data.access_token;
  }

  private async request<T>(endpoint: string, body?: unknown): Promise<T> {
    const accessToken = await this.getAccessToken();
    const url = `https://googleads.googleapis.com/v16/customers/${this.options.customerId}${endpoint}`;

    const response = await fetch(url, {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': this.options.developerToken,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Google Ads API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async getCampaigns() {
    return this.request('/googleAds:searchStream', {
      query: `
        SELECT
          campaign.name,
          campaign.status,
          campaign.id,
          campaign_budget.amount_micros
        FROM campaign
        ORDER BY campaign.name
      `,
    });
  }

  async getCampaignMetrics(dateFrom: string, dateTo: string): Promise<unknown> {
    return this.request('/googleAds:searchStream', {
      query: `
        SELECT
          campaign.name,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.ctr
        FROM campaign
        WHERE segments.date BETWEEN '${dateFrom}' AND '${dateTo}'
        ORDER BY metrics.impressions DESC
      `,
    });
  }

  async getKeywordPerformance(campaignId: string, dateFrom: string, dateTo: string) {
    return this.request('/googleAds:searchStream', {
      query: `
        SELECT
          ad_group_criterion.keyword.text,
          ad_group_criterion.keyword.match_type,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.average_cpc
        FROM keyword_view
        WHERE campaign.id = ${campaignId}
          AND segments.date BETWEEN '${dateFrom}' AND '${dateTo}'
        ORDER BY metrics.impressions DESC
      `,
    });
  }

  async getAdPerformance(dateFrom: string, dateTo: string) {
    return this.request('/googleAds:searchStream', {
      query: `
        SELECT
          ad_group_ad.ad.id,
          ad_group_ad.ad.final_urls,
          ad_group_ad.ad.responsive_search_ad.headlines,
          metrics.impressions,
          metrics.clicks,
          metrics.conversions,
          metrics.cost_micros
        FROM ad_group_ad
        WHERE segments.date BETWEEN '${dateFrom}' AND '${dateTo}'
        ORDER BY metrics.impressions DESC
      `,
    });
  }
}
