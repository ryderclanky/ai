import type { ToolDefinition } from '../ToolRegistry.js';
import BrowserService from '../../services/BrowserService.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browserService = new BrowserService();

export const browserTools: ToolDefinition[] = [
  {
    name: 'browser_open',
    description: 'Open a URL in the browser (requires approval for account actions)',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to open' },
      },
      required: ['url'],
    },
    risk_level: 'APPROVAL_REQUIRED',
    handler: async (params) => {
      const url = params.url as string;
      // Just log the intent — actual browser navigation needs approval
      return { success: true, url, message: 'Browser navigation logged. Use browser_read_page to read content.' };
    },
  },
  {
    name: 'browser_read_page',
    description: 'Read the text content of a public web page',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to read' },
      },
      required: ['url'],
    },
    risk_level: 'LOW_RISK_AUTO',
    handler: async (params) => {
      const url = params.url as string;
      const content = await browserService.readPage(url);
      return { success: true, url, content: content.slice(0, 3000) };
    },
  },
  {
    name: 'browser_screenshot',
    description: 'Take a screenshot of a web page',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to screenshot' },
        filename: { type: 'string', description: 'Output filename' },
      },
      required: ['url'],
    },
    risk_level: 'LOW_RISK_AUTO',
    handler: async (params) => {
      const url = params.url as string;
      const filename = (params.filename as string) || `screenshot-${Date.now()}.png`;
      const outputPath = path.join(__dirname, '../../../data/files', filename);
      const result = await browserService.screenshot(url, outputPath);
      return { success: true, url, path: result };
    },
  },
];
