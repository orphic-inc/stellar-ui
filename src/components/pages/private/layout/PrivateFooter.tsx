import { Link } from 'react-router-dom';

const PrivateFooter = () => (
  <footer className="bg-gray-950 border-t border-gray-800 mt-12">
    <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between text-xs text-gray-500 gap-2">
      <div className="flex gap-4">
        <Link to="/private/" className="hover:text-gray-300 transition-colors">
          Home
        </Link>
        <Link
          to="/private/forums"
          className="hover:text-gray-300 transition-colors"
        >
          Forums
        </Link>
        <Link
          to="/private/communities"
          className="hover:text-gray-300 transition-colors"
        >
          Communities
        </Link>
      </div>
      <span>© {new Date().getFullYear()} Stellar</span>
    </div>
  </footer>
);

export default PrivateFooter;
