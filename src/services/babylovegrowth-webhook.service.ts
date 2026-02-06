/**
 * BabyLoveGrowth Webhook Service
 * Receives blog posts from babylovesgrowth.ai and transforms them for Abicart
 */

import { BlogService } from './blog.service';

export interface BabyLoveGrowthWebhookPayload {
  title: string;
  slug?: string;
  content_html?: string;
  content_markdown?: string;
  metaDescription?: string;
  heroImageUrl?: string;
  status?: 'publish' | 'draft' | 'pending';
  // Additional fields that might be sent
  tags?: string[];
  categories?: string[];
  author?: string;
  publishedAt?: string;
}

export class BabyLoveGrowthWebhookService {
  constructor(private blogService: BlogService) {}

  /**
   * Process incoming webhook from babylovesgrowth.ai
   */
  async processWebhook(payload: BabyLoveGrowthWebhookPayload): Promise<{
    success: boolean;
    postId?: string;
    error?: string;
  }> {
    try {
      console.log('📥 Received webhook from BabyLoveGrowth:', {
        title: payload.title,
        status: payload.status,
        hasContent: !!(payload.content_html || payload.content_markdown),
      });

      // Validate payload
      if (!payload.title) {
        throw new Error('Missing required field: title');
      }

      if (!payload.content_html && !payload.content_markdown) {
        throw new Error('Missing content (need content_html or content_markdown)');
      }

      // Transform to Abicart format
      const abicartPost = this.transformToAbicartFormat(payload);

      // Determine if we should publish or save as draft
      const shouldPublish = payload.status === 'publish';

      // Create blog post in Abicart
      const result = await this.blogService.createBlogPost({
        ...abicartPost,
        visible: shouldPublish,
      });

      console.log('✅ Successfully published to Abicart:', {
        postId: result.uid,
        title: result.title,
        published: shouldPublish,
      });

      return {
        success: true,
        postId: result.uid,
      };
    } catch (error) {
      console.error('❌ Failed to process BabyLoveGrowth webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Transform BabyLoveGrowth payload to Abicart blog post format
   */
  private transformToAbicartFormat(payload: BabyLoveGrowthWebhookPayload): {
    title: string;
    content: string;
    excerpt?: string;
    tags?: string[];
    metaTitle?: string;
    metaDescription?: string;
    slug?: string;
    featuredImage?: string;
  } {
    // Prefer HTML content over Markdown
    const content = payload.content_html || payload.content_markdown || '';

    // Extract excerpt from metaDescription or first 200 chars of content
    const excerpt =
      payload.metaDescription ||
      this.extractExcerpt(content);

    // Clean up tags
    const tags = payload.tags?.filter(Boolean) || [];

    return {
      title: payload.title,
      content: content,
      excerpt: excerpt,
      tags: tags,
      metaTitle: payload.title,
      metaDescription: payload.metaDescription,
      slug: payload.slug,
      featuredImage: payload.heroImageUrl,
    };
  }

  /**
   * Extract excerpt from HTML/Markdown content
   */
  private extractExcerpt(content: string, maxLength: number = 200): string {
    // Remove HTML tags
    const textOnly = content.replace(/<[^>]*>/g, ' ');

    // Remove extra whitespace
    const cleaned = textOnly.replace(/\s+/g, ' ').trim();

    // Truncate to maxLength
    if (cleaned.length <= maxLength) {
      return cleaned;
    }

    // Find last space within maxLength
    const truncated = cleaned.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > 0) {
      return truncated.substring(0, lastSpace) + '...';
    }

    return truncated + '...';
  }

  /**
   * Validate webhook signature (if babylovesgrowth.ai provides one)
   */
  validateSignature(payload: string, signature: string, secret: string): boolean {
    // TODO: Implement if babylovesgrowth.ai provides webhook signatures
    // For now, we rely on API key authentication
    return true;
  }
}
