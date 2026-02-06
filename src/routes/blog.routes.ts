/**
 * Blog API Routes
 * Endpoints for fetching blog posts from Abicart
 */

import { Router, Request, Response } from 'express';
import { BlogService } from '../services/blog.service';
import { generateSEOMetadata } from '../utils/seo.helper';

export function createBlogRouter(
  blogService: BlogService,
  baseUrl: string
): Router {
  const router = Router();

  /**
   * GET /api/blog
   * Get list of blog posts with optional filters
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const {
        limit = '10',
        offset = '0',
        tag,
        category,
        author,
        search,
      } = req.query;

      const posts = await blogService.getBlogPosts({
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
        tag: tag as string,
        category: category as string,
        author: author as string,
        searchQuery: search as string,
      });

      res.json({
        success: true,
        data: posts,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch blog posts',
      });
    }
  });

  /**
   * POST /api/blog
   * Create a new blog post
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { title, content, excerpt, metaDescription, metaKeywords, author, tags, visible } = req.body;

      // Validate required fields
      if (!title || !content) {
        return res.status(400).json({
          success: false,
          error: 'Title and content are required',
        });
      }

      const post = await blogService.createBlogPost({
        title,
        content,
        excerpt,
        metaDescription,
        metaKeywords,
        author,
        tags,
        visible,
      });

      res.status(201).json({
        success: true,
        message: 'Blog post created successfully',
        data: post,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create blog post',
      });
    }
  });

  /**
   * GET /api/blog/:identifier
   * Get single blog post by UID or slug
   */
  router.get('/:identifier', async (req: Request, res: Response) => {
    try {
      const { identifier } = req.params;

      // Try to fetch by UID first, then by slug
      let post = await blogService.getBlogPost(identifier);

      if (!post) {
        post = await blogService.getBlogPostBySlug(identifier);
      }

      if (!post) {
        return res.status(404).json({
          success: false,
          error: 'Blog post not found',
        });
      }

      res.json({
        success: true,
        data: post,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch blog post',
      });
    }
  });

  /**
   * GET /api/blog/:identifier/seo
   * Get SEO metadata for a blog post
   */
  router.get('/:identifier/seo', async (req: Request, res: Response) => {
    try {
      const { identifier } = req.params;

      // Try to fetch by UID first, then by slug
      let post = await blogService.getBlogPost(identifier);

      if (!post) {
        post = await blogService.getBlogPostBySlug(identifier);
      }

      if (!post) {
        return res.status(404).json({
          success: false,
          error: 'Blog post not found',
        });
      }

      const seoMetadata = generateSEOMetadata(post, baseUrl);

      res.json({
        success: true,
        data: seoMetadata,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate SEO metadata',
      });
    }
  });

  /**
   * PUT /api/blog/:id
   * Update an existing blog post
   */
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, content, excerpt, metaDescription, metaKeywords, visible } = req.body;

      const post = await blogService.updateBlogPost(id, {
        title,
        content,
        excerpt,
        metaDescription,
        metaKeywords,
        visible,
      });

      res.json({
        success: true,
        message: 'Blog post updated successfully',
        data: post,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update blog post',
      });
    }
  });

  /**
   * DELETE /api/blog/:id
   * Delete a blog post
   */
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await blogService.deleteBlogPost(id);

      res.json({
        success: true,
        message: 'Blog post deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete blog post',
      });
    }
  });

  /**
   * POST /api/blog/cache/clear
   * Clear blog cache (admin endpoint)
   */
  router.post('/cache/clear', async (_req: Request, res: Response) => {
    try {
      blogService.clearCache();
      res.json({
        success: true,
        message: 'Blog cache cleared successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to clear cache',
      });
    }
  });

  return router;
}
