import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import PublicLayout from './pages/public/PublicLayout';
import Install from './pages/public/Install';
import Login from './auth/Login';
import Register from './auth/Register';
import Recovery from './auth/Recovery';
import PrivateLayout from './pages/private/layout/PrivateLayout';
import PrivateContent from './pages/private/layout/PrivateContent';
import HomeGate from './HomeGate';
import { useGetInstallStatusQuery } from '../store/services/installApi';

// Pre-#183 URLs kept the authed app under a /private prefix; strip it so old
// bookmarks and external links keep resolving.
const LegacyPrivateRedirect = () => {
  const { pathname, search, hash } = useLocation();
  const stripped = pathname.replace(/^\/private(?=\/|$)/, '') || '/';
  return <Navigate to={`${stripped}${search}${hash}`} replace />;
};

const App = () => {
  const {
    data: installStatus,
    isLoading,
    isError
  } = useGetInstallStatusQuery();

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-400">
        Loading…
      </div>
    );

  if (isError)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-red-400">
        Could not reach server. Please try again later.
      </div>
    );

  // Redirect everything to /install until setup is complete
  if (installStatus && !installStatus.installed) {
    return (
      <>
        <Routes>
          <Route
            path="/install"
            element={
              <PublicLayout>
                <Install />
              </PublicLayout>
            }
          />
          <Route path="*" element={<Navigate to="/install" replace />} />
        </Routes>
      </>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/install" element={<Navigate to="/" replace />} />
        <Route
          path="/login"
          element={
            <PublicLayout>
              <Login />
            </PublicLayout>
          }
        />
        <Route
          path="/register"
          element={
            <PublicLayout>
              <Register />
            </PublicLayout>
          }
        />
        <Route
          path="/recovery"
          element={
            <PublicLayout>
              <Recovery />
            </PublicLayout>
          }
        />

        <Route path="/private/*" element={<LegacyPrivateRedirect />} />
        <Route path="/" element={<HomeGate />} />
        <Route
          path="/*"
          element={
            <PrivateLayout>
              <PrivateContent />
            </PrivateLayout>
          }
        />
      </Routes>
    </>
  );
};

export default App;
