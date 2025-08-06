import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadTodos, saveTodos, isValidTodos } from '../utils/sessionStorage';
import type { Todo } from '../types/Todo';

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

const createMockTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: '1',
  title: 'Test Todo',
  description: 'Test Description',
  completed: false,
  createdAt: new Date('2025-01-01'),
  ...overrides,
});

describe('sessionStorage utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.warn = vi.fn();
    console.error = vi.fn();
  });

  describe('isValidTodos', () => {
    it('should return true for valid todos array', () => {
      const validTodos = [createMockTodo(), createMockTodo({ id: '2' })];
      expect(isValidTodos(validTodos)).toBe(true);
    });

    it('should return true for empty array', () => {
      expect(isValidTodos([])).toBe(true);
    });

    it('should return false for non-array', () => {
      expect(isValidTodos(null)).toBe(false);
      expect(isValidTodos(undefined)).toBe(false);
      expect(isValidTodos('string')).toBe(false);
      expect(isValidTodos({})).toBe(false);
    });

    it('should return false for array with invalid todo objects', () => {
      expect(isValidTodos([{ id: 1, title: 'test' }])).toBe(false); // id not string
      expect(isValidTodos([{ id: '1' }])).toBe(false); // missing required fields
      expect(
        isValidTodos([{ id: '1', title: 'test', description: 'test', completed: 'false' }])
      ).toBe(false); // completed not boolean
    });

    it('should return true for todos with date strings (for parsing)', () => {
      const todoWithDateString = {
        id: '1',
        title: 'Test',
        description: 'Test',
        completed: false,
        createdAt: '2025-01-01T00:00:00.000Z',
      };
      expect(isValidTodos([todoWithDateString])).toBe(true);
    });
  });

  describe('loadTodos', () => {
    it('should return empty array when no data in storage', () => {
      mockSessionStorage.getItem.mockReturnValue(null);
      const result = loadTodos();
      expect(result).toEqual([]);
    });

    it('should load and parse valid todos', () => {
      const mockTodos = [createMockTodo()];
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(mockTodos));

      const result = loadTodos();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
      expect(result[0].createdAt).toBeInstanceOf(Date);
    });

    it('should handle corrupt JSON data', () => {
      mockSessionStorage.getItem.mockReturnValue('invalid json');

      const result = loadTodos();
      expect(result).toEqual([]);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('todos');
      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle invalid todo data', () => {
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify([{ invalid: 'data' }]));

      const result = loadTodos();
      expect(result).toEqual([]);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('todos');
      expect(console.warn).toHaveBeenCalledWith(
        'Invalid todos data in sessionStorage, clearing and starting fresh'
      );
    });

    it('should convert date strings to Date objects', () => {
      const todoWithDateString = {
        id: '1',
        title: 'Test',
        description: 'Test',
        completed: false,
        createdAt: '2025-01-01T00:00:00.000Z',
      };
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify([todoWithDateString]));

      const result = loadTodos();
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].createdAt.getFullYear()).toBe(2025);
    });
  });

  describe('saveTodos', () => {
    it('should save todos successfully', () => {
      const todos = [createMockTodo()];

      const result = saveTodos(todos);

      expect(result.success).toBe(true);
      expect(result.quotaExceeded).toBe(false);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('todos', JSON.stringify(todos));
    });

    it('should handle quota exceeded error', () => {
      const todos = [createMockTodo()];
      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';
      mockSessionStorage.setItem.mockImplementation(() => {
        throw quotaError;
      });

      const result = saveTodos(todos);

      expect(result.success).toBe(false);
      expect(result.quotaExceeded).toBe(true);
      expect(console.warn).toHaveBeenCalledWith(
        'Storage quota exceeded - your latest changes may not be saved'
      );
    });

    it('should handle other storage errors', () => {
      const todos = [createMockTodo()];
      mockSessionStorage.setItem.mockImplementation(() => {
        throw new Error('Some other error');
      });

      const result = saveTodos(todos);

      expect(result.success).toBe(false);
      expect(result.quotaExceeded).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });
});
