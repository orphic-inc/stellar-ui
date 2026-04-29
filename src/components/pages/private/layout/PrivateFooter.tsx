const PrivateFooter = () => (
  <footer className="bg-gray-950 border-t border-gray-800 mt-12">
    <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col items-center gap-1 text-xs text-gray-500">
      <div className="flex items-center gap-2">
        <a href="/LICENSE" className="hover:text-gray-300 transition-colors">
          LICENSE
        </a>
        <span>|</span>
        <a
          href="/CHANGELOG.md"
          className="hover:text-gray-300 transition-colors"
        >
          CHANGELOG
        </a>
      </div>
      <span>Powered by Stellar v0.5</span>
    </div>
  </footer>
);

export default PrivateFooter;
