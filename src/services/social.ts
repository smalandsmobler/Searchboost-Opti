// ---- Facebook / Instagram (Meta) ----

interface MetaOptions {
  accessToken: string;
  pageId: string;
}

export class MetaClient {
  private accessToken: string;
  private pageId: string;

  constructor(options: MetaOptions) {
    this.accessToken = options.accessToken;
    this.pageId = options.pageId;
  }

  private async request<T>(endpoint: string): Promise<T> {
    const url = `https://graph.facebook.com/v19.0${endpoint}`;
    const separator = endpoint.includes('?') ? '&' : '?';

    const response = await fetch(`${url}${separator}access_token=${this.accessToken}`);

    if (!response.ok) {
      throw new Error(`Meta API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async getPageInsights(period = 'day', dateFrom?: string, dateTo?: string) {
    let endpoint = `/${this.pageId}/insights?metric=page_impressions,page_engaged_users,page_fans,page_views_total&period=${period}`;
    if (dateFrom && dateTo) {
      endpoint += `&since=${dateFrom}&until=${dateTo}`;
    }
    return this.request(endpoint);
  }

  async getPagePosts(limit = 10) {
    return this.request(
      `/${this.pageId}/posts?fields=id,message,created_time,shares,likes.summary(true),comments.summary(true)&limit=${limit}`,
    );
  }

  async getPostInsights(postId: string) {
    return this.request(
      `/${postId}/insights?metric=post_impressions,post_engaged_users,post_clicks`,
    );
  }

  async getInstagramAccount() {
    return this.request(
      `/${this.pageId}?fields=instagram_business_account{id,username,followers_count,media_count}`,
    );
  }

  async getInstagramMedia(igAccountId: string, limit = 10) {
    return this.request(
      `/${igAccountId}/media?fields=id,caption,media_type,timestamp,like_count,comments_count,impressions,reach&limit=${limit}`,
    );
  }

  async getInstagramInsights(igAccountId: string, period = 'day') {
    return this.request(
      `/${igAccountId}/insights?metric=impressions,reach,follower_count&period=${period}`,
    );
  }
}

// ---- LinkedIn ----

interface LinkedInOptions {
  accessToken: string;
  organizationId: string;
}

export class LinkedInClient {
  private accessToken: string;
  private organizationId: string;

  constructor(options: LinkedInOptions) {
    this.accessToken = options.accessToken;
    this.organizationId = options.organizationId;
  }

  private async request<T>(endpoint: string): Promise<T> {
    const url = `https://api.linkedin.com/v2${endpoint}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    if (!response.ok) {
      throw new Error(`LinkedIn API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async getOrganization() {
    return this.request(`/organizations/${this.organizationId}`);
  }

  async getFollowerStats() {
    return this.request(
      `/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${this.organizationId}`,
    );
  }

  async getPageStats(dateFrom: string, dateTo: string) {
    return this.request(
      `/organizationPageStatistics?q=organization&organization=urn:li:organization:${this.organizationId}&timeIntervals.timeGranularityType=DAY&timeIntervals.timeRange.start=${dateFrom}&timeIntervals.timeRange.end=${dateTo}`,
    );
  }

  async getShareStats(dateFrom: string, dateTo: string) {
    return this.request(
      `/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${this.organizationId}&timeIntervals.timeGranularityType=DAY&timeIntervals.timeRange.start=${dateFrom}&timeIntervals.timeRange.end=${dateTo}`,
    );
  }

  async getPosts(count = 10) {
    return this.request(
      `/ugcPosts?q=authors&authors=List(urn:li:organization:${this.organizationId})&count=${count}`,
    );
  }
}
