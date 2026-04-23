import { Link } from 'react-router-dom';

interface SectionLink {
  label: string;
  to: string;
}
interface SectionProps {
  title: string;
  links: SectionLink[];
}

const Section = ({ title, links }: SectionProps) => (
  <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
    <div className="bg-gray-700/60 px-3 py-2 border-b border-gray-700">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
        {title}
      </h3>
    </div>
    <ul className="divide-y divide-gray-700/40">
      {links.map(({ label, to }) => (
        <li key={label}>
          <Link
            to={to}
            className="block px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700/40 transition-colors"
          >
            {label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const Toolbox = () => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold text-white">Staff Toolbox</h2>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <Section
        title="Administration"
        links={[
          {
            label: 'Permissions manager',
            to: '/private/staff/tools/permissions'
          }
        ]}
      />

      <Section
        title="Announcements"
        links={[{ label: 'News post', to: '/private/staff/tools/news' }]}
      />

      <Section
        title="Community"
        links={[
          {
            label: 'Community manager',
            to: '/private/staff/tools/communities'
          },
          { label: 'Category manager', to: '/private/staff/tools/categories' },
          { label: 'Forum manager', to: '/private/staff/tools/forums' }
        ]}
      />

      <Section
        title="User Management"
        links={[{ label: 'Create user', to: '/private/staff/tools/user/new' }]}
      />
    </div>
  </div>
);

export default Toolbox;
