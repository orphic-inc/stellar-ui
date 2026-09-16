import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import RatioPolicyBanner from '../../components/ratio/RatioPolicyBanner';
import type { RatioPolicyView } from '../../components/ratio/ratioPolicyCopy';

/**
 * Cause-split and edge behaviour for the site-wide banner (#345), where props
 * are cheap to vary.
 *
 * That it is MOUNTED, and that the session actually reaches it, is proved in
 * `layout/PrivateLayout.test.tsx` against the real component — not here. A
 * component spec alone is what let #334 sit broken for four months.
 */

const policy = (over: Partial<RatioPolicyView> = {}): RatioPolicyView => ({
  status: 'OK',
  watchExpiresAt: null,
  disabledCause: null,
  ...over
});

const render = (user: {
  canDownload?: boolean;
  ratioPolicy?: RatioPolicyView | null;
}) => renderWithProviders(<RatioPolicyBanner user={user} />);

describe('RatioPolicyBanner — the disabled arm names what to do about it', () => {
  it('says a ratio disable lifts itself, and links the rules', () => {
    render({
      canDownload: false,
      ratioPolicy: policy({
        status: 'DOWNLOAD_DISABLED',
        disabledCause: 'RATIO'
      })
    });

    expect(
      screen.getByText(/come back automatically once your ratio meets it/)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ratio rules' })).toHaveAttribute(
      'href',
      '/ratio'
    );
  });

  it('says a staff disable does not lift, and points at Staff PM', () => {
    render({
      canDownload: false,
      ratioPolicy: policy({
        status: 'DOWNLOAD_DISABLED',
        disabledCause: 'STAFF'
      })
    });

    expect(
      screen.getByText(/Downloads disabled by staff\./)
    ).toBeInTheDocument();
    expect(screen.getByText(/does not lift on its own/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Staff PM' })).toHaveAttribute(
      'href',
      '/inbox/staff/new'
    );
  });

  it.each([
    ['a null cause', policy({ status: 'DOWNLOAD_DISABLED' })],
    ['no policy row at all', null],
    ['a policy that still reads OK', policy({ status: 'OK' })]
  ])('stays neutral but still explains: %s', (_name, ratioPolicy) => {
    // The flag is the trigger, so every one of these is a member who cannot
    // download. None may be met with silence.
    render({ canDownload: false, ratioPolicy });

    const banner = screen.getByText(/Downloads disabled\./).closest('div')!;
    expect(banner).toHaveTextContent('Contact staff through Staff PM');
    expect(banner).not.toHaveTextContent('Your ratio fell short');
    expect(banner).not.toHaveTextContent('by staff');
  });
});

describe('RatioPolicyBanner — the watch arm', () => {
  const inTwoDays = new Date(Date.now() + 2 * 86400000 + 3600000).toISOString();

  it('names the deadline and the 10 GiB trigger', () => {
    render({
      canDownload: true,
      ratioPolicy: policy({ status: 'WATCH', watchExpiresAt: inTwoDays })
    });

    const banner = screen.getByText(/Ratio watch\./).closest('div')!;
    expect(banner).toHaveTextContent('Your watch ends in 2 days');
    expect(banner).toHaveTextContent('download 10 GiB or more before it is');
  });

  it('carries no numbers — the banner is an interrupt, not a report', () => {
    render({
      canDownload: true,
      ratioPolicy: policy({ status: 'WATCH', watchExpiresAt: inTwoDays })
    });

    const banner = screen.getByText(/Ratio watch\./).closest('div')!;
    expect(banner).not.toHaveTextContent('Your ratio is');
    expect(banner).not.toHaveTextContent('required ratio');
  });

  it('omits the deadline clause when the watch has no expiry', () => {
    // `untilTime` renders a missing date as "shortly", which would read as an
    // imminent deadline the api never set.
    render({
      canDownload: true,
      ratioPolicy: policy({ status: 'WATCH', watchExpiresAt: null })
    });

    expect(screen.queryByText(/Your watch ends/)).not.toBeInTheDocument();
    expect(screen.queryByText(/shortly/)).not.toBeInTheDocument();
    expect(
      screen.getByText(/download 10 GiB or more before it is/)
    ).toBeInTheDocument();
  });
});

describe('RatioPolicyBanner — silence', () => {
  it.each([
    ['a member in good standing', { canDownload: true, ratioPolicy: policy() }],
    ['a session carrying no policy', { canDownload: true, ratioPolicy: null }],
    ['a session predating the field', { canDownload: true }]
  ])('renders nothing for %s', (_name, user) => {
    const { container } = render(user);
    expect(container).toBeEmptyDOMElement();
  });

  it('does not render a watch for a member who can still download', () => {
    // Guards the arm order: the watch arm is reached only past the flag.
    const { container } = render({
      canDownload: true,
      ratioPolicy: policy({
        status: 'DOWNLOAD_DISABLED',
        disabledCause: 'RATIO'
      })
    });
    expect(container).toBeEmptyDOMElement();
  });
});
