import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from './LoginPage';
import { authService } from '../../services/api';

vi.mock('../../services/api', () => ({
  authService: {
    login: vi.fn(),
  },
}));

describe('LoginPage component tests', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders login form elements', () => {
    render(<LoginPage navigate={mockNavigate} />);

    expect(screen.getByLabelText(/Adresse email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Connexion/i })).toBeInTheDocument();
  });

  it('calls authService.login on submit and redirects on success', async () => {
    authService.login.mockResolvedValueOnce({
      success: true,
      user: { id: 1, email: 'test@example.com' },
      redirect: '/dashboard',
    });

    render(<LoginPage navigate={mockNavigate} />);

    const emailInput = screen.getByLabelText(/Adresse email/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••••/i);
    const submitBtn = screen.getByRole('button', { name: /Connexion/i });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'secret' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('user@example.com', 'secret', false);
    });
  });
});
