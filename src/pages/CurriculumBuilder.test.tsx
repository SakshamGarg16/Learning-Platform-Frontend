import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CurriculumBuilder } from './CurriculumBuilder';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, expect, test, describe, beforeEach } from 'vitest';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('CurriculumBuilder Component', () => {
  const mockAdmin = { name: 'Admin User', email: 'admin@test.com', role: 'admin' };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockAdmin });
    (api.get as any).mockResolvedValue({ data: [] });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <CurriculumBuilder />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  test('renders generator input', () => {
    renderComponent();
    expect(screen.getByPlaceholderText(/e.g. Advanced Django/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Deploy Track/i })).toBeInTheDocument();
  });

  test('calls generate API on form submission', async () => {
    (api.post as any).mockResolvedValue({ 
      data: { id: 'track-123', title: 'Python Mastery', description: 'Deep dive' } 
    });

    renderComponent();

    const input = screen.getByPlaceholderText(/e.g. Advanced Django/i);
    fireEvent.change(input, { target: { value: 'Python' } });
    fireEvent.click(screen.getByRole('button', { name: /Deploy Track/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/tracks/generate/', { topic: 'Python' });
      expect(screen.getByText('Python Mastery')).toBeInTheDocument();
      expect(screen.getByText(/Deep dive/i)).toBeInTheDocument();
    });
  });

  test('displays existing managed tracks', async () => {
    (api.get as any).mockResolvedValue({ 
      data: [
        { id: '1', title: 'Existing Track', is_creator: true, modules: [], created_at: new Date().toISOString() }
      ] 
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Existing Track')).toBeInTheDocument();
    });
  });

  test('expands candidates list for admin on click', async () => {
    (api.get as any).mockImplementation((url: string) => {
        if (url === '/tracks/') {
            return Promise.resolve({ data: [{ id: '1', title: 'Track 1', is_creator: true, created_at: new Date().toISOString() }] });
        }
        if (url === '/tracks/1/enrolled_candidates/') {
            return Promise.resolve({ data: [{ id: 'c1', name: 'Candidate Alpha', email: 'a@c.com', progress: 45, enrolled_at: new Date().toISOString() }] });
        }
        return Promise.resolve({ data: [] });
    });

    renderComponent();

    const trackItem = await screen.findByText('Track 1');
    fireEvent.click(trackItem);

    await waitFor(() => {
        expect(screen.getByText('Candidate Alpha')).toBeInTheDocument();
        expect(screen.getByText('45%')).toBeInTheDocument();
    });
  });

  test('handles track generation failure', async () => {
    (api.post as any).mockRejectedValueOnce(new Error('Generation Error'));
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderComponent();

    const input = screen.getByPlaceholderText(/e.g. Advanced Django/i);
    fireEvent.change(input, { target: { value: 'Python' } });
    fireEvent.click(screen.getByRole('button', { name: /Deploy Track/i }));

    await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Failed to generate tracking curriculum'));
    });
  });

  test('copies enrollment link to clipboard', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    (api.get as any).mockResolvedValue({ 
      data: [{ id: '1', title: 'T1', is_creator: true, created_at: new Date().toISOString() }] 
    });

    renderComponent();

    await screen.findByText('T1');
    const copyBtn = await screen.findByText(/Copy Link/i);
    fireEvent.click(copyBtn);

    expect(mockWriteText).toHaveBeenCalledWith(expect.stringContaining('/track/enroll/1'));
  });

  test('shows empty tracks message when no tracks exist', async () => {
    (api.get as any).mockResolvedValue({ data: [] });
    renderComponent();

    await waitFor(() => {
        expect(screen.getByText(/No tracks have been deployed yet/i)).toBeInTheDocument();
    });
  });
});
