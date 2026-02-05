/**
 * Abicart JSON-RPC 2.0 API Client
 * Connects to Abicart e-commerce platform
 * Based on official API documentation: https://developer.abicart.se/
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

    // Build URL with auth context parameter
    const baseUrl = config.apiUrl.endsWith('/')
      ? config.apiUrl
      : `${config.apiUrl}/`;

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
      // Add auth token as GET parameter (Abicart's authentication method)
      params: {
        auth: config.apiKey,
      },
    });
  }

  /**
   * Make a JSON-RPC 2.0 request to Abicart API
   * @param method - API method in dot notation (e.g., "Article.list")
   * @param params - Array of parameters for the method
   */
  async request<T>(method: string, params?: any[]): Promise<T> {
    const payload: JsonRpcRequest = {
      jsonrpc: '2.0',
      method,
      params: params || [],
      id: this.requestId++,
    };

    try {
      const response = await this.client.post<JsonRpcResponse<T>>('', payload);

      if (response.data.error) {
        throw new Error(
          `Abicart API Error: ${response.data.error.message} (Code: ${response.data.error.code})`
        );
      }

      if (response.data.result === undefined) {
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
   * Get blog articles from Abicart using Article.list
   * Example: Article.list(["uid", "name", "text"], { "filters": {...}, "limit": 10 })
   *
   * @param selection - Fields to return (e.g., ["uid", "name", "text"])
   * @param options - Query options (filters, limit, offset)
   */
  async getBlogArticles(options?: {
    limit?: number;
    offset?: number;
    filters?: Record<string, any>;
  }) {
    // Selection: which fields to return
    const selection = [
      'uid',
      'name',
      'text',
      'description',
      'metaDescription',
      'metaKeywords',
      'created',
      'modified',
      'images',
      'articleNumber',
    ];

    // Options: filters, limit, offset
    const queryOptions: any = {
      limit: options?.limit || 10,
      offset: options?.offset || 0,
    };

    if (options?.filters) {
      queryOptions.filters = options.filters;
    }

    return this.request('Article.list', [selection, queryOptions]);
  }

  /**
   * Get single blog article by UID
   * Example: Article.get(1234567, ["hidden", "name", "weight"])
   *
   * @param uid - Article UID
   * @param fields - Fields to return
   */
  async getBlogArticle(uid: string | number) {
    const fields = [
      'uid',
      'name',
      'text',
      'description',
      'metaDescription',
      'metaKeywords',
      'created',
      'modified',
      'images',
      'articleNumber',
      'articleType',
    ];

    return this.request('Article.get', [uid, fields]);
  }

  /**
   * Search blog articles using the search filter
   * Example: Article.list(["uid", "name"], { "filters": { "search": { "term": "kottar", "relevance": 100 } }, "limit": 4 })
   *
   * @param searchTerm - Search query
   * @param limit - Maximum results
   */
  async searchBlogArticles(searchTerm: string, limit = 10) {
    const selection = [
      'uid',
      'name',
      'text',
      'description',
      'metaDescription',
      'created',
      'modified',
      'images',
    ];

    const options = {
      filters: {
        search: {
          term: searchTerm,
          relevance: 100,
        },
      },
      limit,
    };

    return this.request('Article.list', [selection, options]);
  }
}
