import 'core-js/stable';

import * as Sentry from '@sentry/react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';

import './index.scss';
import App from './components/App';
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
    <Router>
      <App />
    </Router>
  </Provider>
);
