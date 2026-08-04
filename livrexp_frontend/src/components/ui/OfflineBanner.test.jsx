import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import OfflineBanner from './OfflineBanner';

describe('OfflineBanner component unit test', () => {
  it('renders offline banner component cleanly', () => {
    const { container } = render(<OfflineBanner />);
    expect(container).toBeDefined();
  });
});
