import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Signup } from './Signup';
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

describe('Signup Component', () => {
  const mockSignup = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      signup: mockSignup,
      isAuthenticated: false
    });
  });

  test('renders signup form items', () => {
    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument();
  });

  test('shows admin badge when forceAdmin is true', () => {
    render(
      <BrowserRouter>
        <Signup forceAdmin={true} />
      </BrowserRouter>
    );

    expect(screen.getByText(/Administrative Privileges Enabled/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Initialize Admin Profile/i })).toBeInTheDocument();
  });

  test('calls signup with correct data', async () => {
    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Full Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/Email Address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith({
        full_name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        is_admin: false
      });
    });
  });

  test('calls signup with is_admin true when forceAdmin is used', async () => {
    render(
      <BrowserRouter>
        <Signup forceAdmin={true} />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Full Name/i), { target: { value: 'Admin User' } });
    fireEvent.change(screen.getByPlaceholderText(/Email Address/i), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'adminpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Initialize Admin Profile/i }));

    await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith({
          full_name: 'Admin User',
          email: 'admin@example.com',
          password: 'adminpass',
          is_admin: true
        });
      });
  });

  test('redirects to login on success', async () => {
    mockSignup.mockResolvedValueOnce({});
    render(
        <BrowserRouter>
          <Signup />
        </BrowserRouter>
      );
    
    fireEvent.change(screen.getByPlaceholderText(/Full Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/Email Address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', expect.objectContaining({ state: expect.anything() }));
    });
  });
});
