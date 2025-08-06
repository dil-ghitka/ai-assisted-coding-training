import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Toast } from '../components/Toast/Toast';
import { useToast } from '../components/Toast/useToast';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';

const theme = createTheme();

const TestComponent = () => {
  const { toast, showToast, hideToast } = useToast();

  return (
    <ThemeProvider theme={theme}>
      <div>
        <button onClick={() => showToast('Test message', 'success')}>Show Toast</button>
        <button onClick={() => showToast('Error message', 'error')}>Show Error</button>
        <button onClick={() => showToast('Warning message', 'warning')}>Show Warning</button>
        <Toast
          message={toast.message}
          severity={toast.severity}
          open={toast.open}
          onClose={hideToast}
        />
      </div>
    </ThemeProvider>
  );
};

describe('Toast component', () => {
  it('should render toast when open', () => {
    render(
      <ThemeProvider theme={theme}>
        <Toast message="Test message" open={true} onClose={() => {}} />
      </ThemeProvider>
    );

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should not render toast when closed', () => {
    render(
      <ThemeProvider theme={theme}>
        <Toast message="Test message" open={false} onClose={() => {}} />
      </ThemeProvider>
    );

    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();
    render(
      <ThemeProvider theme={theme}>
        <Toast message="Test message" open={true} onClose={mockOnClose} />
      </ThemeProvider>
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});

describe('useToast hook', () => {
  it('should show and hide toasts', async () => {
    render(<TestComponent />);

    // Initially no toast
    expect(screen.queryByText('Test message')).not.toBeInTheDocument();

    // Show success toast
    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Test message')).toBeInTheDocument();

    // Show error toast
    fireEvent.click(screen.getByText('Show Error'));
    expect(screen.getByText('Error message')).toBeInTheDocument();

    // Show warning toast
    fireEvent.click(screen.getByText('Show Warning'));
    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });

  it('should auto-hide toast after specified duration', async () => {
    const mockOnClose = vi.fn();
    render(
      <ThemeProvider theme={theme}>
        <Toast
          message="Auto-hide message"
          open={true}
          onClose={mockOnClose}
          autoHideDuration={100}
        />
      </ThemeProvider>
    );

    expect(screen.getByText('Auto-hide message')).toBeInTheDocument();

    // Wait for the onClose to be called due to auto-hide
    await waitFor(
      () => {
        expect(mockOnClose).toHaveBeenCalled();
      },
      { timeout: 1000 }
    );
  });
});
