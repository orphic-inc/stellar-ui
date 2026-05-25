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
        label: 'Site settings',
        to: '/private/staff/tools/settings',
        permissions: ['admin']
      }
    ]
  },
  {
    title: 'User Management',
    links: [
      {
        label: 'Create user',
        to: '/private/staff/tools/user/new',
        permissions: ['users_edit']
      },
      {
        label: 'Recovery queue',
        to: '/private/staff/tools/recovery-queue',
        permissions: ['users_edit', 'admin']
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
      },
      {
        label: 'Mass PM',
        to: '/private/staff/mass-pm',
        permissions: ['staff', 'admin']
      },
      {
        label: 'Site History',
        to: '/private/staff/site-history',
        permissions: ['staff', 'admin']
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
    title: 'Managers',
    links: [
      {
        label: 'Ticket queue',
        to: '/private/staff/tickets',
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
  },
  {
    title: 'Users',
    links: [
      {
        label: 'Ratio policy override',
        to: '/private/staff/tools/ratio-policy',
        permissions: ['staff', 'admin']
      },
      {
        label: 'Duplicate IPs',
        to: '/private/staff/duplicate-ips',
        permissions: ['staff', 'admin']
      },
      {
        label: 'Registration log',
        to: '/private/staff/registration-log',
        permissions: ['staff', 'admin']
      }
    ]
  },
  {
    title: 'Moderation',
    links: [
      {
        label: 'IP address bans',
        to: '/private/staff/ip-bans',
        permissions: ['admin']
      },
      {
        label: 'Email blacklist',
        to: '/private/staff/email-blacklist',
        permissions: ['admin']
      }
    ]
  },
  {
    title: 'Finances',
    links: [
      {
        label: 'Donor ranks',
        to: '/private/staff/donor-ranks',
        permissions: ['admin']
      },
      {
        label: 'Donation log',
        to: '/private/staff/donation-log',
        permissions: ['admin']
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
