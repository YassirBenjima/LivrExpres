import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PasswordInput from './PasswordInput';

describe('PasswordInput component unit tests', () => {
  it('renders password input in password type by default', () => {
    render(<PasswordInput value="secret" onChange={() => {}} placeholder="Enter password" />);
    
    const input = screen.getByPlaceholderText('Enter password');
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveValue('secret');
  });

  it('toggles password visibility when toggle button is clicked', () => {
    render(<PasswordInput value="secret123" onChange={() => {}} placeholder="Enter password" />);
    
    const input = screen.getByPlaceholderText('Enter password');
    const toggleButton = screen.getByRole('button');

    expect(input).toHaveAttribute('type', 'password');
    
    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute('type', 'text');

    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('calls onChange handler when typed into', () => {
    const handleChange = vi.fn();
    render(<PasswordInput value="" onChange={handleChange} placeholder="Enter password" />);

    const input = screen.getByPlaceholderText('Enter password');
    fireEvent.change(input, { target: { value: 'newpassword' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
  });
});
