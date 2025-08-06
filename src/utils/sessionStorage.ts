import type { Todo } from '../types/Todo';

const STORAGE_KEY = 'todos';

/**
 * Validates that the data is a valid array of Todo objects
 */
export const isValidTodos = (data: unknown): data is Todo[] => {
  if (!Array.isArray(data)) {
    return false;
  }

  return data.every(item => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof item.id === 'string' &&
      typeof item.title === 'string' &&
      typeof item.description === 'string' &&
      typeof item.completed === 'boolean' &&
      (item.createdAt instanceof Date || typeof item.createdAt === 'string')
    );
  });
};

/**
 * Loads todos from sessionStorage
 * Returns empty array if no data, invalid data, or parse error
 */
export const loadTodos = (): Todo[] => {
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    if (!isValidTodos(parsed)) {
      console.warn('Invalid todos data in sessionStorage, clearing and starting fresh');
      window.sessionStorage.removeItem(STORAGE_KEY);
      return [];
    }

    // Convert date strings back to Date objects
    return parsed.map(todo => ({
      ...todo,
      createdAt: new Date(todo.createdAt),
    }));
  } catch (error) {
    console.warn('Failed to parse todos from sessionStorage:', error);
    window.sessionStorage.removeItem(STORAGE_KEY);
    return [];
  }
};

/**
 * Saves todos to sessionStorage
 * Returns true if successful, false if quota exceeded or other error
 */
export const saveTodos = (todos: Todo[]): { success: boolean; quotaExceeded: boolean } => {
  try {
    const serialized = JSON.stringify(todos);
    window.sessionStorage.setItem(STORAGE_KEY, serialized);
    return { success: true, quotaExceeded: false };
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded - your latest changes may not be saved');
      return { success: false, quotaExceeded: true };
    }
    console.error('Failed to save todos to sessionStorage:', error);
    return { success: false, quotaExceeded: false };
  }
};
