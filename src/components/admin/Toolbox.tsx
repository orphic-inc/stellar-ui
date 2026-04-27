import { Link } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  hasAnyPermission,
  hasPermission,
  type Permission
} from '../../utils/permissions';

interface SectionLink {
  label: string;
  to: string;
  permissions: Permission[];
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

const sections: SectionProps[] = [
  {
    title: 'Administration',
    links: [
      {
        label: 'User ranks',
        to: '/private/staff/tools/user-ranks',
        permissions: ['admin']
      },
      {
        label: 'Create user',
        to: '/private/staff/tools/user/new',
        permissions: ['users_edit']
      },
      {
        label: 'Site settings',
        to: '/private/staff/tools/settings',
        permissions: ['admin']
      }
    ]
  },
  {
    title: 'Announcements',
    links: [
      {
        label: 'News post',
        to: '/private/staff/tools/news',
        permissions: ['news_manage']
      }
    ]
  },
  {
    title: 'Community',
    links: [
      {
        label: 'Community manager',
        to: '/private/staff/tools/communities',
        permissions: ['communities_manage']
      },
      {
        label: 'Category manager',
        to: '/private/staff/tools/categories',
        permissions: ['forums_manage']
      },
      {
        label: 'Forum manager',
        to: '/private/staff/tools/forums',
        permissions: ['forums_manage']
      }
    ]
  },
  {
    title: 'Users',
    links: [
      {
        label: 'Ratio policy override',
        to: '/private/staff/tools/ratio-policy',
        permissions: ['staff', 'admin']
      }
    ]
  },
  {
    title: 'Support',
    links: [
      {
        label: 'Staff inbox',
        to: '/private/staff/inbox',
        permissions: ['staff', 'admin']
      },
      {
        label: 'Canned responses',
        to: '/private/staff/inbox/responses',
        permissions: ['staff', 'admin']
      },
      {
        label: 'Reports queue',
        to: '/private/staff/reports',
        permissions: ['staff', 'admin']
      }
    ]
  }
];

const Toolbox = () => {
  const user = useAppSelector(selectCurrentUser);
  const visibleSections = sections
    .map((section) => ({
      ...section,
      links: section.links.filter((link) =>
        hasAnyPermission(user, link.permissions)
      )
    }))
    .filter((section) => section.links.length > 0);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Staff Toolbox</h2>

      {!hasPermission(user, 'admin') && visibleSections.length === 0 ? (
        <div className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-5 text-sm text-gray-400">
          Your account does not currently have any staff tools assigned.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleSections.map((section) => (
            <Section key={section.title} {...section} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Toolbox;
