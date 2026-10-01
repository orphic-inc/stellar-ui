import { createTestStore } from '../testUtils';
import { ensureRequestPolyfill, makeResponse } from '../fetchTestUtils';
import { assetApi } from '../../store/services/assetApi';

const fetchMock = jest.fn();

beforeAll(() => {
  ensureRequestPolyfill();
  Object.defineProperty(globalThis, 'fetch', {
    value: fetchMock,
    writable: true
  });
});

beforeEach(() => {
  fetchMock.mockReset();
});

// `POST /asset` reads a raw body (express.raw), not multipart or JSON, and
// identifies the image by its bytes against the declared Content-Type.
describe('assetApi.uploadAsset (#275)', () => {
  it('sends the raw file, not JSON or multipart, for its image field', async () => {
    fetchMock.mockResolvedValue(
      makeResponse({ status: 201, body: { hash: 'a', url: '/api/asset/a' } })
    );
    const store = createTestStore();
    const file = new File(['PNGBYTES'], 'me.png', { type: 'image/png' });

    await store.dispatch(
      assetApi.endpoints.uploadAsset.initiate({ file, field: 'secondAvatar' })
    );

    const request = fetchMock.mock.calls.at(-1)?.[0] as Request & {
      bodyInit: unknown;
    };
    expect(request.method).toBe('POST');
    expect(request.url).toBe('/api/asset?kind=Avatar&field=secondAvatar');
    // The File itself: the browser derives the Content-Type from its type.
    expect(request.bodyInit).toBe(file);
  });
});
