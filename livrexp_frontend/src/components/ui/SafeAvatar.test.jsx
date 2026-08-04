import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SafeAvatar from './SafeAvatar';

describe('SafeAvatar component unit tests', () => {
  it('renders initial letter when image src is missing', () => {
    render(<SafeAvatar name="Yassir Benjima" size={40} />);
    
    const initialSpan = screen.getByText('Y');
    expect(initialSpan).toBeInTheDocument();
    expect(initialSpan).toHaveAttribute('title', 'Yassir Benjima');
  });

  it('renders image when valid src is provided', () => {
    render(<SafeAvatar src="https://example.com/avatar.jpg" name="Yassir" size={32} />);
    
    const img = screen.getByAltText('Yassir');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('falls back to initial letter if image loading fails', () => {
    render(<SafeAvatar src="https://example.com/broken.jpg" name="Karim" size={32} />);
    
    const img = screen.getByAltText('Karim');
    fireEvent.error(img);

    const fallbackSpan = screen.getByText('K');
    expect(fallbackSpan).toBeInTheDocument();
  });
});
