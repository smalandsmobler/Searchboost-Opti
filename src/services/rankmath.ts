interface RankMathOptions {
  siteUrl: string;
  apiKey: string;
}

interface RankMathSeoMeta {
  title?: string;
  description?: string;
  focusKeyword?: string;
  robots?: string[];
  canonical?: string;
}

export class RankMathClient {
  private siteUrl: string;
  private authHeader: string;

  constructor(options: RankMathOptions) {
    this.siteUrl = options.siteUrl.replace(/\/$/, '');
    this.authHeader = `Basic ${Buffer.from(`rankmath:${options.apiKey}`).toString('base64')}`;
  }

  private async request<T>(endpoint: string, method = 'GET', body?: unknown): Promise<T> {
    const url = `${this.siteUrl}/wp-json${endpoint}`;

    const headers: Record<string, string> = {
      Authorization: this.authHeader,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`RankMath API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async getPosts(perPage = 10, page = 1) {
    return this.request(`/wp/v2/posts?per_page=${perPage}&page=${page}`);
  }

  async getPages(perPage = 10, page = 1) {
    return this.request(`/wp/v2/pages?per_page=${perPage}&page=${page}`);
  }

  async getPostSeoMeta(postId: number) {
    return this.request(`/rankmath/v1/getHead?url=${this.siteUrl}/?p=${postId}`);
  }

  async updatePostSeoMeta(postId: number, meta: RankMathSeoMeta) {
    const wpMeta: Record<string, string> = {};

    if (meta.title) wpMeta['rank_math_title'] = meta.title;
    if (meta.description) wpMeta['rank_math_description'] = meta.description;
    if (meta.focusKeyword) wpMeta['rank_math_focus_keyword'] = meta.focusKeyword;
    if (meta.canonical) wpMeta['rank_math_canonical_url'] = meta.canonical;
    if (meta.robots) wpMeta['rank_math_robots'] = meta.robots.join(',');

    return this.request(`/wp/v2/posts/${postId}`, 'POST', { meta: wpMeta });
  }

  async updatePageSeoMeta(pageId: number, meta: RankMathSeoMeta) {
    const wpMeta: Record<string, string> = {};

    if (meta.title) wpMeta['rank_math_title'] = meta.title;
    if (meta.description) wpMeta['rank_math_description'] = meta.description;
    if (meta.focusKeyword) wpMeta['rank_math_focus_keyword'] = meta.focusKeyword;
    if (meta.canonical) wpMeta['rank_math_canonical_url'] = meta.canonical;
    if (meta.robots) wpMeta['rank_math_robots'] = meta.robots.join(',');

    return this.request(`/wp/v2/pages/${pageId}`, 'POST', { meta: wpMeta });
  }

  async getSiteHealth() {
    return this.request('/rankmath/v1/status');
  }
}
