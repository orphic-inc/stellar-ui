type MockSpec = {
  status?: number;
  body?: unknown;
};

export const ensureRequestPolyfill = () => {
  const g = globalThis as typeof globalThis & {
    Request?: typeof Request;
    Headers?: typeof Headers;
  };

  if (g.Request && g.Headers) return;

  class MockHeaders {
    private values: Record<string, string>;

    constructor(init: Record<string, string> = {}) {
      this.values = Object.fromEntries(
        Object.entries(init).map(([key, value]) => [key.toLowerCase(), value])
      );
    }

    get(name: string) {
      return this.values[name.toLowerCase()] ?? null;
    }

    has(name: string) {
      return name.toLowerCase() in this.values;
    }

    set(name: string, value: string) {
      this.values[name.toLowerCase()] = value;
    }

    append(name: string, value: string) {
      this.set(name, value);
    }

    delete(name: string) {
      delete this.values[name.toLowerCase()];
    }
  }

  class MockRequest {
    url: string;
    method: string;
    headers: MockHeaders;
    // A non-string body (a File for a raw upload) kept as given, so a test can
    // assert the very object was sent.
    bodyInit: unknown;
    private bodyText: string;

    constructor(
      input: string | { url: string; method?: string; headers?: MockHeaders },
      init: {
        method?: string;
        headers?: Record<string, string>;
        body?: unknown;
      } = {}
    ) {
      this.bodyInit = init.body;
      const text = typeof init.body === 'string' ? init.body : '';
      if (typeof input === 'string') {
        this.url = input;
        this.method = init.method ?? 'GET';
        this.headers = new MockHeaders(init.headers);
        this.bodyText = text;
      } else {
        this.url = input.url;
        this.method = input.method ?? init.method ?? 'GET';
        this.headers = input.headers ?? new MockHeaders(init.headers);
        this.bodyText = text;
      }
    }

    clone() {
      return new MockRequest(this.url, {
        method: this.method,
        headers: {},
        body: this.bodyText
      });
    }

    async text() {
      return this.bodyText;
    }
  }

  g.Headers = MockHeaders as never;
  g.Request = MockRequest as never;
};

export const makeResponse = ({ status = 200, body }: MockSpec) => {
  const payload = body === undefined ? '' : JSON.stringify(body);
  const headers = {
    get: (name: string) =>
      name.toLowerCase() === 'content-type' && body !== undefined
        ? 'application/json'
        : null
  };

  return {
    ok: status >= 200 && status < 300,
    status,
    headers,
    clone: () => makeResponse({ status, body }),
    text: async () => payload,
    json: async () => body
  };
};
