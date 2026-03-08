/**
 * Tests for EnvironmentManager
 * Tests environment variable loading and switching
 */

import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { EnvironmentManager } from '../environment';

describe('EnvironmentManager', () => {
  let manager: EnvironmentManager;

  beforeEach(() => {
    manager = new EnvironmentManager();
  });

  describe('loadFromEnvFile', () => {
    test('should load environments from JSON string', () => {
      const envFile = JSON.stringify({
        local: { baseUrl: 'http://localhost:3000' },
        staging: { baseUrl: 'https://staging.example.com' }
      });

      manager.loadFromEnvFile(envFile);

      expect(manager.listEnvironments()).toHaveLength(2);
      expect(manager.hasEnvironment('local')).toBe(true);
      expect(manager.hasEnvironment('staging')).toBe(true);
    });

    test('should load environments from object', () => {
      manager.loadFromEnvFile({
        local: { baseUrl: 'http://localhost:3000' },
        staging: { baseUrl: 'https://staging.example.com' }
      });

      expect(manager.listEnvironments()).toHaveLength(2);
    });

    test('should merge $shared variables into each environment', () => {
      manager.loadFromEnvFile({
        $shared: { apiVersion: 'v1', timeout: '5000' },
        local: { baseUrl: 'http://localhost:3000' },
        staging: { baseUrl: 'https://staging.example.com' }
      });

      const local = manager.getEnvironment('local');
      const staging = manager.getEnvironment('staging');

      expect(local?.variables.apiVersion).toBe('v1');
      expect(local?.variables.timeout).toBe('5000');
      expect(local?.variables.baseUrl).toBe('http://localhost:3000');

      expect(staging?.variables.apiVersion).toBe('v1');
      expect(staging?.variables.baseUrl).toBe('https://staging.example.com');
    });

    test('should allow environment-specific variables to override $shared', () => {
      manager.loadFromEnvFile({
        $shared: { apiVersion: 'v1' },
        local: { apiVersion: 'v2', baseUrl: 'http://localhost:3000' }
      });

      const local = manager.getEnvironment('local');
      expect(local?.variables.apiVersion).toBe('v2');
    });

    test('should track which variables came from $shared', () => {
      manager.loadFromEnvFile({
        $shared: { apiVersion: 'v1', timeout: '5000' },
        local: { baseUrl: 'http://localhost:3000' }
      });

      const local = manager.getEnvironment('local');
      expect(local?.sharedVariables).toContain('apiVersion');
      expect(local?.sharedVariables).toContain('timeout');
    });

    test('should throw error for invalid JSON', () => {
      expect(() => {
        manager.loadFromEnvFile('{ invalid json }');
      }).toThrow('Invalid http-client.env.json format');
    });

    test('should clear existing environments when loading new file', () => {
      manager.loadFromEnvFile({
        first: { var: 'value' }
      });

      manager.loadFromEnvFile({
        second: { var: 'value' }
      });

      expect(manager.listEnvironments()).toEqual(['second']);
      expect(manager.hasEnvironment('first')).toBe(false);
    });
  });

  describe('setCurrentEnvironment', () => {
    beforeEach(() => {
      manager.loadFromEnvFile({
        local: { baseUrl: 'http://localhost:3000' },
        staging: { baseUrl: 'https://staging.example.com' }
      });
    });

    test('should set the current environment', () => {
      manager.setCurrentEnvironment('local');
      expect(manager.getCurrentEnvironmentName()).toBe('local');
    });

    test('should throw error for non-existent environment', () => {
      expect(() => {
        manager.setCurrentEnvironment('production');
      }).toThrow('Environment "production" not found');
    });

    test('should allow setting to null to clear environment', () => {
      manager.setCurrentEnvironment('local');
      manager.setCurrentEnvironment(null);
      expect(manager.getCurrentEnvironmentName()).toBeNull();
    });
  });

  describe('getCurrentEnvironment', () => {
    test('should return null when no environment set', () => {
      expect(manager.getCurrentEnvironment()).toBeNull();
    });

    test('should return the current environment object', () => {
      manager.loadFromEnvFile({
        local: { baseUrl: 'http://localhost:3000' }
      });
      manager.setCurrentEnvironment('local');

      const env = manager.getCurrentEnvironment();
      expect(env?.name).toBe('local');
      expect(env?.variables.baseUrl).toBe('http://localhost:3000');
    });
  });

  describe('getEnvironmentVariables', () => {
    test('should return empty object when no environment set', () => {
      expect(manager.getEnvironmentVariables()).toEqual({});
    });

    test('should return variables from current environment', () => {
      manager.loadFromEnvFile({
        local: { baseUrl: 'http://localhost:3000', token: 'abc123' }
      });
      manager.setCurrentEnvironment('local');

      const vars = manager.getEnvironmentVariables();
      expect(vars.baseUrl).toBe('http://localhost:3000');
      expect(vars.token).toBe('abc123');
    });
  });

  describe('onChange', () => {
    test('should notify listeners when environment changes', () => {
      manager.loadFromEnvFile({
        local: { baseUrl: 'http://localhost:3000' },
        staging: { baseUrl: 'https://staging.example.com' }
      });

      const listener = mock(() => {});
      manager.onChange(listener);

      manager.setCurrentEnvironment('local');

      expect(listener).toHaveBeenCalledWith('local');
    });

    test('should not notify listeners when setting same environment', () => {
      manager.loadFromEnvFile({
        local: { baseUrl: 'http://localhost:3000' }
      });
      manager.setCurrentEnvironment('local');

      const listener = mock(() => {});
      manager.onChange(listener);

      manager.setCurrentEnvironment('local');

      // Should not be called since no change
      expect(listener).not.toHaveBeenCalled();
    });

    test('should return unsubscribe function', () => {
      manager.loadFromEnvFile({
        local: { baseUrl: 'http://localhost:3000' },
        staging: { baseUrl: 'https://staging.example.com' }
      });

      const listener = mock(() => {});
      const unsubscribe = manager.onChange(listener);

      unsubscribe();

      manager.setCurrentEnvironment('local');

      expect(listener).not.toHaveBeenCalled();
    });

    test('should call onEnvironmentChange option callback', () => {
      const callback = mock(() => {});
      const managerWithCallback = new EnvironmentManager({
        onEnvironmentChange: callback
      });

      managerWithCallback.loadFromEnvFile({
        local: { baseUrl: 'http://localhost:3000' }
      });
      managerWithCallback.setCurrentEnvironment('local');

      expect(callback).toHaveBeenCalledWith('local');
    });
  });

  describe('autoSelectFirst option', () => {
    test('should auto-select first environment when enabled', () => {
      const autoManager = new EnvironmentManager({ autoSelectFirst: true });

      autoManager.loadFromEnvFile({
        local: { baseUrl: 'http://localhost:3000' },
        staging: { baseUrl: 'https://staging.example.com' }
      });

      expect(autoManager.getCurrentEnvironmentName()).toBe('local');
    });

    test('should not auto-select when disabled', () => {
      manager.loadFromEnvFile({
        local: { baseUrl: 'http://localhost:3000' }
      });

      expect(manager.getCurrentEnvironmentName()).toBeNull();
    });
  });

  describe('clear', () => {
    test('should clear all environments', () => {
      manager.loadFromEnvFile({
        local: { baseUrl: 'http://localhost:3000' },
        staging: { baseUrl: 'https://staging.example.com' }
      });
      manager.setCurrentEnvironment('local');

      manager.clear();

      expect(manager.listEnvironments()).toHaveLength(0);
      expect(manager.getCurrentEnvironmentName()).toBeNull();
    });

    test('should notify listeners when cleared', () => {
      manager.loadFromEnvFile({
        local: { baseUrl: 'http://localhost:3000' }
      });
      manager.setCurrentEnvironment('local');

      const listener = mock(() => {});
      manager.onChange(listener);

      manager.clear();

      expect(listener).toHaveBeenCalledWith(null);
    });
  });

  describe('listEnvironments', () => {
    test('should return empty array when no environments loaded', () => {
      expect(manager.listEnvironments()).toEqual([]);
    });

    test('should return all environment names', () => {
      manager.loadFromEnvFile({
        local: { var: 'value' },
        staging: { var: 'value' },
        production: { var: 'value' }
      });

      const names = manager.listEnvironments();
      expect(names).toContain('local');
      expect(names).toContain('staging');
      expect(names).toContain('production');
    });
  });

  describe('hasEnvironment', () => {
    test('should return true for existing environment', () => {
      manager.loadFromEnvFile({
        local: { var: 'value' }
      });

      expect(manager.hasEnvironment('local')).toBe(true);
    });

    test('should return false for non-existent environment', () => {
      expect(manager.hasEnvironment('production')).toBe(false);
    });
  });
});
