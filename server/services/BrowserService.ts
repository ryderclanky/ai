import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

// Playwright browsers path
const BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';

export class BrowserService {
  async readPage(url: string): Promise<string> {
    // Try to use playwright if available, otherwise fallback to curl
    try {
      const chromiumPath = this.findChromium();
      if (chromiumPath) {
        return await this.readWithChromium(url, chromiumPath);
      }
    } catch {
      // fall through to curl
    }

    // Fallback: use curl for simple page fetching
    try {
      const { stdout } = await execAsync(`curl -s -L --max-time 15 --user-agent "Mozilla/5.0" "${url}" | sed 's/<[^>]*>//g' | head -200`);
      return stdout.trim() || 'Page fetched but appears empty.';
    } catch (err) {
      throw new Error(`Failed to read page: ${String(err)}`);
    }
  }

  async screenshot(url: string, outputPath: string): Promise<string> {
    try {
      const chromiumPath = this.findChromium();
      if (chromiumPath) {
        await execAsync(
          `"${chromiumPath}" --headless --no-sandbox --disable-gpu --screenshot="${outputPath}" "${url}"`,
          { timeout: 30000, env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: BROWSERS_PATH } }
        );
        return outputPath;
      }
    } catch {
      // fall through
    }
    throw new Error('Screenshot not available — Chromium not found');
  }

  private findChromium(): string | null {
    const candidates = [
      path.join(BROWSERS_PATH, 'chromium-*/chrome-linux/chrome'),
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/bin/google-chrome',
    ];

    for (const pattern of candidates) {
      try {
        const { stdout } = require('child_process').execSync(`ls ${pattern} 2>/dev/null | head -1`).toString();
        if (stdout && stdout.trim() && fs.existsSync(stdout.trim())) {
          return stdout.trim();
        }
      } catch {
        // continue
      }
    }
    return null;
  }

  private async readWithChromium(url: string, chromiumPath: string): Promise<string> {
    const tmpFile = `/tmp/page-${Date.now()}.txt`;
    try {
      await execAsync(
        `"${chromiumPath}" --headless --no-sandbox --disable-gpu --dump-dom "${url}" > "${tmpFile}" 2>/dev/null`,
        { timeout: 20000, env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: BROWSERS_PATH } }
      );
      const content = fs.readFileSync(tmpFile, 'utf-8');
      // Strip HTML tags
      return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 5000);
    } finally {
      try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
    }
  }
}

export default BrowserService;
