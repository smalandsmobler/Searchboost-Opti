/**
 * MCP Service - Model Context Protocol Integration
 * Connects to seo-mcp-server for unified SEO data
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface MCPConfig {
  serverCommand: string;
  serverArgs?: string[];
  enabled: boolean;
}

export interface SEODataFromMCP {
  keywords: {
    keyword: string;
    position: number;
    searchVolume: number;
    difficulty: number;
  }[];
  competitors: {
    domain: string;
    ranking: number;
  }[];
  backlinks: {
    url: string;
    domainAuthority: number;
  }[];
}

export class MCPService {
  private client: Client | null = null;
  private config: MCPConfig;
  private connected: boolean = false;

  constructor(config: MCPConfig) {
    this.config = config;
  }

  /**
   * Connect to MCP server
   */
  async connect(): Promise<void> {
    if (!this.config.enabled) {
      console.log('⚠️  MCP Service disabled in config');
      return;
    }

    try {
      console.log('🔌 Connecting to MCP server...');
      console.log(`   Command: ${this.config.serverCommand}`);

      const transport = new StdioClientTransport({
        command: this.config.serverCommand,
        args: this.config.serverArgs || [],
      });

      this.client = new Client(
        {
          name: 'babylovesgrowth',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      await this.client.connect(transport);
      this.connected = true;

      console.log('✅ Connected to MCP server!');

      // List available tools
      const tools = await this.client.listTools();
      console.log('🛠️  Available MCP tools:', tools.tools.map(t => t.name).join(', '));
    } catch (error) {
      console.error('❌ Failed to connect to MCP server:', error);
      this.connected = false;
      throw error;
    }
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.connected = false;
      console.log('🔌 Disconnected from MCP server');
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Call MCP tool
   */
  async callTool(toolName: string, args: Record<string, unknown>): Promise<any> {
    if (!this.connected || !this.client) {
      throw new Error('MCP client not connected. Call connect() first.');
    }

    try {
      console.log(`🔧 Calling MCP tool: ${toolName}`);
      const result = await this.client.callTool({ name: toolName, arguments: args });
      return result;
    } catch (error) {
      console.error(`❌ MCP tool call failed (${toolName}):`, error);
      throw error;
    }
  }

  /**
   * Get SEO data for a domain from MCP server
   */
  async getSEOData(domain: string): Promise<SEODataFromMCP> {
    try {
      // Example: Call your seo-mcp-server tools
      const keywordData = await this.callTool('get-keyword-rankings', { domain });
      const competitorData = await this.callTool('analyze-competitors', { domain });
      const backlinkData = await this.callTool('get-backlinks', { domain });

      return {
        keywords: keywordData.keywords || [],
        competitors: competitorData.competitors || [],
        backlinks: backlinkData.backlinks || [],
      };
    } catch (error) {
      console.error('Failed to get SEO data from MCP:', error);
      throw error;
    }
  }

  /**
   * Get keyword suggestions from MCP
   */
  async getKeywordSuggestions(seed: string): Promise<string[]> {
    try {
      const result = await this.callTool('suggest-keywords', { seed });
      return result.keywords || [];
    } catch (error) {
      console.error('Failed to get keyword suggestions:', error);
      return [];
    }
  }

  /**
   * Analyze content for SEO via MCP
   */
  async analyzeContent(content: string, targetKeywords: string[]): Promise<{
    score: number;
    suggestions: string[];
  }> {
    try {
      const result = await this.callTool('analyze-content', {
        content,
        keywords: targetKeywords,
      });

      return {
        score: result.score || 0,
        suggestions: result.suggestions || [],
      };
    } catch (error) {
      console.error('Failed to analyze content:', error);
      return {
        score: 0,
        suggestions: [],
      };
    }
  }

  /**
   * Get competitor blog posts via MCP
   */
  async getCompetitorPosts(competitors: string[]): Promise<any[]> {
    try {
      const result = await this.callTool('fetch-competitor-posts', {
        domains: competitors,
        limit: 10,
      });

      return result.posts || [];
    } catch (error) {
      console.error('Failed to get competitor posts:', error);
      return [];
    }
  }

  /**
   * Track keyword rankings via MCP (for WooCommerce/Shopify sites)
   */
  async trackKeywordRankings(keywords: string[], domains: string[]): Promise<any> {
    try {
      const result = await this.callTool('track-rankings', {
        keywords,
        domains,
      });

      return result;
    } catch (error) {
      console.error('Failed to track keyword rankings:', error);
      return null;
    }
  }

  /**
   * Share blog post with MCP server (for cross-platform publishing)
   */
  async shareBlogPost(post: {
    title: string;
    content: string;
    keywords: string[];
    platform: 'abicart' | 'woocommerce' | 'shopify';
  }): Promise<void> {
    try {
      await this.callTool('store-blog-post', post);
      console.log('✅ Blog post shared with MCP server');
    } catch (error) {
      console.error('Failed to share blog post with MCP:', error);
    }
  }
}
