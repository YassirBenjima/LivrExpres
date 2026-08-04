import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RegisterPage from './RegisterPage';

vi.mock('../../services/api', () => ({
  authService: {
    getCities: vi.fn().mockResolvedValue({ cities: ['Casablanca', 'Rabat'] }),
    register: vi.fn(),
  },
}));

describe('RegisterPage component tests', () => {
  it('renders registration form header', () => {
    render(<RegisterPage navigate={() => {}} />);
    expect(screen.getByRole('heading', { name: /Devenir client/i })).toBeInTheDocument();
  });
});
