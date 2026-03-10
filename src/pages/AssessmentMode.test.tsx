import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AssessmentMode } from './AssessmentMode';
import { api } from '../lib/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, expect, test, describe, beforeEach } from 'vitest';

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

describe('AssessmentMode Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (trackId: string, moduleId: string) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/track/${trackId}/module/${moduleId}/assessment`]}>
          <Routes>
            <Route path="/track/:trackId/module/:moduleId/assessment" element={<AssessmentMode />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  test('renders intro step with question count', async () => {
    (api.get as any).mockResolvedValue({ 
      data: { 
        id: 'm1', 
        title: 'Module 1', 
        assessment: { id: 'a1', questions_data: [{}, {}, {}] } 
      } 
    });

    renderComponent('t1', 'm1');

    await waitFor(() => {
      expect(screen.getByText('3 Units')).toBeInTheDocument();
      expect(screen.getByText(/Begin Dynamic Assessment/i)).toBeInTheDocument();
    });
  });

  test('enters quiz mode and answers questions', async () => {
    (api.get as any).mockResolvedValue({ 
      data: { 
        id: 'm1', 
        title: 'Module 1', 
        assessment: { 
            id: 'a1', 
            questions_data: [{ question: 'Q1', options: ['A', 'B'], type: 'mcq' }] 
        } 
      } 
    });

    renderComponent('t1', 'm1');

    const beginBtn = await screen.findByText(/Begin Dynamic Assessment/i);
    fireEvent.click(beginBtn);

    const optionA = await screen.findByText('A');
    fireEvent.click(optionA);

    expect(screen.getByText('1 / 1 Units Filled')).toBeInTheDocument();
  });

  test('submits assessment and shows success result', async () => {
    (api.get as any).mockResolvedValue({ 
      data: { 
        id: 'm1', 
        title: 'Module 1', 
        assessment: { 
            id: 'a1', 
            questions_data: [{ question: 'Q1', options: ['A', 'B'], type: 'mcq' }] 
        } 
      } 
    });
    (api.post as any).mockResolvedValue({ 
        data: { passed: true, score: 100, ai_feedback: 'Great job' } 
    });

    renderComponent('t1', 'm1');

    fireEvent.click(await screen.findByText(/Begin Dynamic Assessment/i));
    fireEvent.click(await screen.findByText('A'));
    fireEvent.click(screen.getByText(/Finalize Submission/i));

    await waitFor(() => {
      expect(screen.getByText('Assessment Validated')).toBeInTheDocument();
      expect(screen.getByText('100.0%')).toBeInTheDocument();
      expect(screen.getByText('Great job')).toBeInTheDocument();
    });
  });

  test('shows failure result and remedial notification', async () => {
    (api.get as any).mockResolvedValue({ 
      data: { 
        id: 'm1', 
        title: 'Module 1', 
        assessment: { 
            id: 'a1', 
            questions_data: [{ question: 'Q1', options: ['A', 'B'], type: 'mcq' }] 
        } 
      } 
    });
    (api.post as any).mockResolvedValue({ 
        data: { passed: false, score: 0, ai_feedback: 'Needs work', remedial_module_generated: {} } 
    });

    renderComponent('t1', 'm1');

    fireEvent.click(await screen.findByText(/Begin Dynamic Assessment/i));
    fireEvent.click(await screen.findByText('A'));
    fireEvent.click(screen.getByText(/Finalize Submission/i));

    await waitFor(() => {
      expect(screen.getByText('Deficit Detected')).toBeInTheDocument();
      expect(screen.getByText('0.0%')).toBeInTheDocument();
      expect(screen.getByText(/Remedial Sequence Active/i)).toBeInTheDocument();
    });
  });
});
