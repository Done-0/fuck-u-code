import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { VERSION } from '../../src/version.js';

const SERVER_PATH = resolve(__dirname, '../../dist/mcp/server.js');

/**
 * Send a JSON-RPC request to the MCP server via stdin and collect stdout response.
 * The server communicates over stdio, so we spawn it as a child process.
 */
function sendMcpRequest(request: object): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [SERVER_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('close', () => {
      if (stderr && !stdout) {
        reject(new Error(stderr));
      } else {
        resolve(stdout);
      }
    });

    child.on('error', reject);

    child.stdin.write(JSON.stringify(request) + '\n');
    child.stdin.end();

    setTimeout(() => {
      child.kill('SIGTERM');
    }, 5000);
  });
}

describe('MCP Server', () => {
  it('should respond to initialize request with server info', async () => {
    const response = await sendMcpRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test', version: '1.0.0' },
      },
    });

    const parsed = JSON.parse(response);
    expect(parsed.jsonrpc).toBe('2.0');
    expect(parsed.id).toBe(1);
    expect(parsed.result).toBeDefined();
    expect(parsed.result.serverInfo.name).toBe('fuck-u-code');
    expect(parsed.result.serverInfo.version).toBe(VERSION);
    expect(parsed.result.capabilities.tools).toBeDefined();
  });

  it('should list analyze and ai-review tools', async () => {
    const child = spawn('node', [SERVER_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const responses: string[] = [];

    const collectResponses = new Promise<void>((resolve) => {
      let buffer = '';
      child.stdout.on('data', (data: Buffer) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i]!.trim();
          if (line) responses.push(line);
        }
        buffer = lines[lines.length - 1]!;
      });

      child.on('close', () => {
        if (buffer.trim()) responses.push(buffer.trim());
        resolve();
      });
    });

    // Send initialize
    child.stdin.write(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test', version: '1.0.0' },
        },
      }) + '\n'
    );

    // Wait for initialize response
    await new Promise((r) => setTimeout(r, 500));

    // Send initialized notification
    child.stdin.write(
      JSON.stringify({
        jsonrpc: '2.0',
        method: 'notifications/initialized',
      }) + '\n'
    );

    // Send tools/list
    child.stdin.write(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
      }) + '\n'
    );

    await new Promise((r) => setTimeout(r, 1000));
    child.stdin.end();
    child.kill('SIGTERM');
    await collectResponses;

    // Find the tools/list response (id: 2)
    const toolsResponse = responses.find((r) => {
      try {
        const parsed = JSON.parse(r);
        return parsed.id === 2;
      } catch {
        return false;
      }
    });

    expect(toolsResponse).toBeDefined();
    const parsed = JSON.parse(toolsResponse!);
    expect(parsed.result.tools).toBeDefined();

    const toolNames = parsed.result.tools.map((t: { name: string }) => t.name);
    expect(toolNames).toContain('analyze');
    expect(toolNames).toContain('ai-review');

    // Verify analyze tool has expected input schema properties
    const analyzeTool = parsed.result.tools.find((t: { name: string }) => t.name === 'analyze');
    expect(analyzeTool.inputSchema.properties).toHaveProperty('path');
    expect(analyzeTool.inputSchema.properties).toHaveProperty('format');
    expect(analyzeTool.inputSchema.properties).toHaveProperty('locale');

    // Verify ai-review tool has expected input schema properties
    const aiReviewTool = parsed.result.tools.find(
      (t: { name: string }) => t.name === 'ai-review'
    );
    expect(aiReviewTool.inputSchema.properties).toHaveProperty('path');
    expect(aiReviewTool.inputSchema.properties).toHaveProperty('model');
    expect(aiReviewTool.inputSchema.properties).toHaveProperty('provider');
  }, 10000);
});
