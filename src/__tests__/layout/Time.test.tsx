import React from 'react';
import { render } from '@testing-library/react';
import Time from '../../components/layout/Time';

describe('Time', () => {
  it('renders a time element with dateTime attribute', () => {
    render(<Time date="2024-01-15T00:00:00.000Z" />);
    expect(document.querySelector('time')).toBeInTheDocument();
    expect(document.querySelector('time')?.getAttribute('dateTime')).toBe(
      '2024-01-15T00:00:00.000Z'
    );
  });

  it('uses readableTime display by default (full=false)', () => {
    render(<Time date="2024-01-15T00:00:00.000Z" />);
    const el = document.querySelector('time');
    expect(el?.textContent).toBeTruthy();
  });

  it('uses formatDate display when full=true', () => {
    render(<Time date="2024-01-15T00:00:00.000Z" full={true} />);
    const el = document.querySelector('time');
    expect(el?.textContent).toBeTruthy();
    expect(el?.getAttribute('title')).toBeTruthy();
  });
});
