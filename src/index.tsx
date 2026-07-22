import 'core-js/stable';

import * as Sentry from '@sentry/react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';

import 'katex/dist/katex.min.css'; // Styles the server-rendered `[tex]` KaTeX spans (#403/#207); version pinned to the API's katex in package.json so glyph metrics + class names stay in lockstep
import './index.scss';
import './global.css'; // WS0: theming contract — role tokens + data-st hooks (ADR-0005); unlayered, so hooks win over Tailwind utilities
import App from './components/App';
import SentryUserSync from './components/SentryUserSync';
import store from './store';
import { sentryBeforeSend } from './utils/sentry';

if (__SENTRY_DSN__) {
  Sentry.init({
    dsn: __SENTRY_DSN__,
    release: __APP_VERSION__,
    environment: __APP_ENV__,
    beforeSend: sentryBeforeSend
  });
}

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

const root = createRoot(container);

root.render(
  <Provider store={store}>
    <SentryUserSync />
    <Router>
      <App />
    </Router>
  </Provider>
);
