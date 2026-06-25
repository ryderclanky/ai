import { describe, it, expect } from 'vitest';
import { RiskPolicyEngine } from '../safety/RiskPolicyEngine.js';

describe('RiskPolicyEngine', () => {
  const engine = new RiskPolicyEngine();

  it('classifies SAFE_AUTO tools correctly', () => {
    expect(engine.classify('create_task', {})).toBe('SAFE_AUTO');
    expect(engine.classify('save_memory', {})).toBe('SAFE_AUTO');
    expect(engine.classify('search_memory', {})).toBe('SAFE_AUTO');
    expect(engine.classify('update_task', {})).toBe('SAFE_AUTO');
  });

  it('classifies LOW_RISK_AUTO tools correctly', () => {
    expect(engine.classify('create_file', {})).toBe('LOW_RISK_AUTO');
    expect(engine.classify('read_file', {})).toBe('LOW_RISK_AUTO');
    expect(engine.classify('add_lead', {})).toBe('LOW_RISK_AUTO');
    expect(engine.classify('browser_read_page', {})).toBe('LOW_RISK_AUTO');
  });

  it('classifies APPROVAL_REQUIRED tools correctly', () => {
    expect(engine.classify('draft_email', {})).toBe('APPROVAL_REQUIRED');
    expect(engine.classify('request_approval', {})).toBe('APPROVAL_REQUIRED');
    expect(engine.classify('browser_open', {})).toBe('APPROVAL_REQUIRED');
  });

  it('classifies unknown tools as APPROVAL_REQUIRED', () => {
    expect(engine.classify('some_random_tool', {})).toBe('APPROVAL_REQUIRED');
  });

  it('blocks tools with spam patterns in params', () => {
    const result = engine.classify('create_file', { content: 'send spam to everyone' });
    expect(result).toBe('BLOCKED');
  });

  it('blocks tools with fraud patterns in params', () => {
    const result = engine.classify('draft_email', { body: 'this is fraud scheme' });
    expect(result).toBe('BLOCKED');
  });

  it('isAllowed returns true for SAFE_AUTO and LOW_RISK_AUTO', () => {
    expect(engine.isAllowed('SAFE_AUTO')).toBe(true);
    expect(engine.isAllowed('LOW_RISK_AUTO')).toBe(true);
    expect(engine.isAllowed('APPROVAL_REQUIRED')).toBe(false);
    expect(engine.isAllowed('BLOCKED')).toBe(false);
  });

  it('requiresApproval returns true only for APPROVAL_REQUIRED', () => {
    expect(engine.requiresApproval('APPROVAL_REQUIRED')).toBe(true);
    expect(engine.requiresApproval('SAFE_AUTO')).toBe(false);
    expect(engine.requiresApproval('BLOCKED')).toBe(false);
  });

  it('isBlocked returns true only for BLOCKED', () => {
    expect(engine.isBlocked('BLOCKED')).toBe(true);
    expect(engine.isBlocked('SAFE_AUTO')).toBe(false);
    expect(engine.isBlocked('APPROVAL_REQUIRED')).toBe(false);
  });
});
