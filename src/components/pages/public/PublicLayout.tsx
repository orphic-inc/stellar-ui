import { ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import kuroLogo from '../../../assets/logos/kuro-logo.png';
import kuroLogoHover from '../../../assets/logos/kuro-logo-hover.png';
import Alert from '../../layout/Alert';
import { useGetInstallStatusQuery } from '../../../store/services/installApi';

interface Props {
  children: ReactNode;
  pageTitle?: string;
}

const PublicLayout = ({ children }: Props) => {
  const { data: installStatus } = useGetInstallStatusQuery();
  const [hovered, setHovered] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link
            to="/"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <img
              src={hovered ? kuroLogoHover : kuroLogo}
              alt="Stellar"
              className="h-8 w-auto"
            />
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              to="/login"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Login
            </Link>
            {installStatus?.registrationStatus === 'open' && (
              <Link
                to="/register"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded transition-colors"
              >
                Register
              </Link>
            )}
          </nav>
        </div>
      </header>
      <Alert />
      <main className="flex-1 flex items-center justify-center p-6">
        {children}
      </main>
      <footer className="text-center text-xs text-gray-600 py-4 border-t border-gray-800">
        © {new Date().getFullYear()} Stellar
      </footer>
    </div>
  );
};

export default PublicLayout;
