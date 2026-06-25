import type { ToolDefinition } from '../ToolRegistry.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILES_DIR = path.join(__dirname, '../../../data/files');

// Ensure files directory exists
if (!fs.existsSync(FILES_DIR)) {
  fs.mkdirSync(FILES_DIR, { recursive: true });
}

function safePath(filename: string): string {
  // Prevent directory traversal
  const name = path.basename(filename);
  return path.join(FILES_DIR, name);
}

export const fileTools: ToolDefinition[] = [
  {
    name: 'create_file',
    description: 'Create or overwrite a file in the data/files directory',
    parameters: {
      type: 'object',
      properties: {
        filename: { type: 'string', description: 'Filename (e.g. outreach-emails.txt)' },
        content: { type: 'string', description: 'File content' },
      },
      required: ['filename', 'content'],
    },
    risk_level: 'LOW_RISK_AUTO',
    handler: async (params) => {
      const filePath = safePath(params.filename as string);
      fs.writeFileSync(filePath, params.content as string, 'utf-8');
      return { success: true, path: filePath, size: (params.content as string).length };
    },
  },
  {
    name: 'read_file',
    description: 'Read a file from the data/files directory',
    parameters: {
      type: 'object',
      properties: {
        filename: { type: 'string', description: 'Filename to read' },
      },
      required: ['filename'],
    },
    risk_level: 'LOW_RISK_AUTO',
    handler: async (params) => {
      const filePath = safePath(params.filename as string);
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File not found' };
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      return { success: true, content, size: content.length };
    },
  },
  {
    name: 'list_files',
    description: 'List files in the data/files directory',
    parameters: {
      type: 'object',
      properties: {},
    },
    risk_level: 'LOW_RISK_AUTO',
    handler: async () => {
      const files = fs.readdirSync(FILES_DIR).map(name => {
        const stat = fs.statSync(path.join(FILES_DIR, name));
        return { name, size: stat.size, modified: stat.mtime.toISOString() };
      });
      return { success: true, files, count: files.length };
    },
  },
];
