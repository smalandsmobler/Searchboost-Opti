/**
 * MCP Router - Endpoints for MCP integration
 */

import { Router, Request, Response } from 'express';
import { MCPService } from '../services/mcp.service';

export function createMCPRouter(mcpService: MCPService): Router {
  const router = Router();

  /**
   * GET /api/mcp/status
   * Check MCP connection status
   */
  router.get('/status', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        connected: mcpService.isConnected(),
        server: 'seo-mcp-server',
      },
    });
  });

  /**
   * GET /api/mcp/seo/:domain
   * Get SEO data for a domain from MCP server
   */
  router.get('/seo/:domain', async (req: Request, res: Response) => {
    try {
      const { domain } = req.params;

      if (!mcpService.isConnected()) {
        return res.status(503).json({
          success: false,
          error: 'MCP server not connected',
        });
      }

      const seoData = await mcpService.getSEOData(domain);

      res.json({
        success: true,
        data: seoData,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get SEO data',
      });
    }
  });

  /**
   * POST /api/mcp/keywords/suggest
   * Get keyword suggestions from MCP
   */
  router.post('/keywords/suggest', async (req: Request, res: Response) => {
    try {
      const { seed } = req.body;

      if (!seed) {
        return res.status(400).json({
          success: false,
          error: 'seed keyword is required',
        });
      }

      const suggestions = await mcpService.getKeywordSuggestions(seed);

      res.json({
        success: true,
        data: {
          seed,
          suggestions,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get keyword suggestions',
      });
    }
  });

  /**
   * POST /api/mcp/content/analyze
   * Analyze content for SEO via MCP
   */
  router.post('/content/analyze', async (req: Request, res: Response) => {
    try {
      const { content, keywords } = req.body;

      if (!content || !keywords) {
        return res.status(400).json({
          success: false,
          error: 'content and keywords are required',
        });
      }

      const analysis = await mcpService.analyzeContent(content, keywords);

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to analyze content',
      });
    }
  });

  /**
   * POST /api/mcp/competitors
   * Get competitor blog posts via MCP
   */
  router.post('/competitors', async (req: Request, res: Response) => {
    try {
      const { competitors } = req.body;

      if (!competitors || !Array.isArray(competitors)) {
        return res.status(400).json({
          success: false,
          error: 'competitors array is required',
        });
      }

      const posts = await mcpService.getCompetitorPosts(competitors);

      res.json({
        success: true,
        data: {
          competitors,
          posts,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get competitor posts',
      });
    }
  });

  /**
   * POST /api/mcp/track-rankings
   * Track keyword rankings across platforms
   */
  router.post('/track-rankings', async (req: Request, res: Response) => {
    try {
      const { keywords, domains } = req.body;

      if (!keywords || !domains) {
        return res.status(400).json({
          success: false,
          error: 'keywords and domains are required',
        });
      }

      const rankings = await mcpService.trackKeywordRankings(keywords, domains);

      res.json({
        success: true,
        data: rankings,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to track rankings',
      });
    }
  });

  /**
   * POST /api/mcp/tool
   * Generic MCP tool call endpoint
   */
  router.post('/tool', async (req: Request, res: Response) => {
    try {
      const { toolName, args } = req.body;

      if (!toolName) {
        return res.status(400).json({
          success: false,
          error: 'toolName is required',
        });
      }

      const result = await mcpService.callTool(toolName, args || {});

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'MCP tool call failed',
      });
    }
  });

  return router;
}
