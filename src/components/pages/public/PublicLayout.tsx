import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  pageTitle?: string;
}

const PublicLayout = ({ children, pageTitle }: Props) => (
  <div className="public-layout">
    <header className="public-header">
      <div className="public-header-inner">
        <Link to="/" className="site-logo">
          {pageTitle ?? 'Stellar'}
        </Link>
        <nav>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </nav>
      </div>
    </header>
    <main className="public-main">{children}</main>
    <footer className="public-footer">
      <p>© {new Date().getFullYear()} Stellar</p>
    </footer>
  </div>
);

export default PublicLayout;
