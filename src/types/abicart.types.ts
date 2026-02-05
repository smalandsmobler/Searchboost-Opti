/**
 * Abicart API Types
 * Based on Abicart JSON-RPC 2.0 API
 */

export interface AbicartConfig {
  apiUrl: string;
  apiKey: string;
  shopId: string;
}

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
  id: number | string;
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id: number | string;
}

export interface AbicartBlogPost {
  uid: string;
  name: string;
  title: string;
  content: string;
  excerpt?: string;
  metaDescription?: string;
  metaKeywords?: string;
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
  imageUrl?: string;
  slug?: string;
  tags?: string[];
  categories?: string[];
  seoTitle?: string;
  canonicalUrl?: string;
}

export interface BlogPostFilters {
  limit?: number;
  offset?: number;
  tag?: string;
  category?: string;
  author?: string;
  searchQuery?: string;
}

export interface BlogPostsResponse {
  posts: AbicartBlogPost[];
  total: number;
  limit: number;
  offset: number;
}
