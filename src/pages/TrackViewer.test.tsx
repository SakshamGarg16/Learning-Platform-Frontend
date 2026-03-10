import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TrackViewer } from './TrackViewer';
import { api } from '../lib/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, expect, test, describe, beforeEach } from 'vitest';

vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn()
  },
  BASE_URL: 'http://localhost:8000'
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('TrackViewer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  const renderComponent = (id: string) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/track/${id}`]}>
          <Routes>
            <Route path="/track/:trackId" element={<TrackViewer />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  test('renders loading state', () => {
    (api.get as any).mockReturnValue(new Promise(() => {}));
    renderComponent('123');
    expect(screen.getByText(/curriculum matrix/i)).toBeInTheDocument();
  });

  test('renders landing page for non-enrolled users', async () => {
    (api.get as any).mockResolvedValue({ 
      data: { 
        id: '123', 
        title: 'Python Mastery', 
        description: 'Advanced Python', 
        is_enrolled: false, 
        is_creator: false,
        modules: [{ title: 'Module 1' }] 
      } 
    });

    renderComponent('123');

    await waitFor(() => {
      expect(screen.getByText('Python Mastery')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Enroll in Track/i })).toBeInTheDocument();
    });
  });

  test('calls enroll API on button click', async () => {
    (api.get as any).mockResolvedValue({ 
        data: { id: '123', title: 'T', is_enrolled: false, is_creator: false } 
    });
    (api.post as any).mockResolvedValue({});

    renderComponent('123');

    const enrollBtn = await screen.findByRole('button', { name: /Enroll in Track/i });
    fireEvent.click(enrollBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/tracks/123/enroll/');
    });
  });

  test('renders module list for enrolled users', async () => {
    (api.get as any).mockResolvedValue({ 
      data: { 
        id: '123', 
        title: 'Python Mastery', 
        is_enrolled: true, 
        is_creator: false,
        modules: [
            { id: 'm1', title: 'Introduction', is_unlocked: true, lessons: [{ id: 'l1', title: 'Lesson 1', order: 0 }] }
        ] 
      } 
    });

    renderComponent('123');

    await waitFor(() => {
      expect(screen.getByText(/Introduction/i)).toBeInTheDocument();
      // Using getAllByText since "Lesson 1" appears in both the title and order subtitle
      expect(screen.getAllByText(/Lesson 1/i)[0]).toBeInTheDocument();
    });
  });

  test('renders candidate roster for creators', async () => {
    (api.get as any).mockImplementation((url: string) => {
        if (url === '/tracks/123/') {
            return Promise.resolve({ data: { id: '123', title: 'T', is_enrolled: true, is_creator: true, modules: [] } });
        }
        if (url === '/tracks/123/enrolled_candidates/') {
            return Promise.resolve({ data: [{ id: 'c1', name: 'John Doe', email: 'j@d.com', progress: 80 }] });
        }
    });

    renderComponent('123');

    await waitFor(() => {
      expect(screen.getByText(/Enrollment Roster/i)).toBeInTheDocument();
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });
  });
});
