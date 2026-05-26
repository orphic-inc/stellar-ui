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
        permissions: ['rank_permissions_manage']
      },
      {
        label: 'Staff groups',
        to: '/private/staff/tools/staff-groups',
        permissions: ['staff_groups_manage']
      },
      {
        label: 'Site settings',
        to: '/private/staff/tools/settings',
        permissions: ['admin']
      },
      {
        label: 'Login Watch',
        to: '/private/staff/login-watch',
        permissions: ['login_watch_view']
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
        permissions: ['recovery_manage']
      },
      {
        label: 'Registration log',
        to: '/private/staff/registration-log',
        permissions: ['registration_log_view']
      },
      {
        label: 'Invite pool',
        to: '/private/staff/invite-pool',
        permissions: ['invites_manage']
      },
      {
        label: 'Invite tree',
        to: '/private/staff/invite-tree',
        permissions: ['invites_manage']
      },
      {
        label: 'User flow',
        to: '/private/staff/user-flow',
        permissions: ['admin']
      }
    ]
  },
  {
    title: 'Content',
    links: [
      {
        label: 'Rules manager',
        to: '/private/staff/tools/rules',
        permissions: ['rules_manage']
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
        label: 'Global notices',
        to: '/private/staff/global-notices',
        permissions: ['news_manage']
      },
      {
        label: 'Vanity House',
        to: '/private/staff/vanity-house',
        permissions: ['news_manage']
      },
      {
        label: 'Album of the Month',
        to: '/private/staff/album-of-month',
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
        permissions: ['site_history_manage']
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
      },
      {
        label: 'Tag aliases',
        to: '/private/staff/tag-aliases',
        permissions: ['tags_manage']
      }
    ]
  },
  {
    title: 'Managers',
    links: [
      {
        label: 'Ticket queue',
        to: '/private/staff/tickets',
        permissions: ['staff_inbox_manage']
      },
      {
        label: 'Canned responses',
        to: '/private/staff/inbox/responses',
        permissions: ['staff_inbox_manage']
      },
      {
        label: 'Reports queue',
        to: '/private/staff/reports',
        permissions: ['reports_manage']
      },
      {
        label: 'Duplicate IPs',
        to: '/private/staff/duplicate-ips',
        permissions: ['duplicate_ips_view']
      },
      {
        label: 'Do Not Contribute list',
        to: '/private/staff/dnc',
        permissions: ['dnc_manage']
      },
      {
        label: 'Collage recovery',
        to: '/private/staff/collage-recovery',
        permissions: ['collages_moderate']
      }
    ]
  },
  {
    title: 'Users',
    links: [
      {
        label: 'Ratio policy override',
        to: '/private/staff/tools/ratio-policy',
        permissions: ['ratio_policy_manage']
      },
      {
        label: 'User warnings',
        to: '/private/staff/user-warnings',
        permissions: ['users_warn']
      }
    ]
  },
  {
    title: 'Moderation',
    links: [
      {
        label: 'IP address bans',
        to: '/private/staff/ip-bans',
        permissions: ['ip_bans_manage']
      },
      {
        label: 'Email blacklist',
        to: '/private/staff/email-blacklist',
        permissions: ['email_blacklist_manage']
      }
    ]
  },
  {
    title: 'Finances',
    links: [
      {
        label: 'Donor ranks',
        to: '/private/staff/donor-ranks',
        permissions: ['donor_ranks_manage']
      },
      {
        label: 'Donation log',
        to: '/private/staff/donation-log',
        permissions: ['donation_log_view']
      }
    ]
  },
  {
    title: 'Site Information',
    links: [
      {
        label: 'Economic stats',
        to: '/private/staff/economic-stats',
        permissions: ['admin']
      },
      {
        label: 'Release stats',
        to: '/private/staff/release-stats',
        permissions: ['admin']
      },
      {
        label: 'Ratio watch',
        to: '/private/staff/ratio-watch',
        permissions: ['admin']
      },
      {
        label: 'OS & Browser usage',
        to: '/private/staff/client-stats',
        permissions: ['admin']
      }
    ]
  },
  {
    title: 'Development',
    links: [
      {
        label: 'Site info',
        to: '/private/staff/site-info',
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
