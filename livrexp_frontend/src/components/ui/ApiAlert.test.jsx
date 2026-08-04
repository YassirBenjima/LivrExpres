import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ApiAlert from './ApiAlert';

describe('ApiAlert component unit test', () => {
  it('renders without crashing when message is provided', () => {
    const { container } = render(<ApiAlert type="success" message="Opération réussie !" />);
    expect(container).toBeDefined();
  });
});
