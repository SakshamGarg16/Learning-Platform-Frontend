import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Login } from './Login';
import { useAuth } from '../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { vi, expect, test, describe, beforeEach } from 'vitest';

// Mock useAuth hook
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock useNavigate from react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: { message: '' } })
  };
});

describe('Login Component', () => {
  const mockLoginWithCredentials = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      loginWithCredentials: mockLoginWithCredentials,
      isAuthenticated: false
    });
  });

  test('renders login form items', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/operator@remcloud.io/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Authorize Access/i })).toBeInTheDocument();
  });

  test('updates input fields on change', () => {
    render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );
  
      const emailInput = screen.getByPlaceholderText(/operator@remcloud.io/i) as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText(/••••••••/i) as HTMLInputElement;
  
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
  
      expect(emailInput.value).toBe('test@example.com');
      expect(passwordInput.value).toBe('password123');
  });

  test('calls loginWithCredentials with correct data on submit', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText(/operator@remcloud.io/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitBtn = screen.getByRole('button', { name: /Authorize Access/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLoginWithCredentials).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  test('shows error message on login failure', async () => {
    mockLoginWithCredentials.mockRejectedValueOnce(new Error('Invalid credentials'));
    
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText(/operator@remcloud.io/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitBtn = screen.getByRole('button', { name: /Authorize Access/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });

  test('redirects to dashboard if already authenticated', () => {
    (useAuth as any).mockReturnValue({
        loginWithCredentials: mockLoginWithCredentials,
        isAuthenticated: true
      });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });
});
