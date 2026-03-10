import { render, screen, waitFor } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, expect, test, describe, beforeEach } from 'vitest';

// Mocking useAuth and api
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn()
  }
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('Dashboard Component', () => {
  const mockUser = { name: 'Saksham Garg', email: 'sak@gmail.com' };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser });
  });

  const renderDashboard = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  test('renders welcome message with user name', async () => {
    (api.get as any).mockResolvedValue({ data: [] });
    renderDashboard();
    
    expect(screen.getByText(/Welcome back, Saksham/i)).toBeInTheDocument();
  });

  test('displays readiness score and active progress stats', async () => {
    // Mock readiness data and tracks
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/readiness/') {
        return Promise.resolve({ data: [{ score: '85.5' }] });
      }
      if (url === '/tracks/') {
        return Promise.resolve({ data: [
            { id: 1, title: 'Track 1', is_enrolled: true, progress_percentage: 50 },
            { id: 2, title: 'Track 2', is_creator: true, progress_percentage: 20 }
        ] });
      }
      return Promise.resolve({ data: [] });
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('85.5')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // 1 enrolled + 1 creator = 2 active
    });
  });

  test('renders tracks in current curriculum', async () => {
    (api.get as any).mockImplementation((url: string) => {
        if (url === '/tracks/') {
          return Promise.resolve({ data: [
              { id: 1, title: 'Advanced Python', is_enrolled: true, progress_percentage: 50, description: 'Learn internals' },
          ] });
        }
        return Promise.resolve({ data: [] });
      });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Advanced Python')).toBeInTheDocument();
      expect(screen.getByText(/Learn internals/i)).toBeInTheDocument();
    });
  });

  test('shows empty state when no tracks exist', async () => {
    (api.get as any).mockResolvedValue({ data: [] });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/No active tracks found/i)).toBeInTheDocument();
    });
  });
});
