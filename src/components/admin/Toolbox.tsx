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
          },
          {
            label: 'Staff page group manager',
            to: '/private/staff/tools/staff-groups'
          },
          {
            label: 'Torrent client whitelist',
            to: '/private/staff/tools/client-whitelist'
          },
          {
            label: 'Database encryption key',
            to: '/private/staff/tools/encryption-key'
          },
          {
            label: 'Auto-Enable requests',
            to: '/private/staff/tools/auto-enable'
          },
          { label: 'Login watch', to: '/private/staff/tools/login-watch' }
        ]}
      />

      <Section
        title="Announcements"
        links={[
          { label: 'News post', to: '/private/staff/tools/news' },
          {
            label: 'Global notification',
            to: '/private/staff/tools/notification'
          },
          { label: 'Mass PM', to: '/private/staff/tools/mass-pm' },
          { label: 'Change log', to: '/private/staff/tools/changelog' },
          { label: 'Calendar', to: '/private/staff/tools/calendar' },
          { label: 'Vanity House', to: '/private/staff/tools/vanity-house' },
          { label: 'Album of the Month', to: '/private/staff/tools/aotm' }
        ]}
      />

      <Section
        title="Community"
        links={[
          { label: 'Category manager', to: '/private/staff/tools/categories' },
          { label: 'Forum manager', to: '/private/staff/tools/forums' },
          {
            label: 'Forum transition manager',
            to: '/private/staff/tools/forum-transition'
          },
          { label: 'IRC manager', to: '/private/staff/tools/irc' }
        ]}
      />

      <Section
        title="Stylesheets"
        links={[
          {
            label: 'Render stylesheet gallery',
            to: '/private/staff/tools/stylesheets'
          }
        ]}
      />

      <Section
        title="User Management"
        links={[
          { label: 'Create user', to: '/private/staff/tools/user/new' },
          { label: 'Special users', to: '/private/staff/tools/special-users' },
          { label: 'User flow', to: '/private/staff/tools/user-flow' },
          {
            label: 'Registration log',
            to: '/private/staff/tools/registration-log'
          },
          { label: 'Invite pool', to: '/private/staff/tools/invite-pool' },
          {
            label: 'Manage invite tree',
            to: '/private/staff/tools/invite-tree'
          }
        ]}
      />

      <Section
        title="Rewards"
        links={[
          {
            label: 'Manage bonus points',
            to: '/private/staff/tools/bonus-points'
          },
          { label: 'Multiple freeleech', to: '/private/staff/tools/freeleech' },
          {
            label: 'Manage freeleech tokens',
            to: '/private/staff/tools/freeleech-tokens'
          }
        ]}
      />

      <Section
        title="Protection"
        links={[
          { label: 'IP address bans', to: '/private/staff/tools/ip-bans' },
          {
            label: 'Duplicate IP addresses',
            to: '/private/staff/tools/duplicate-ips'
          },
          {
            label: 'Email blacklist',
            to: '/private/staff/tools/email-blacklist'
          }
        ]}
      />

      <Section
        title="Torrents"
        links={[
          {
            label: 'Recommended torrents',
            to: '/private/staff/tools/recommended'
          },
          {
            label: 'Collage recovery',
            to: '/private/staff/tools/collage-recovery'
          },
          { label: '"Do Not Upload" list', to: '/private/staff/tools/dnu' },
          { label: 'Label aliases', to: '/private/staff/tools/label-aliases' }
        ]}
      />

      <Section
        title="Tags"
        links={[
          { label: 'Tag aliases', to: '/private/staff/tools/tag-aliases' },
          { label: 'Batch tag editor', to: '/private/staff/tools/batch-tags' }
        ]}
      />

      <Section
        title="Site Information"
        links={[
          {
            label: 'Economic stats',
            to: '/private/staff/tools/economic-stats'
          },
          { label: 'Torrent stats', to: '/private/staff/tools/torrent-stats' },
          { label: 'Ratio watch', to: '/private/staff/tools/ratio-watch' },
          {
            label: 'OS and browser usage',
            to: '/private/staff/tools/browser-stats'
          }
        ]}
      />

      <Section
        title="Finances"
        links={[
          {
            label: 'Bitcoin (balance)',
            to: '/private/staff/tools/bitcoin-balance'
          },
          {
            label: 'Bitcoin (unprocessed)',
            to: '/private/staff/tools/bitcoin-unprocessed'
          },
          { label: 'Donation log', to: '/private/staff/tools/donation-log' },
          { label: 'Donor rewards', to: '/private/staff/tools/donor-rewards' }
        ]}
      />

      <Section
        title="Developer Sandbox"
        links={[
          {
            label: 'Artist Importance',
            to: '/private/staff/tools/artist-importance'
          },
          { label: 'BBCode sandbox', to: '/private/staff/tools/bbcode-sandbox' }
        ]}
      />

      <Section
        title="Development"
        links={[
          {
            label: 'Cache key management',
            to: '/private/staff/tools/cache-keys'
          },
          { label: 'PHP processes', to: '/private/staff/tools/php-processes' },
          { label: 'Service stats', to: '/private/staff/tools/service-stats' },
          { label: 'Site info', to: '/private/staff/tools/site-info' },
          { label: 'Site options', to: '/private/staff/tools/site-options' },
          { label: 'Schedule', to: '/private/staff/tools/schedule' },
          { label: 'Tracker info', to: '/private/staff/tools/tracker-info' },
          { label: 'Update GeoIP', to: '/private/staff/tools/update-geoip' },
          {
            label: 'Update drive offsets',
            to: '/private/staff/tools/drive-offsets'
          }
        ]}
      />
    </div>
  </div>
);

export default Toolbox;
