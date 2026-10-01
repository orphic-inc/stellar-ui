import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { createTestStore, renderWithProviders } from '../testUtils';
import { setCredentials } from '../../store/slices/authSlice';
import ImageUpload from '../../components/profile/settings/ImageUpload';

const mockUpload = jest.fn();

jest.mock('../../store/services/assetApi', () => ({
  ...jest.requireActual('../../store/services/assetApi'),
  useUploadAssetMutation: () => [mockUpload, { isLoading: false }]
}));

const URL_ = `/api/asset/${'a'.repeat(64)}`;

const renderAs = (assetLimit: number | null, onUploaded = jest.fn()) => {
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
  renderWithProviders(<ImageUpload field="avatar" onUploaded={onUploaded} />, {
    store
  });
  return onUploaded;
};

const choose = (file: File) =>
  fireEvent.change(screen.getByLabelText(/upload an image/i), {
    target: { files: [file] }
  });

const png = () => new File(['x'], 'me.png', { type: 'image/png' });

const resolves = (value: unknown) =>
  mockUpload.mockReturnValue({ unwrap: () => Promise.resolve(value) });
const rejects = (err: unknown) =>
  mockUpload.mockReturnValue({ unwrap: () => Promise.reject(err) });

describe('ImageUpload (#275)', () => {
  beforeEach(() => mockUpload.mockReset());

  // stellar-api#716: 0 is none, so the control says so rather than failing.
  it('explains instead of offering a picker when the rank has no uploads', () => {
    renderAs(0);
    expect(screen.queryByLabelText(/upload an image/i)).toBeNull();
    expect(screen.getByText(/can.t upload images yet/i)).toBeInTheDocument();
  });

  it.each([
    ['unlimited', null],
    ['a cap', 3]
  ])('offers the picker for %s', (_label, limit) => {
    renderAs(limit);
    expect(screen.getByLabelText(/upload an image/i)).toHaveAttribute(
      'accept',
      'image/png,image/jpeg,image/gif,image/webp'
    );
  });

  it('refuses another file type before sending', async () => {
    renderAs(null);
    choose(new File(['x'], 'a.svg', { type: 'image/svg+xml' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Choose a PNG, JPEG, GIF or WebP image.'
    );
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('uploads for its field and hands back the address', async () => {
    resolves({ url: URL_ });
    const onUploaded = renderAs(null);
    const file = png();
    choose(file);

    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith(URL_));
    expect(mockUpload).toHaveBeenCalledWith({ file, field: 'avatar' });
    expect(screen.getByRole('status')).toHaveTextContent(
      'Uploaded. Save to use it.'
    );
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
    const onUploaded = renderAs(1);
    choose(png());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Asset limit reached (1). Clearing one of your image fields and saving frees a slot.'
    );
    expect(onUploaded).not.toHaveBeenCalled();
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
