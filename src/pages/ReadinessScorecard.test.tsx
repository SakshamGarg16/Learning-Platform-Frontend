import { render, screen } from '@testing-library/react';
import { ReadinessScorecard } from './ReadinessScorecard';
import { api } from '../lib/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, expect, test, describe, beforeEach } from 'vitest';

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

describe('ReadinessScorecard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ReadinessScorecard />
      </QueryClientProvider>
    );
  };

  test('renders loading state initially', () => {
    (api.get as any).mockReturnValue(new Promise(() => {})); // Never resolves
    renderComponent();
    expect(screen.getByText(/Calculating readiness metrics/i)).toBeInTheDocument();
  });

  test('renders snapshot data correctly', async () => {
    (api.get as any).mockResolvedValue({ 
      data: [{ 
        overall_score: 85.0, 
        knowledge_score: 90.0, 
        validated_score: 80.0, 
        graduation_eligible: true 
      }] 
    });

    renderComponent();

    const score = await screen.findByText(/85/);
    expect(score).toBeInTheDocument();
    expect(screen.getByText(/Eligible for Graduation/i)).toBeInTheDocument();
    expect(screen.getByText(/90/)).toBeInTheDocument();
    expect(screen.getByText(/80/)).toBeInTheDocument();
  });

  test('shows development in progress when not eligible for graduation', async () => {
    (api.get as any).mockResolvedValue({ 
      data: [{ 
        overall_score: 45.0, 
        knowledge_score: 50.0, 
        validated_score: 40.0, 
        graduation_eligible: false 
      }] 
    });

    renderComponent();

    await screen.findByText(/45/);
    expect(screen.getByText(/Development in Progress/i)).toBeInTheDocument();
  });
});
