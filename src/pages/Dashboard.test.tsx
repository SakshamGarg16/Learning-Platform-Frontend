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
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/readiness/') {
        return Promise.resolve({ data: [] });
      }
      if (url === '/tracks/') {
        return Promise.resolve({ data: [] });
      }
      if (url === '/roadmaps/') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
    renderDashboard();
    
    expect(screen.getByText(/Welcome back, Saksham/i)).toBeInTheDocument();
  });

  test('displays readiness score and active progress stats', async () => {
    // Mock readiness data and tracks
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/readiness/') {
        return Promise.resolve({ data: [{ overall_score: '85.5' }] });
      }
      if (url === '/tracks/') {
        return Promise.resolve({ data: [
            { id: 1, title: 'Track 1', is_enrolled: true, progress_percentage: 50 },
            { id: 2, title: 'Track 2', is_creator: true, progress_percentage: 20 }
        ] });
      }
      if (url === '/roadmaps/') {
        return Promise.resolve({ data: [] });
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
        if (url === '/roadmaps/') {
          return Promise.resolve({ data: [] });
        }
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
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/readiness/') {
        return Promise.resolve({ data: [] });
      }
      if (url === '/tracks/') {
        return Promise.resolve({ data: [] });
      }
      if (url === '/roadmaps/') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/No active tracks found/i)).toBeInTheDocument();
    });
  });

  test('groups roadmap-owned tracks separately from standalone tracks', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/readiness/') {
        return Promise.resolve({ data: [{ overall_score: '72.0' }] });
      }
      if (url === '/roadmaps/') {
        return Promise.resolve({
          data: [
            {
              id: 'roadmap-1',
              title: 'Backend Architect',
              description: 'Structured backend growth path',
              is_enrolled: false,
              steps: [
                { id: 'step-1', title: 'Python Foundations', is_completed: true, track: { id: 'track-roadmap-1' } },
                { id: 'step-2', title: 'Distributed Systems', is_completed: false, track: { id: 'track-roadmap-2' } }
              ]
            }
          ]
        });
      }
      if (url === '/tracks/') {
        return Promise.resolve({
          data: [
            { id: 'track-roadmap-1', title: 'Python Foundations', is_enrolled: true, progress_percentage: 100, description: 'Roadmap track' },
            { id: 'track-roadmap-2', title: 'Distributed Systems', is_enrolled: true, progress_percentage: 30, description: 'Roadmap track' },
            { id: 'track-standalone', title: 'Advanced React', is_enrolled: true, progress_percentage: 50, description: 'Standalone track' }
          ]
        });
      }
      return Promise.resolve({ data: [] });
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Your Designed Roadmaps')).toBeInTheDocument();
      expect(screen.getByText('Backend Architect')).toBeInTheDocument();
      expect(screen.getByText('Advanced React')).toBeInTheDocument();
    });

    expect(screen.queryByText('Python Foundations')).not.toBeInTheDocument();
    expect(screen.queryByText('Distributed Systems')).not.toBeInTheDocument();
  });
});
