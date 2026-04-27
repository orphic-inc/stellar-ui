import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch } from '../../store/hooks';
import { addAlert } from '../../store/slices/alertSlice';
import {
  useGetSiteSettingsQuery,
  useUpdateSiteSettingsMutation
} from '../../store/services/siteApi';
import Spinner from '../layout/Spinner';

const SiteSettingsPage = () => {
  const dispatch = useAppDispatch();
  const { data: settings, isLoading } = useGetSiteSettingsQuery();
  const [updateSettings, { isLoading: saving }] =
    useUpdateSiteSettingsMutation();

  const [registrationStatus, setRegistrationStatus] = useState<
    'open' | 'invite' | 'closed'
  >('open');
  const [maxUsers, setMaxUsers] = useState('7000');
  const [domainsText, setDomainsText] = useState('');

  useEffect(() => {
    if (!settings) return;
    setRegistrationStatus(settings.registrationStatus);
    setMaxUsers(String(settings.maxUsers));
    setDomainsText(settings.approvedDomains.join('\n'));
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const maxUsersNum = parseInt(maxUsers, 10);
    if (!maxUsersNum || maxUsersNum < 1) {
      dispatch(addAlert('Max users must be a positive number.', 'danger'));
      return;
    }
    const approvedDomains = domainsText
      .split('\n')
      .map((d) => d.trim())
      .filter(Boolean);
    try {
      await updateSettings({
        registrationStatus,
        maxUsers: maxUsersNum,
        approvedDomains
      }).unwrap();
      dispatch(addAlert('Settings saved.', 'success'));
    } catch {
      dispatch(addAlert('Failed to save settings.', 'danger'));
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="thin">
      <div className="mb-4">
        <Link
          to="/private/staff/tools"
          className="text-blue-400 text-sm hover:underline"
        >
          ← Toolbox
        </Link>
      </div>

      <h2 className="text-xl font-semibold mb-4">Site Settings</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="registration-status"
            className="block text-sm text-gray-400 mb-1"
          >
            Registration
          </label>
          <select
            id="registration-status"
            value={registrationStatus}
            onChange={(e) =>
              setRegistrationStatus(
                e.target.value as 'open' | 'invite' | 'closed'
              )
            }
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="open">Open — anyone can register</option>
            <option value="invite">Invite only — requires an invite key</option>
            <option value="closed">Closed — registration disabled</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="max-users"
            className="block text-sm text-gray-400 mb-1"
          >
            Maximum users
          </label>
          <input
            id="max-users"
            type="number"
            min={1}
            value={maxUsers}
            onChange={(e) => setMaxUsers(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Registration is blocked once this limit is reached. Default: 7000.
          </p>
        </div>

        <div>
          <label
            htmlFor="approved-domains"
            className="block text-sm text-gray-400 mb-1"
          >
            Approved download domains{' '}
            <span className="text-gray-600 text-xs">(optional)</span>
          </label>
          <textarea
            id="approved-domains"
            value={domainsText}
            onChange={(e) => setDomainsText(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm font-mono focus:outline-none focus:border-blue-500 resize-y"
            placeholder={'example.com\ncdn.example.org'}
          />
          <p className="text-xs text-gray-500 mt-1">
            One hostname per line. If empty, all domains are permitted.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </div>
  );
};

export default SiteSettingsPage;
