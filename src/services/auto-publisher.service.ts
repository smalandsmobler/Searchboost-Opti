/**
 * Auto-Publishing Scheduler
 * Automatically publishes blog posts daily to Abicart
 */

import * as cron from 'node-cron';
import { BlogService } from './blog.service';
import { ContentManager } from './content-manager.service';

export class AutoPublisher {
  private blogService: BlogService;
  private contentManager: ContentManager;
  private cronJob: cron.ScheduledTask | null = null;

  constructor(blogService: BlogService, contentManager?: ContentManager) {
    this.blogService = blogService;
    this.contentManager = contentManager || new ContentManager();
  }

  /**
   * Start the auto-publishing scheduler
   * Default: Every day at 9:00 AM
   * Cron format: minute hour day month dayOfWeek
   */
  start(cronSchedule: string = '0 9 * * *'): void {
    if (this.cronJob) {
      console.log('⚠️  Auto-publisher is already running');
      return;
    }

    // Validate cron schedule
    if (!cron.validate(cronSchedule)) {
      throw new Error(`Invalid cron schedule: ${cronSchedule}`);
    }

    this.cronJob = cron.schedule(cronSchedule, async () => {
      console.log('🤖 Auto-publisher: Starting daily blog post...');
      try {
        await this.publishDailyBlogPost();
        console.log('✅ Auto-publisher: Successfully published blog post');
      } catch (error) {
        console.error(
          '❌ Auto-publisher error:',
          error instanceof Error ? error.message : error
        );
      }
    });

    console.log(
      `✅ Auto-publisher started with schedule: ${cronSchedule} (${this.getScheduleDescription(cronSchedule)})`
    );
  }

  /**
   * Stop the auto-publishing scheduler
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('🛑 Auto-publisher stopped');
    }
  }

  /**
   * Publish a daily blog post
   * This method should be customized based on your content source
   */
  private async publishDailyBlogPost(): Promise<void> {
    // Get blog content from your source
    const blogContent = await this.getDailyBlogContent();

    if (!blogContent) {
      console.log('⚠️  No blog content available for today');
      return;
    }

    // Publish to Abicart
    await this.blogService.createBlogPost({
      title: blogContent.title,
      content: blogContent.content,
      excerpt: blogContent.excerpt,
      metaDescription: blogContent.metaDescription,
      metaKeywords: blogContent.metaKeywords,
      author: blogContent.author || 'Smålandsmöbler',
      tags: blogContent.tags,
      visible: true,
    });

    console.log(`📝 Published: "${blogContent.title}"`);
  }

  /**
   * Get daily blog content from content manager
   */
  private async getDailyBlogContent(): Promise<{
    title: string;
    content: string;
    excerpt?: string;
    metaDescription?: string;
    metaKeywords?: string;
    author?: string;
    tags?: string[];
  } | null> {
    // Get next unpublished post from queue
    const post = await this.contentManager.getNextPost();

    if (post) {
      // Mark as published after retrieving
      await this.contentManager.markAsPublished(post.title);
      return post;
    }

    // No posts in queue - log warning
    console.warn('⚠️  No blog posts in queue for publishing');
    return null;
  }

  /**
   * Get publishing queue status
   */
  async getQueueStatus(): Promise<{
    totalPosts: number;
    unpublished: number;
    published: number;
  }> {
    const allPosts = await this.contentManager.getAllPosts();
    const unpublished = await this.contentManager.getUnpublishedCount();

    return {
      totalPosts: allPosts.length,
      unpublished,
      published: allPosts.length - unpublished,
    };
  }

  /**
   * Manually trigger a blog post publication
   */
  async publishNow(): Promise<void> {
    console.log('🚀 Manual publish triggered...');
    await this.publishDailyBlogPost();
  }

  /**
   * Get human-readable schedule description
   */
  private getScheduleDescription(cronSchedule: string): string {
    const schedules: Record<string, string> = {
      '0 9 * * *': 'Every day at 09:00',
      '0 12 * * *': 'Every day at 12:00',
      '0 0 * * *': 'Every day at midnight',
      '0 8 * * 1': 'Every Monday at 08:00',
      '*/30 * * * *': 'Every 30 minutes',
    };

    return schedules[cronSchedule] || cronSchedule;
  }
}
