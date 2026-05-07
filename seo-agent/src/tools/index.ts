import { serverTool } from '@openrouter/agent';
import { shellTool } from './shell.js';
import {
  wpGetCredsTool,
  wpListPagesTool,
  wpGetSeoTool,
  wpUpdateSeoTool,
  wpGetImagesNoAltTool,
  wpUpdateAltTool,
} from './wp-api.js';

export const tools = [
  shellTool,
  wpGetCredsTool,
  wpListPagesTool,
  wpGetSeoTool,
  wpUpdateSeoTool,
  wpGetImagesNoAltTool,
  wpUpdateAltTool,
  serverTool({ type: 'openrouter:web_fetch' }),
] as const;
