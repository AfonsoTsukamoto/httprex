/**
 * Tests for EnvironmentManager
 * Tests environment variable loading and switching
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnvironmentManager } from '../environment';

describe('EnvironmentManager', () => {
  let manager: EnvironmentManager;

  beforeEach(() => {
    manager = new EnvironmentManager();
  });

  describe('loadFromEnvFile', () => {
    it('should load environments from JSON string', () => {
      const envFile = JSON.stringify({
        local: { baseUrl: 'http://localhost:3000' },
        staging: { baseUrl: 'https://staging.example.com' }
      });

      manager.loadFromEnvFile(envFile);

      expect(manager.listEnvironments()).toHaveLength(2);
      expect(manager.hasEnvironment('local')).toBe(true);
      expect(manager.hasEnvironment('staging')).toBe(true);
    });

    it('should load environments from object', () => {
      manager.loadFromEnvFile({
        local: { baseUrl: 'http://localhost:3000' },
        staging: { baseUrl: 'https://staging.example.com' }
      });

      expect(manager.listEnvironments()).toHaveLength(2);
    });

    it('should merge $shared variables into each environment', () => {
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

    it('should allow environment-specific variables to override $shared', () => {
      manager.loadFromEnvFile({
        $shared: { apiVersion: 'v1' },
        local: { apiVersion: 'v2', baseUrl: 'http://localhost:3000' }
      });

      const local = manager.getEnvironment('local');
      expect(local?.variables.apiVersion).toBe('v2');
    });

    it('should track which variables came from $shared', () => {
      manager.loadFromEnvFile({
        $shared: { apiVersion: 'v1', timeout: '5000' },
        local: { baseUrl: 'http://localhost:3000' }
      });

      const local = manager.getEnvironment('local');
      expect(local?.sharedVariables).toContain('apiVersion');
      expect(local?.sharedVariables).toContain('timeout');
    });

    it('should throw error for invalid JSON', () => {
      expect(() => {
        manager.loadFromEnvFile('{ invalid json }');
      }).toThrow('Invalid http-client.env.json format');
    });

    it('should clear existing environments when loading new file', () => {
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

    it('should set the current environment', () => {
      manager.setCurrentEnvironment('local');
      expect(manager.getCurrentEnvironmentName()).toBe('local');
    });

    it('should throw error for non-existent environment', () => {
      expect(() => {
        manager.setCurrentEnvironment('production');
      }).toThrow('Environment "production" not found');
    });

    it('should allow setting to null to clear environment', () => {
      manager.setCurrentEnvironment('local');
      manager.setCurrentEnvironment(null);
      expect(manager.getCurrentEnvironmentName()).toBeNull();
    });
  });

  describe('getCurrentEnvironment', () => {
    it('should return null when no environment set', () => {
      expect(manager.getCurrentEnvironment()).toBeNull();
    });

    it('should return the current environment object', () => {
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
    it('should return empty object when no environment set', () => {
      expect(manager.getEnvironmentVariables()).toEqual({});
    });

    it('should return variables from current environment', () => {
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
    it('should notify listeners when environment changes', () => {
      manager.loadFromEnvFile({
        local: { baseUrl: 'http://localhost:3000' },
        staging: { baseUrl: 'https://staging.example.com' }
      });

      const listener = vi.fn();
      manager.onChange(listener);

      manager.setCurrentEnvironment('local');

      expect(listener).toHaveBeenCalledWith('local');
    });

    it('should not notify listeners when setting same environment', () => {
      manager.loadFromEnvFile({
        local: { baseUrl: 'http://localhost:3000' }
      });
      manager.setCurrentEnvironment('local');

      const listener = vi.fn();
      manager.onChange(listener);

      manager.setCurrentEnvironment('local');

      // Should not be called since no change
      expect(listener).not.toHaveBeenCalled();
    });

    it('should return unsubscribe function', () => {
      manager.loadFromEnvFile({
        local: { baseUrl: 'http://localhost:3000' },
        staging: { baseUrl: 'https://staging.example.com' }
      });

      const listener = vi.fn();
      const unsubscribe = manager.onChange(listener);

      unsubscribe();

      manager.setCurrentEnvironment('local');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should call onEnvironmentChange option callback', () => {
      const callback = vi.fn();
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
    it('should auto-select first environment when enabled', () => {
      const autoManager = new EnvironmentManager({ autoSelectFirst: true });

      autoManager.loadFromEnvFile({
        local: { baseUrl: 'http://localhost:3000' },
        staging: { baseUrl: 'https://staging.example.com' }
      });

      expect(autoManager.getCurrentEnvironmentName()).toBe('local');
    });

    it('should not auto-select when disabled', () => {
      manager.loadFromEnvFile({
        local: { baseUrl: 'http://localhost:3000' }
      });

      expect(manager.getCurrentEnvironmentName()).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all environments', () => {
      manager.loadFromEnvFile({
        local: { baseUrl: 'http://localhost:3000' },
        staging: { baseUrl: 'https://staging.example.com' }
      });
      manager.setCurrentEnvironment('local');

      manager.clear();

      expect(manager.listEnvironments()).toHaveLength(0);
      expect(manager.getCurrentEnvironmentName()).toBeNull();
    });

    it('should notify listeners when cleared', () => {
      manager.loadFromEnvFile({
        local: { baseUrl: 'http://localhost:3000' }
      });
      manager.setCurrentEnvironment('local');

      const listener = vi.fn();
      manager.onChange(listener);

      manager.clear();

      expect(listener).toHaveBeenCalledWith(null);
    });
  });

  describe('listEnvironments', () => {
    it('should return empty array when no environments loaded', () => {
      expect(manager.listEnvironments()).toEqual([]);
    });

    it('should return all environment names', () => {
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
    it('should return true for existing environment', () => {
      manager.loadFromEnvFile({
        local: { var: 'value' }
      });

      expect(manager.hasEnvironment('local')).toBe(true);
    });

    it('should return false for non-existent environment', () => {
      expect(manager.hasEnvironment('production')).toBe(false);
    });
  });
});
