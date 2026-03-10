import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Onboarding } from './Onboarding';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { vi, expect, test, describe, beforeEach } from 'vitest';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('../lib/api', () => ({
  api: {
    post: vi.fn()
  }
}));

describe('Onboarding Component', () => {
  const mockUser = { name: 'John Doe', email: 'john@test.com', role: 'learner' };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser });
    
    // Safety mock for location
    vi.stubGlobal('location', { href: '' });
  });

  const renderComponent = () => {
    return render(<Onboarding />);
  };

  test('renders form fields with user name prefilled', () => {
    renderComponent();
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/\+1 \(555\)/i)).toBeInTheDocument();
  });

  test('updates fields and submits form for learner', async () => {
    (api.post as any).mockResolvedValue({});
    renderComponent();

    const phoneInput = screen.getByPlaceholderText(/\+1 \(555\)/i);
    fireEvent.change(phoneInput, { target: { value: '1234567890' } });

    // Mock file upload
    const file = new File(['resume'], 'resume.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/Click to upload/i) as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.submit(screen.getByRole('form', { name: /onboarding-form/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
      expect(window.location.href).toBe('/');
    }, { timeout: 3000 });
  });

  test('admin does not see resume upload requirement', () => {
    (useAuth as any).mockReturnValue({ user: { ...mockUser, role: 'admin' } });
    renderComponent();
    
    expect(screen.queryByLabelText(/Click to upload/i)).not.toBeInTheDocument();
    expect(screen.getByText('Full Name')).toBeInTheDocument();
  });

  test('shows alert on submission failure', async () => {
    (api.post as any).mockRejectedValue(new Error('Network Error'));
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    renderComponent();
    fireEvent.change(screen.getByPlaceholderText(/\+1 \(555\)/i), { target: { value: '1234567890' } });
    fireEvent.submit(screen.getByRole('form', { name: /onboarding-form/i }));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Submission failed. Please check your network.');
    });
  });
});
