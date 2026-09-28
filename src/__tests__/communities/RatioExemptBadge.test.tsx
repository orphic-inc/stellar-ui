import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import RatioExemptBadge from '../../components/communities/RatioExemptBadge';
import type { RatioExempt } from '../../types';

describe('RatioExemptBadge', () => {
  it('renders nothing for an ordinary contribution', () => {
    const { container } = renderWithProviders(
      <RatioExemptBadge value="NONE" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('badges a Freepass as a success chip that explains it', () => {
    renderWithProviders(<RatioExemptBadge value="FREEPASS" />);
    const badge = screen.getByText('Freepass');
    expect(badge).toHaveAttribute('data-st', 'chip');
    expect(badge).toHaveAttribute('data-st-success');
    expect(badge).toHaveAttribute(
      'title',
      "Downloading this doesn't count against your ratio. The contributor is still credited."
    );
  });

  it('badges a Neutralpass as an info chip that explains it', () => {
    renderWithProviders(<RatioExemptBadge value="NEUTRALPASS" />);
    const badge = screen.getByText('Neutralpass');
    expect(badge).toHaveAttribute('data-st', 'chip');
    expect(badge).toHaveAttribute('data-st-info');
    expect(badge).toHaveAttribute(
      'title',
      "Ratio-neutral: counts toward nobody's ratio, downloader or contributor."
    );
  });

  // A value this build does not know (a newer api, or a response without the
  // field) must not take the row down with it.
  it.each([['SUPERPASS'], [undefined], ['toString']])(
    'renders nothing for an unknown value (%s)',
    (value) => {
      const { container } = renderWithProviders(
        <RatioExemptBadge value={value as unknown as RatioExempt} />
      );
      expect(container).toBeEmptyDOMElement();
    }
  );
});
