import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CandidatePerspective from './CandidatePerspective';
import { api } from '../lib/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, expect, test, describe, beforeEach } from 'vitest';

// Mock Mermaid to avoid rendering issues in JSDOM
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: '<svg>Mocked Mermaid</svg>' })
  }
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

describe('CandidatePerspective Component', () => {
  const mockDossier = {
    learner: { name: 'Alice Smith', email: 'alice@test.com' },
    personalized_summary: 'Targeting gaps in React basics.',
    modules: [
      {
        id: 'm1',
        title: 'Module 1',
        lessons: [{ id: 'l1', title: 'Lesson 1', content: 'Lesson content here' }],
        assessment: {
          id: 'a1',
          attempts: [{ id: 'att1', score: 85, passed: true, ai_feedback: 'Good work', answers: { "0": 0 }, created_at: new Date().toISOString() }],
          questions: [{ question: 'Q1', options: ['A', 'B'], correct_answer: 0 }]
        }
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  const renderComponent = (trackId: string, learnerId: string) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/admin/track/${trackId}/candidate/${learnerId}/perspective`]}>
          <Routes>
            <Route path="/admin/track/:trackId/candidate/:learnerId/perspective" element={<CandidatePerspective />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  test('renders loading interceptor state', () => {
    (api.get as any).mockReturnValue(new Promise(() => {}));
    renderComponent('t1', 'c1');
    expect(screen.getByText(/Intercepting Candidate Stream/i)).toBeInTheDocument();
  });

  test('renders architectural map by default', async () => {
    (api.get as any).mockResolvedValue({ data: mockDossier });
    renderComponent('t1', 'c1');

    await waitFor(() => {
      expect(screen.getByText(/Academic Map/i)).toBeInTheDocument();
      expect(screen.getByText(/Targeting gaps in React/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Module 1/i)[0]).toBeInTheDocument();
    });
  });

  test('switches to lesson view on sidebar click', async () => {
    (api.get as any).mockResolvedValue({ data: mockDossier });
    renderComponent('t1', 'c1');

    const lessonButtons = await screen.findAllByRole('button', { name: /Lesson 1/i });
    fireEvent.click(lessonButtons[0]);

    await waitFor(() => {
      expect(screen.getAllByText(/Lesson 1/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Lesson content here/i)).toBeInTheDocument();
    });
  });

  test('displays assessment audit details', async () => {
    (api.get as any).mockResolvedValue({ data: mockDossier });
    renderComponent('t1', 'c1');

    const auditBtns = await screen.findAllByText(/View Evaluation/i);
    fireEvent.click(auditBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/Technical Evaluation/i)).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText(/Audit Status: PASSED/i)).toBeInTheDocument();
      expect(screen.getByText(/Good work/i)).toBeInTheDocument();
    });
  });

  test('shows divergence badge for wrong answers in audit', async () => {
    const dossierWithFailure = {
        ...mockDossier,
        modules: [
            {
                ...mockDossier.modules[0],
                assessment: {
                    ...mockDossier.modules[0].assessment,
                    attempts: [{ 
                        id: 'att2', 
                        score: 0, 
                        passed: false, 
                        ai_feedback: 'Failed', 
                        answers: { "0": 1 }, // Wrong answer
                        created_at: new Date().toISOString() 
                    }]
                }
            }
        ]
    };
    (api.get as any).mockResolvedValue({ data: dossierWithFailure });
    renderComponent('t1', 'c1');

    const auditBtn = await screen.findByText(/View Evaluation/i);
    fireEvent.click(auditBtn);

    await waitFor(() => {
        expect(screen.getByText(/Divergence/i)).toBeInTheDocument();
        expect(screen.getByText(/Audit Status: DEFICIENCY/i)).toBeInTheDocument();
    });
  });

  test('handles mermaid render error fallback', async () => {
    // Mock mermaid.render to throw
    const mermaid = (await import('mermaid')).default;
    vi.mocked(mermaid.render).mockRejectedValueOnce(new Error('Mermaid Error'));

    // A dossier with a lesson containing mermaid
    const mDossier = {
        ...mockDossier,
        modules: [{
            ...mockDossier.modules[0],
            lessons: [{ id: 'l1', title: 'UniqueLessonTitle', content: 'graph TD\n  A[Start Node] --> B[End Node]\n  B --> C[More Nodes]' }]
        }]
    };
    (api.get as any).mockResolvedValue({ data: mDossier });
    renderComponent('t1', 'c1');

    const lessonBtns = await screen.findAllByRole('button', { name: /UniqueLessonTitle/i });
    fireEvent.click(lessonBtns[0]);

    await waitFor(() => {
        expect(screen.getByText(/Matrix Integrity Anomaly/i)).toBeInTheDocument();
    });
  });

  test('switches back to architectural perspective from lesson view', async () => {
    (api.get as any).mockResolvedValue({ data: mockDossier });
    renderComponent('t1', 'c1');

    const lessonBtns = await screen.findAllByRole('button', { name: /Lesson 1/i });
    fireEvent.click(lessonBtns[0]);
    
    // Header should show lesson title
    expect(await screen.findByRole('heading', { name: /Lesson 1/i })).toBeInTheDocument();

    const backBtn = await screen.findByText(/Return to Map/i);
    fireEvent.click(backBtn);

    await waitFor(() => {
        expect(screen.queryByText(/Return to Map/i)).not.toBeInTheDocument();
        expect(screen.getByText(/Academic Map/i)).toBeInTheDocument();
    });
  });

  test('shows divergence for multi-select partial answers in audit', async () => {
    const multiDossier = {
        ...mockDossier,
        modules: [{
            ...mockDossier.modules[0],
            assessment: {
                questions: [{ question: 'MultiQ', options: ['O1', 'O2', 'O3'], correct_answer: [0, 1] }],
                attempts: [{
                    id: 'att-m',
                    passed: false,
                    score: 50,
                    answers: { "0": [0] }, // Partial, should be [0, 1]
                    ai_feedback: 'Partial',
                    created_at: new Date().toISOString()
                }]
            }
        }]
    };
    (api.get as any).mockResolvedValue({ data: multiDossier });
    renderComponent('t1', 'c1');

    const auditBtn = await screen.findByText(/View Evaluation/i);
    fireEvent.click(auditBtn);

    // Wait for the audit view to render
    expect(await screen.findByText(/Technical Evaluation/i)).toBeInTheDocument();

    await waitFor(async () => {
        const divergenceBadges = screen.getAllByText(/Divergence/i);
        expect(divergenceBadges.length).toBeGreaterThan(0);
        // Check if it lists the marked answer O1 (should be in option grid AND audit trace)
        const o1Elements = await screen.findAllByText(/O1/i);
        expect(o1Elements.length).toBeGreaterThan(0);
        // Check if it lists the expected key badge
        expect(screen.getByText(/EXPECTED KEY/i)).toBeInTheDocument();
    });
  });
});
