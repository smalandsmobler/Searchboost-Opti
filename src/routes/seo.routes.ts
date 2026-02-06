/**
 * SEO API Routes
 * Endpoints for SEO analytics, internal linking, and structured data
 */

import { Router, Request, Response } from 'express';
import { SEOService } from '../services/seo.service';
import { InternalLinkingService } from '../services/internal-linking.service';
import { StructuredDataService } from '../services/structured-data.service';
import { BlogService } from '../services/blog.service';

export function createSEORouter(
  blogService: BlogService,
  seoService: SEOService,
  baseUrl: string
): Router {
  const router = Router();
  const internalLinking = new InternalLinkingService();
  const structuredData = new StructuredDataService();

  /**
   * GET /api/seo/gsc
   * Get Google Search Console data
   */
  router.get('/gsc', async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'startDate and endDate are required (format: YYYY-MM-DD)',
        });
      }

      const data = await seoService.getSearchConsoleData(
        startDate as string,
        endDate as string
      );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch GSC data',
      });
    }
  });

  /**
   * GET /api/seo/report/:id
   * Get SEO report for a specific blog post
   */
  router.get('/report/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Get blog post
      const post = await blogService.getBlogPost(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          error: 'Blog post not found',
        });
      }

      const url = post.canonicalUrl || `${baseUrl}/blog/${post.slug}`;

      // Get SEO report
      const report = await seoService.generateBlogPostReport(url);

      res.json({
        success: true,
        data: {
          post: {
            id: post.uid,
            title: post.title,
            url,
          },
          seo: report,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate SEO report',
      });
    }
  });

  /**
   * GET /api/seo/internal-links
   * Get internal linking suggestions
   */
  router.get('/internal-links', async (req: Request, res: Response) => {
    try {
      const { limit = '50' } = req.query;

      // Get all blog posts
      const posts = await blogService.getBlogPosts({ limit: 100 });

      // Generate suggestions
      const suggestions = internalLinking.suggestInternalLinks(posts.posts);

      res.json({
        success: true,
        data: {
          suggestions: suggestions.slice(0, parseInt(limit as string, 10)),
          total: suggestions.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate internal link suggestions',
      });
    }
  });

  /**
   * POST /api/seo/internal-links/apply
   * Automatically apply internal links to a blog post
   */
  router.post('/internal-links/apply', async (req: Request, res: Response) => {
    try {
      const { postId, targetPostId, anchorText } = req.body;

      if (!postId || !targetPostId || !anchorText) {
        return res.status(400).json({
          success: false,
          error: 'postId, targetPostId, and anchorText are required',
        });
      }

      // Get posts
      const sourcePost = await blogService.getBlogPost(postId);
      const targetPost = await blogService.getBlogPost(targetPostId);

      if (!sourcePost || !targetPost) {
        return res.status(404).json({
          success: false,
          error: 'One or both posts not found',
        });
      }

      // Insert link
      const targetUrl = targetPost.canonicalUrl || `${baseUrl}/blog/${targetPost.slug}`;
      const updatedContent = internalLinking.insertInternalLink(
        sourcePost.content,
        anchorText,
        targetUrl
      );

      // Update post
      await blogService.updateBlogPost(postId, {
        content: updatedContent,
      });

      res.json({
        success: true,
        message: 'Internal link applied successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to apply internal link',
      });
    }
  });

  /**
   * GET /api/seo/sitemap
   * Generate XML sitemap with internal linking structure
   */
  router.get('/sitemap', async (req: Request, res: Response) => {
    try {
      const posts = await blogService.getBlogPosts({ limit: 1000 });
      const sitemap = internalLinking.generateSitemap(posts.posts);

      res.header('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to generate sitemap',
      });
    }
  });

  /**
   * GET /api/seo/structured-data/:id
   * Get structured data (Schema.org) for a blog post
   */
  router.get('/structured-data/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const post = await blogService.getBlogPost(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          error: 'Blog post not found',
        });
      }

      const breadcrumbs = [
        { name: 'Hem', url: baseUrl },
        { name: 'Blogg', url: `${baseUrl}/blog` },
        { name: post.title, url: `${baseUrl}/blog/${post.slug}` },
      ];

      const schemas = structuredData.generateComprehensiveSchema(
        post,
        baseUrl,
        breadcrumbs
      );

      res.json({
        success: true,
        data: {
          schemas,
          htmlSnippet: `<script type="application/ld+json">\n${JSON.stringify(schemas, null, 2)}\n</script>`,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate structured data',
      });
    }
  });

  return router;
}
