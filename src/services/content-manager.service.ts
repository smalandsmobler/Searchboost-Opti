/**
 * Content Manager Service
 * Manages blog post content queue for auto-publishing
 */

import * as fs from 'fs/promises';
import * as path from 'path';

interface BlogContent {
  title: string;
  content: string;
  excerpt?: string;
  metaDescription?: string;
  metaKeywords?: string;
  author?: string;
  tags?: string[];
  published?: boolean;
  publishedAt?: string;
}

export class ContentManager {
  private queueFilePath: string;

  constructor(queueFilePath?: string) {
    this.queueFilePath =
      queueFilePath ||
      path.join(__dirname, '../content/blog-queue.json');
  }

  /**
   * Get the next unpublished blog post from the queue
   */
  async getNextPost(): Promise<BlogContent | null> {
    try {
      const queue = await this.loadQueue();
      const unpublished = queue.find((post) => !post.published);

      return unpublished || null;
    } catch (error) {
      console.error('Failed to get next post:', error);
      return null;
    }
  }

  /**
   * Mark a post as published
   */
  async markAsPublished(title: string): Promise<void> {
    try {
      const queue = await this.loadQueue();
      const post = queue.find((p) => p.title === title);

      if (post) {
        post.published = true;
        post.publishedAt = new Date().toISOString();
        await this.saveQueue(queue);
      }
    } catch (error) {
      console.error('Failed to mark post as published:', error);
    }
  }

  /**
   * Add a new post to the queue
   */
  async addPost(post: BlogContent): Promise<void> {
    try {
      const queue = await this.loadQueue();
      queue.push({ ...post, published: false });
      await this.saveQueue(queue);
    } catch (error) {
      console.error('Failed to add post to queue:', error);
      throw error;
    }
  }

  /**
   * Get all posts in the queue
   */
  async getAllPosts(): Promise<BlogContent[]> {
    return this.loadQueue();
  }

  /**
   * Get count of unpublished posts
   */
  async getUnpublishedCount(): Promise<number> {
    const queue = await this.loadQueue();
    return queue.filter((post) => !post.published).length;
  }

  /**
   * Load the queue from file
   */
  private async loadQueue(): Promise<BlogContent[]> {
    try {
      const data = await fs.readFile(this.queueFilePath, 'utf-8');
      return JSON.parse(data);
    } catch (error: any) {
      // If file doesn't exist, return empty array
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Save the queue to file
   */
  private async saveQueue(queue: BlogContent[]): Promise<void> {
    await fs.writeFile(
      this.queueFilePath,
      JSON.stringify(queue, null, 2),
      'utf-8'
    );
  }

  /**
   * Reset all posts to unpublished (for testing)
   */
  async resetQueue(): Promise<void> {
    const queue = await this.loadQueue();
    queue.forEach((post) => {
      post.published = false;
      delete post.publishedAt;
    });
    await this.saveQueue(queue);
  }
}
