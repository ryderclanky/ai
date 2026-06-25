import { describe, it, expect, beforeEach } from 'vitest';
import { ToolRegistry } from '../tools/ToolRegistry.js';

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  it('should register a tool', () => {
    registry.register({
      name: 'test_tool',
      description: 'A test tool',
      parameters: { type: 'object', properties: { value: { type: 'string' } } },
      risk_level: 'SAFE_AUTO',
      handler: async (params) => ({ result: params.value }),
    });

    expect(registry.has('test_tool')).toBe(true);
  });

  it('should invoke a registered tool', async () => {
    registry.register({
      name: 'echo_tool',
      description: 'Echoes input',
      parameters: { type: 'object', properties: { msg: { type: 'string' } } },
      risk_level: 'SAFE_AUTO',
      handler: async (params) => ({ echoed: params.msg }),
    });

    const result = await registry.invoke('echo_tool', { msg: 'hello' });
    expect(result).toEqual({ echoed: 'hello' });
  });

  it('should throw for unknown tool', async () => {
    await expect(registry.invoke('nonexistent', {})).rejects.toThrow('Unknown tool: nonexistent');
  });

  it('should list all registered tools', () => {
    registry.register({
      name: 'tool_a',
      description: 'Tool A',
      parameters: { type: 'object', properties: {} },
      risk_level: 'SAFE_AUTO',
      handler: async () => ({}),
    });
    registry.register({
      name: 'tool_b',
      description: 'Tool B',
      parameters: { type: 'object', properties: {} },
      risk_level: 'LOW_RISK_AUTO',
      handler: async () => ({}),
    });

    const tools = registry.list();
    expect(tools).toHaveLength(2);
    expect(tools.map(t => t.name)).toContain('tool_a');
    expect(tools.map(t => t.name)).toContain('tool_b');
  });

  it('should return tool list string', () => {
    registry.register({
      name: 'my_tool',
      description: 'Does something',
      parameters: { type: 'object', properties: {} },
      risk_level: 'SAFE_AUTO',
      handler: async () => ({}),
    });

    const list = registry.getToolList();
    expect(list).toContain('my_tool');
    expect(list).toContain('Does something');
    expect(list).toContain('SAFE_AUTO');
  });
});
