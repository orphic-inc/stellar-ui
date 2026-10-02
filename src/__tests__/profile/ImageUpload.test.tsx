import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { createTestStore, renderWithProviders } from '../testUtils';
import { setCredentials } from '../../store/slices/authSlice';
import ImageUpload, {
  previewSrc
} from '../../components/profile/settings/ImageUpload';

const mockUpload = jest.fn();

jest.mock('../../store/services/assetApi', () => ({
  ...jest.requireActual('../../store/services/assetApi'),
  useUploadAssetMutation: () => [mockUpload, { isLoading: false }]
}));

const URL_ = `/api/asset/${'a'.repeat(64)}`;

const NO_SAVED = { value: '', src: null };

interface Opts {
  value?: string;
  saved?: { value: string; src: string | null };
  lockedNote?: React.ReactNode;
}

const renderAs = (assetLimit: number | null, opts: Opts = {}) => {
  const onChange = jest.fn();
  const store = createTestStore();
  store.dispatch(
    setCredentials({
      id: 7,
      username: 'member',
      avatar: null,
      userRank: {
        level: 100,
        name: 'Member',
        color: '#fff',
        assetLimit,
        notificationFilterLimit: null
      }
    } as never)
  );
  renderWithProviders(
    <ImageUpload
      field="avatar"
      label="Avatar"
      value={opts.value ?? ''}
      onChange={onChange}
      saved={opts.saved ?? NO_SAVED}
      lockedNote={opts.lockedNote}
    />,
    { store }
  );
  return onChange;
};

const choose = (file: File) =>
  fireEvent.change(screen.getByLabelText('Avatar image file'), {
    target: { files: [file] }
  });

const png = () => new File(['x'], 'me.png', { type: 'image/png' });

const resolves = (value: unknown) =>
  mockUpload.mockReturnValue({ unwrap: () => Promise.resolve(value) });
const rejects = (err: unknown) =>
  mockUpload.mockReturnValue({ unwrap: () => Promise.reject(err) });

const button = (name: string) => screen.queryByRole('button', { name });

describe('previewSrc (#434)', () => {
  const saved = { value: 'https://example.com/a.png', src: URL_ };

  it('shows an upload as its own same-origin path', () => {
    expect(previewSrc(URL_, NO_SAVED)).toBe(URL_);
  });

  it('shows a saved remote address only through its resolved src', () => {
    expect(previewSrc(saved.value, saved)).toBe(URL_);
    expect(previewSrc(saved.value, { ...saved, src: null })).toBeNull();
  });

  it('never loads a remote address the api has not resolved', () => {
    expect(previewSrc('https://example.com/b.png', saved)).toBeNull();
    expect(previewSrc('', saved)).toBeNull();
  });
});

describe('ImageUpload (#275, #434)', () => {
  beforeEach(() => mockUpload.mockReset());

  it('has no address box, only [Browse] over a hidden file input', () => {
    renderAs(null);
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByRole('group', { name: 'Avatar' })).toBeInTheDocument();
    expect(button('Browse')).toHaveClass('brackets', 'btn-link');
    const input = screen.getByLabelText('Avatar image file');
    expect(input).not.toBeVisible();
    expect(input).toHaveAttribute(
      'accept',
      'image/png,image/jpeg,image/gif,image/webp'
    );
    const click = jest.spyOn(input, 'click');
    fireEvent.click(button('Browse')!);
    expect(click).toHaveBeenCalled();
  });

  // stellar-api#716: 0 is none, so the control says so rather than failing.
  it('offers no [Browse] when the rank has no uploads, but still [Remove]', () => {
    renderAs(0, { value: URL_ });
    expect(button('Browse')).toBeNull();
    expect(screen.queryByLabelText('Avatar image file')).toBeNull();
    expect(screen.getByText(/can.t upload images yet/i)).toBeInTheDocument();
    expect(button('Remove')).toBeInTheDocument();
  });

  it('offers [Browse] under a cap', () => {
    renderAs(3);
    expect(button('Browse')).toBeInTheDocument();
  });

  it('refuses another file type before sending', async () => {
    renderAs(null);
    choose(new File(['x'], 'a.svg', { type: 'image/svg+xml' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Choose a PNG, JPEG, GIF or WebP image.'
    );
    expect(screen.getByText('a.svg')).toBeInTheDocument();
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('uploads for its field, names the file and hands back the address', async () => {
    resolves({ url: URL_ });
    const onChange = renderAs(null);
    const file = png();
    choose(file);

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(URL_));
    expect(mockUpload).toHaveBeenCalledWith({ file, field: 'avatar' });
    expect(screen.getByText('me.png')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Uploaded. Save to use it.'
    );
  });

  it('previews the current image and [Remove] empties the field', async () => {
    resolves({ url: URL_ });
    const onChange = renderAs(null, { value: URL_ });
    expect(screen.getByRole('img', { name: 'Current avatar' })).toHaveAttribute(
      'src',
      URL_
    );
    choose(png());
    await screen.findByText('me.png');

    fireEvent.click(button('Remove')!);
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(screen.queryByText('me.png')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('offers no [Remove] for an empty field', () => {
    renderAs(null);
    expect(screen.getByText('No image.')).toBeInTheDocument();
    expect(button('Remove')).toBeNull();
  });

  it('describes a saved remote address the site has no copy of yet', () => {
    const saved = { value: 'https://example.com/a.png', src: null };
    renderAs(null, { value: saved.value, saved });
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText(/address on another site/i)).toBeInTheDocument();
    expect(button('Remove')).toBeInTheDocument();
  });

  it('shows a locked field without its controls', () => {
    renderAs(null, { value: URL_, lockedNote: <p>Locked.</p> });
    expect(screen.getByText('Locked.')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(button('Browse')).toBeNull();
    expect(button('Remove')).toBeNull();
  });

  it('says the image is too large on a 413', async () => {
    rejects({ status: 413, data: { msg: 'request entity too large' } });
    renderAs(null);
    choose(png());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This image is larger than the site allows.'
    );
  });

  it('says how to free a slot at the limit', async () => {
    rejects({ status: 400, data: { msg: 'Asset limit reached (1).' } });
    const onChange = renderAs(1);
    choose(png());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Asset limit reached (1). Clearing one of your image fields and saving frees a slot.'
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows any other refusal as the api words it', async () => {
    rejects({ status: 400, data: { msg: 'Only images may be uploaded.' } });
    renderAs(null);
    choose(png());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Only images may be uploaded.'
    );
  });
});
