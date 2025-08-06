import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoProvider } from '../contexts/TodoContext';
import { useTodo } from '../hooks/useTodo';
import { vi, beforeEach } from 'vitest';
// import { act } from 'react-dom/test-utils';

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

const TestComponent = () => {
  const { todos, addTodo, toggleTodoCompletion, deleteTodo } = useTodo();

  return (
    <div>
      <button data-testid="add-todo" onClick={() => addTodo('Test Todo', 'Test Description')}>
        Add Todo
      </button>
      <div data-testid="todo-count">{todos.length}</div>
      {todos.map(todo => (
        <div key={todo.id} data-testid={`todo-item-${todo.id}`}>
          <span data-testid={`todo-title-${todo.id}`}>{todo.title}</span>
          <span data-testid={`todo-desc-${todo.id}`}>{todo.description}</span>
          <span data-testid={`todo-completed-${todo.id}`}>
            {todo.completed ? 'Completed' : 'Not completed'}
          </span>
          <button data-testid={`toggle-${todo.id}`} onClick={() => toggleTodoCompletion(todo.id)}>
            Toggle
          </button>
          <button data-testid={`delete-${todo.id}`} onClick={() => deleteTodo(todo.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};

describe('TodoContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default to empty storage
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  it('provides empty todos array initially when no storage data', () => {
    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );

    expect(screen.getByTestId('todo-count').textContent).toBe('0');
    expect(mockSessionStorage.getItem).toHaveBeenCalledWith('todos');
  });

  it('loads todos from sessionStorage on initialization', () => {
    const storedTodos = JSON.stringify([
      {
        id: 'stored-1',
        title: 'Stored Todo',
        description: 'From storage',
        completed: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    mockSessionStorage.getItem.mockReturnValue(storedTodos);

    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );

    expect(screen.getByTestId('todo-count').textContent).toBe('1');
    expect(screen.getByText('Stored Todo')).toBeInTheDocument();
  });

  it('can add a new todo', async () => {
    const user = userEvent.setup();

    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );

    await user.click(screen.getByTestId('add-todo'));

    expect(screen.getByTestId('todo-count').textContent).toBe('1');
    expect(screen.getByText('Test Todo')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();

    // Should persist to storage
    expect(mockSessionStorage.setItem).toHaveBeenCalled();
  });

  it('can toggle todo completion status', async () => {
    const user = userEvent.setup();

    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );

    await user.click(screen.getByTestId('add-todo'));

    // Find the todo item by looking for the first (and only) todo item
    const todoElement = screen.getByTestId(/^todo-item-/);
    const todoId = todoElement.getAttribute('data-testid')?.replace('todo-item-', '') || '';

    expect(todoId).toBeTruthy(); // Ensure we found a valid todoId
    expect(screen.getByTestId(`todo-completed-${todoId}`).textContent).toBe('Not completed');

    await user.click(screen.getByTestId(`toggle-${todoId}`));

    expect(screen.getByTestId(`todo-completed-${todoId}`).textContent).toBe('Completed');

    // Should persist changes to storage
    expect(mockSessionStorage.setItem).toHaveBeenCalled();
  });

  it('can delete a todo', async () => {
    const user = userEvent.setup();

    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );

    await user.click(screen.getByTestId('add-todo'));

    expect(screen.getByTestId('todo-count').textContent).toBe('1');

    // Find the todo item by looking for the first (and only) todo item
    const todoElement = screen.getByTestId(/^todo-item-/);
    const todoId = todoElement.getAttribute('data-testid')?.replace('todo-item-', '') || '';

    expect(todoId).toBeTruthy(); // Ensure we found a valid todoId

    await user.click(screen.getByTestId(`delete-${todoId}`));

    expect(screen.getByTestId('todo-count').textContent).toBe('0');

    // Should persist changes to storage
    expect(mockSessionStorage.setItem).toHaveBeenCalled();
  });

  it('shows toast when storage quota is exceeded', async () => {
    const user = userEvent.setup();
    const quotaError = new Error('QuotaExceededError');
    quotaError.name = 'QuotaExceededError';
    mockSessionStorage.setItem.mockImplementation(() => {
      throw quotaError;
    });

    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );

    await user.click(screen.getByTestId('add-todo'));

    // Should show quota exceeded toast
    expect(
      screen.getByText('Storage quota exceeded - your latest changes may not be saved')
    ).toBeInTheDocument();
  });
});
