export type RiskLevel = 'SAFE_AUTO' | 'LOW_RISK_AUTO' | 'APPROVAL_REQUIRED' | 'BLOCKED';

// Tool-level risk classification
const TOOL_RISK_MAP: Record<string, RiskLevel> = {
  // SAFE_AUTO - purely internal operations
  create_task: 'SAFE_AUTO',
  update_task: 'SAFE_AUTO',
  save_memory: 'SAFE_AUTO',
  search_memory: 'SAFE_AUTO',
  save_lesson: 'SAFE_AUTO',
  create_experiment: 'SAFE_AUTO',
  score_result: 'SAFE_AUTO',

  // LOW_RISK_AUTO - local file ops, public reads, scoring
  create_file: 'LOW_RISK_AUTO',
  read_file: 'LOW_RISK_AUTO',
  list_files: 'LOW_RISK_AUTO',
  browser_read_page: 'LOW_RISK_AUTO',
  browser_screenshot: 'LOW_RISK_AUTO',
  add_lead: 'LOW_RISK_AUTO',
  update_lead: 'LOW_RISK_AUTO',
  create_daily_report: 'LOW_RISK_AUTO',
  suggest_playbook_update: 'LOW_RISK_AUTO',

  // APPROVAL_REQUIRED - sends emails, spends money, publishes
  draft_email: 'APPROVAL_REQUIRED',
  request_approval: 'APPROVAL_REQUIRED',
  browser_open: 'APPROVAL_REQUIRED',
};

// Params that always trigger BLOCKED
const BLOCKED_PATTERNS = [
  /spam/i,
  /scrape.*(private|personal)/i,
  /bypass.*(security|auth|captcha)/i,
  /fraud/i,
  /illegal/i,
];

export class RiskPolicyEngine {
  classify(toolName: string, params: Record<string, unknown>): RiskLevel {
    // Check blocked patterns in params
    const paramStr = JSON.stringify(params).toLowerCase();
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(paramStr)) {
        return 'BLOCKED';
      }
    }

    // Check tool-level risk
    const toolRisk = TOOL_RISK_MAP[toolName];
    if (toolRisk) return toolRisk;

    // Default to APPROVAL_REQUIRED for unknown tools
    return 'APPROVAL_REQUIRED';
  }

  isAllowed(level: RiskLevel): boolean {
    return level === 'SAFE_AUTO' || level === 'LOW_RISK_AUTO';
  }

  requiresApproval(level: RiskLevel): boolean {
    return level === 'APPROVAL_REQUIRED';
  }

  isBlocked(level: RiskLevel): boolean {
    return level === 'BLOCKED';
  }

  describe(level: RiskLevel): string {
    switch (level) {
      case 'SAFE_AUTO': return 'Safe — runs automatically (internal planning, memory)';
      case 'LOW_RISK_AUTO': return 'Low risk — runs automatically (local files, public pages)';
      case 'APPROVAL_REQUIRED': return 'Approval required (emails, spending, publishing)';
      case 'BLOCKED': return 'Blocked — not permitted (fraud, spam, security bypass)';
    }
  }
}

export default RiskPolicyEngine;
