/**
 * Blog Service
 * Handles blog operations with caching and SEO optimization
 */

import NodeCache from 'node-cache';
import { AbicartClient } from './abicart.client';
import {
  AbicartBlogPost,
  BlogPostFilters,
  BlogPostsResponse,
} from '../types/abicart.types';

export class BlogService {
  private abicartClient: AbicartClient;
  private cache: NodeCache;
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(abicartClient: AbicartClient) {
    this.abicartClient = abicartClient;
    // Cache TTL: 5 minutes, check period: 60 seconds
    this.cache = new NodeCache({ stdTTL: this.CACHE_TTL, checkperiod: 60 });
  }

  /**
   * Get blog posts with optional filters
   */
  async getBlogPosts(
    filters: BlogPostFilters = {}
  ): Promise<BlogPostsResponse> {
    const cacheKey = `blog_posts_${JSON.stringify(filters)}`;
    const cached = this.cache.get<BlogPostsResponse>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const { limit = 10, offset = 0, searchQuery } = filters;

      let result;
      if (searchQuery) {
        result = await this.abicartClient.searchBlogArticles(
          searchQuery,
          limit
        );
      } else {
        result = await this.abicartClient.getBlogArticles({
          limit,
          offset,
          filters: {
            ...(filters.tag && { tag: filters.tag }),
            ...(filters.category && { category: filters.category }),
            ...(filters.author && { author: filters.author }),
          },
        });
      }

      // Transform and enrich the data
      const posts = this.transformBlogPosts(result);
      const response: BlogPostsResponse = {
        posts,
        total: posts.length,
        limit,
        offset,
      };

      this.cache.set(cacheKey, response);
      return response;
    } catch (error) {
      throw new Error(
        `Failed to fetch blog posts: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get single blog post by UID
   */
  async getBlogPost(uid: string): Promise<AbicartBlogPost | null> {
    const cacheKey = `blog_post_${uid}`;
    const cached = this.cache.get<AbicartBlogPost>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const result = await this.abicartClient.getBlogArticle(uid);
      const post = this.transformBlogPost(result);

      if (post) {
        this.cache.set(cacheKey, post);
      }

      return post;
    } catch (error) {
      throw new Error(
        `Failed to fetch blog post: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get blog post by slug (URL-friendly identifier)
   */
  async getBlogPostBySlug(slug: string): Promise<AbicartBlogPost | null> {
    const cacheKey = `blog_post_slug_${slug}`;
    const cached = this.cache.get<AbicartBlogPost>(cacheKey);

    if (cached) {
      return cached;
    }

    // Search for post with matching slug
    const posts = await this.getBlogPosts({ searchQuery: slug, limit: 1 });

    if (posts.posts.length > 0) {
      const post = posts.posts[0];
      this.cache.set(cacheKey, post);
      return post;
    }

    return null;
  }

  /**
   * Create a new blog post
   */
  async createBlogPost(data: {
    title: string;
    content: string;
    excerpt?: string;
    metaDescription?: string;
    metaKeywords?: string;
    author?: string;
    tags?: string[];
    visible?: boolean;
  }): Promise<AbicartBlogPost> {
    try {
      // Prepare article data for Abicart
      const articleData = {
        name: data.title,
        text: data.content,
        description: data.excerpt || this.generateExcerpt(data.content),
        metaDescription:
          data.metaDescription || this.generateExcerpt(data.content, 160),
        metaKeywords: data.metaKeywords || data.tags?.join(', ') || '',
        visible: data.visible !== undefined ? data.visible : true,
        articleType: 'blog',
      };

      // Create new article (uid = null for new)
      const result = await this.abicartClient.createOrUpdateBlogArticle(
        null,
        articleData
      );

      // Clear cache after creating
      this.clearCache();

      return this.transformBlogPost(result) as AbicartBlogPost;
    } catch (error) {
      throw new Error(
        `Failed to create blog post: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update an existing blog post
   */
  async updateBlogPost(
    uid: string | number,
    data: {
      title?: string;
      content?: string;
      excerpt?: string;
      metaDescription?: string;
      metaKeywords?: string;
      visible?: boolean;
    }
  ): Promise<AbicartBlogPost> {
    try {
      // Prepare update data
      const updateData: any = {};

      if (data.title) updateData.name = data.title;
      if (data.content) updateData.text = data.content;
      if (data.excerpt) updateData.description = data.excerpt;
      if (data.metaDescription)
        updateData.metaDescription = data.metaDescription;
      if (data.metaKeywords) updateData.metaKeywords = data.metaKeywords;
      if (data.visible !== undefined) updateData.visible = data.visible;

      // Update article
      const result = await this.abicartClient.createOrUpdateBlogArticle(
        uid,
        updateData
      );

      // Clear cache after updating
      this.clearCache();

      return this.transformBlogPost(result) as AbicartBlogPost;
    } catch (error) {
      throw new Error(
        `Failed to update blog post: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete a blog post
   */
  async deleteBlogPost(uid: string | number): Promise<void> {
    try {
      await this.abicartClient.deleteBlogArticle(uid);

      // Clear cache after deleting
      this.clearCache();
    } catch (error) {
      throw new Error(
        `Failed to delete blog post: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Clear cache (useful for manual refresh)
   */
  clearCache(): void {
    this.cache.flushAll();
  }

  /**
   * Transform Abicart blog post data to our format
   */
  private transformBlogPost(data: any): AbicartBlogPost | null {
    if (!data) return null;

    return {
      uid: data.uid || data.id,
      name: data.name || data.title,
      title: data.title || data.name,
      content: data.content || data.text || '',
      excerpt:
        data.excerpt || data.description || this.generateExcerpt(data.content),
      metaDescription: data.metaDescription || data.description || '',
      metaKeywords: data.metaKeywords || '',
      author: data.author || 'Smålandsmöbler',
      publishedDate: data.publishedDate || data.created || data.date,
      modifiedDate: data.modifiedDate || data.modified || data.updated,
      imageUrl: data.imageUrl || data.image || data.thumbnail,
      slug: data.slug || this.generateSlug(data.name || data.title),
      tags: data.tags || [],
      categories: data.categories || [],
      seoTitle: data.seoTitle || data.title || data.name,
      canonicalUrl: data.canonicalUrl || '',
    };
  }

  /**
   * Transform array of blog posts
   */
  private transformBlogPosts(data: any): AbicartBlogPost[] {
    if (!data) return [];
    if (Array.isArray(data)) {
      return data
        .map((item: any) => this.transformBlogPost(item))
        .filter((post: AbicartBlogPost | null): post is AbicartBlogPost => post !== null);
    }
    if (data.items && Array.isArray(data.items)) {
      return data.items
        .map((item: any) => this.transformBlogPost(item))
        .filter((post: AbicartBlogPost | null): post is AbicartBlogPost => post !== null);
    }
    return [];
  }

  /**
   * Generate excerpt from content
   */
  private generateExcerpt(content: string, maxLength = 160): string {
    if (!content) return '';
    const text = content.replace(/<[^>]*>/g, '').trim();
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  /**
   * Generate URL-friendly slug
   */
  private generateSlug(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/å/g, 'a')
      .replace(/ä/g, 'a')
      .replace(/ö/g, 'o')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
