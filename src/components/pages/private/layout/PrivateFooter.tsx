import { useGetVersionQuery } from '../../../../store/services/siteApi';

const PrivateFooter = () => {
  // Prefer the running platform version; fall back to the build-time UI
  // version while the request is in flight or if /api/version is unreachable.
  const { data } = useGetVersionQuery();
  const version = data?.version ?? __APP_VERSION__;

  return (
    <footer className="bg-[var(--st-backdrop)] border-t border-[var(--st-border-subtle)] mt-12">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col items-center gap-1 text-xs text-[var(--st-text-faint)]">
        <div className="flex items-center gap-2">
          <a
            href="/LICENSE"
            className="hover:text-[var(--st-text)] transition-colors"
          >
            LICENSE
          </a>
          <span>|</span>
          <a
            href="/CHANGELOG.md"
            className="hover:text-[var(--st-text)] transition-colors"
          >
            CHANGELOG
          </a>
        </div>
        <span title="&lt;3">Powered by Stellar v{version}</span>
      </div>
    </footer>
  );
};

export default PrivateFooter;
