import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BYOKClient } from '../lib/engines/byok-client.js';

const STORAGE_KEY = 'agilefocus_settings';

describe('BYOKClient', () => {
  let client;

  beforeEach(() => {
    client = new BYOKClient();
  });

  describe('loadKey', () => {
    it('should accept a valid sk-ant- key', () => {
      const result = client.loadKey('sk-ant-validkey123');
      expect(result).toBe(true);
      expect(client.isAvailable()).toBe(true);
    });

    it('should reject a key that does not start with sk-ant-', () => {
      const result = client.loadKey('invalid-key');
      expect(result).toBe(false);
      expect(client.isAvailable()).toBe(false);
    });

    it('should reject null', () => {
      const result = client.loadKey(null);
      expect(result).toBe(false);
      expect(client.isAvailable()).toBe(false);
    });

    it('should reject undefined', () => {
      const result = client.loadKey(undefined);
      expect(result).toBe(false);
      expect(client.isAvailable()).toBe(false);
    });

    it('should reject empty string', () => {
      const result = client.loadKey('');
      expect(result).toBe(false);
      expect(client.isAvailable()).toBe(false);
    });

    it('should trim whitespace from key', () => {
      const result = client.loadKey('  sk-ant-validkey123  ');
      expect(result).toBe(true);
      expect(client.isAvailable()).toBe(true);
    });
  });

  describe('isAvailable', () => {
    it('should return false when no key loaded', () => {
      expect(client.isAvailable()).toBe(false);
    });

    it('should return true when valid key loaded', () => {
      client.loadKey('sk-ant-validkey123');
      expect(client.isAvailable()).toBe(true);
    });

    it('should return false after clearKey', () => {
      client.loadKey('sk-ant-validkey123');
      expect(client.isAvailable()).toBe(true);
      client.clearKey();
      expect(client.isAvailable()).toBe(false);
    });
  });

  describe('clearKey', () => {
    it('should remove the stored key', () => {
      client.loadKey('sk-ant-validkey123');
      expect(client.isAvailable()).toBe(true);
      client.clearKey();
      expect(client._key).toBeNull();
      expect(client._active).toBe(false);
      expect(client.isAvailable()).toBe(false);
    });
  });

  describe('validateKey', () => {
    it('should return invalid for empty key', async () => {
      const result = await client.validateKey('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('No key provided');
    });

    it('should return invalid for wrong format', async () => {
      const result = await client.validateKey('bad-format');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must start with sk-ant-');
    });

    it('should return valid on successful API call', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true
      });

      const result = await client.validateKey('sk-ant-test123');
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-api-key': 'sk-ant-test123'
          })
        })
      );

      delete globalThis.fetch;
    });

    it('should return invalid on 401', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized')
      });

      const result = await client.validateKey('sk-ant-badkey');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid API key');

      delete globalThis.fetch;
    });

    it('should return invalid on network error', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

      const result = await client.validateKey('sk-ant-test123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Network error');

      delete globalThis.fetch;
    });
  });

  describe('sendMessage', () => {
    it('should return null when not active', async () => {
      const result = await client.sendMessage([], 'system prompt');
      expect(result).toBeNull();
    });

    it('should return null on API error', async () => {
      client.loadKey('sk-ant-test123');

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500
      });

      const result = await client.sendMessage(
        [{ role: 'user', content: 'Hello' }],
        'Be helpful'
      );
      expect(result).toBeNull();

      delete globalThis.fetch;
    });

    it('should return response text on success', async () => {
      client.loadKey('sk-ant-test123');

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          content: [{ text: 'Hello! How can I help?' }]
        })
      });

      const result = await client.sendMessage(
        [{ role: 'user', content: 'Hi' }],
        'Be helpful'
      );
      expect(result).toBe('Hello! How can I help?');

      delete globalThis.fetch;
    });

    it('should return null when response has no content', async () => {
      client.loadKey('sk-ant-test123');

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ content: [] })
      });

      const result = await client.sendMessage(
        [{ role: 'user', content: 'Hi' }],
        'Be helpful'
      );
      expect(result).toBeNull();

      delete globalThis.fetch;
    });

    it('should include temperature option when provided', async () => {
      client.loadKey('sk-ant-test123');

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          content: [{ text: 'ok' }]
        })
      });

      await client.sendMessage(
        [{ role: 'user', content: 'Hi' }],
        'System prompt',
        { temperature: 0.3 }
      );

      const callBody = JSON.parse(globalThis.fetch.mock.calls[0][1].body);
      expect(callBody.temperature).toBe(0.3);

      delete globalThis.fetch;
    });
  });

  describe('sendPersonaMessage', () => {
    it('should return null when not active', async () => {
      const result = await client.sendPersonaMessage({}, {}, 'Hello');
      expect(result).toBeNull();
    });
  });

  describe('getBPMNFeedback', () => {
    it('should return null when not active', async () => {
      const result = await client.getBPMNFeedback('<xml/>', {}, 'exercise');
      expect(result).toBeNull();
    });
  });

  describe('getGovernanceFeedback', () => {
    it('should return null when not active', async () => {
      const result = await client.getGovernanceFeedback('ex-1', {}, {});
      expect(result).toBeNull();
    });
  });

  describe('getSimulationDebrief', () => {
    it('should return null when not active', async () => {
      const result = await client.getSimulationDebrief([], {}, 'scenario-1');
      expect(result).toBeNull();
    });
  });
});
