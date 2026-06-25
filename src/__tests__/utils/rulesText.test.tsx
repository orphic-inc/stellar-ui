import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderRuleText } from '../../utils/rulesText';

const variables = {
  site_name: 'Stellar',
  disabled_channel: '#disabled',
  irc: '/irc',
  staffpm: '/inbox/staff',
  vpns_article: 'https://kb.example.com/vpns',
  invite_article: '/wiki/invite'
};

const renderText = (text: string) =>
  render(<MemoryRouter>{renderRuleText(text, variables)}</MemoryRouter>);

describe('renderRuleText', () => {
  it('substitutes a text token in place', () => {
    const { container } = renderText('Requesting invites to ${site_name} is.');
    expect(container.textContent).toBe('Requesting invites to Stellar is.');
  });

  it('renders a bare route token as an internal link with its UI label', () => {
    renderText('contact staff in ${disabled_channel} on ${irc}.');
    const link = screen.getByRole('link', { name: 'IRC' });
    expect(link).toHaveAttribute('href', '/irc');
    // the text token next to it still substitutes as plain text
    expect(
      screen.getByText(/contact staff in #disabled on/)
    ).toBeInTheDocument();
  });

  it('renders a bare URL token as an external link (new tab, noopener)', () => {
    renderText('See our ${vpns_article} for more.');
    const link = screen.getByRole('link', { name: 'VPNs' });
    expect(link).toHaveAttribute('href', 'https://kb.example.com/vpns');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('resolves a markdown link whose target is a token', () => {
    renderText('[Invite](${invite_article}) your friends.');
    const link = screen.getByRole('link', { name: 'Invite' });
    expect(link).toHaveAttribute('href', '/wiki/invite');
  });

  it('keeps a markdown link with a literal URL target', () => {
    renderText('[the repo](https://github.com/orphic-inc/stellar-api).');
    const link = screen.getByRole('link', { name: 'the repo' });
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/orphic-inc/stellar-api'
    );
  });

  it('renders bold and italic spans', () => {
    const { container } = renderText(
      'Invites may be _offered_, not **taken**.'
    );
    expect(container.querySelector('em')).toHaveTextContent('offered');
    expect(container.querySelector('strong')).toHaveTextContent('taken');
  });

  it('surfaces an unresolved token literally rather than dropping it', () => {
    const { container } = renderText('see ${mystery_token} here');
    expect(container.textContent).toBe('see ${mystery_token} here');
  });
});
