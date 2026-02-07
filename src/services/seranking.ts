const SERANKING_BASE_URL = 'https://api4.seranking.com';

interface SERankingOptions {
  apiKey: string;
}

export class SERankingClient {
  private apiKey: string;

  constructor(options: SERankingOptions) {
    this.apiKey = options.apiKey;
  }

  private async request<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${SERANKING_BASE_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Token ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`SE Ranking API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async getAccount() {
    return this.request('/account');
  }

  async getSites() {
    return this.request<{ id: number; name: string; url: string }[]>('/sites');
  }

  async getSiteKeywords(siteId: number) {
    return this.request(`/sites/${siteId}/keywords`);
  }

  async getSiteRankings(siteId: number, dateFrom: string, dateTo: string) {
    return this.request(`/sites/${siteId}/ranking`, { date_from: dateFrom, date_to: dateTo });
  }

  async getSiteAudit(siteId: number) {
    return this.request(`/sites/${siteId}/audit`);
  }

  async getCompetitors(siteId: number) {
    return this.request(`/sites/${siteId}/competitors`);
  }

  async getSearchVolume(keywords: string[], searchEngine: string = 'google', regionId: string = '184') {
    const url = new URL(`${SERANKING_BASE_URL}/volume`);
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Token ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keywords,
        search_engine: searchEngine,
        region_id: regionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`SE Ranking API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}
