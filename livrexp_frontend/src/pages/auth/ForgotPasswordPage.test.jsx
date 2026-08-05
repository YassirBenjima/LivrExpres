import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ForgotPasswordPage from './ForgotPasswordPage';

vi.mock('../../services/api', () => ({
  authService: {
    forgotPassword: vi.fn(),
  },
}));

describe('ForgotPasswordPage component tests', () => {
  it('renders forgot password title', () => {
    render(<ForgotPasswordPage navigate={() => {}} />);
    expect(screen.getByText(/Mot de passe oublié/i)).toBeInTheDocument();
  });
});
