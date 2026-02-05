/**
 * Abicart JSON-RPC 2.0 API Client
 * Connects to Abicart e-commerce platform
 */

import axios, { AxiosInstance } from 'axios';
import {
  AbicartConfig,
  JsonRpcRequest,
  JsonRpcResponse,
} from '../types/abicart.types';

export class AbicartClient {
  private client: AxiosInstance;
  private requestId: number = 1;
  private config: AbicartConfig;

  constructor(config: AbicartConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      timeout: 10000,
    });
  }

  /**
   * Make a JSON-RPC 2.0 request to Abicart API
   */
  async request<T>(
    method: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    const payload: JsonRpcRequest = {
      jsonrpc: '2.0',
      method,
      params: params || {},
      id: this.requestId++,
    };

    try {
      const response = await this.client.post<JsonRpcResponse<T>>('', payload);

      if (response.data.error) {
        throw new Error(
          `Abicart API Error: ${response.data.error.message} (Code: ${response.data.error.code})`
        );
      }

      if (!response.data.result) {
        throw new Error('Abicart API returned no result');
      }

      return response.data.result;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Abicart API Request Failed: ${error.message}${
            error.response ? ` - Status: ${error.response.status}` : ''
          }`
        );
      }
      throw error;
    }
  }

  /**
   * Get blog articles from Abicart
   */
  async getBlogArticles(params?: {
    limit?: number;
    offset?: number;
    filters?: Record<string, unknown>;
  }) {
    return this.request('Article.list', {
      articleType: 'blog',
      ...params,
    });
  }

  /**
   * Get single blog article by UID
   */
  async getBlogArticle(uid: string) {
    return this.request('Article.get', { uid });
  }

  /**
   * Search blog articles
   */
  async searchBlogArticles(query: string, limit = 10) {
    return this.request('Article.search', {
      query,
      articleType: 'blog',
      limit,
    });
  }
}
