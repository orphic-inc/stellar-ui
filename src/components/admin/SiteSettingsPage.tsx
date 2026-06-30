import { useState, useEffect } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { addAlert } from '../../store/slices/alertSlice';
import {
  useGetSiteSettingsQuery,
  useUpdateSiteSettingsMutation
} from '../../store/services/siteApi';
import Spinner from '../layout/Spinner';
import { PageShell, Panel, Button, Field } from '../ui';

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
    <PageShell title="Site Settings" width="sm">
      <Panel as="form" onSubmit={handleSubmit} className="p-4 space-y-6">
        <div>
          <label
            htmlFor="registration-status"
            data-st="meta"
            className="block text-xs mb-1"
          >
            Registration
          </label>
          <select
            id="registration-status"
            data-st="field"
            value={registrationStatus}
            onChange={(e) =>
              setRegistrationStatus(
                e.target.value as 'open' | 'invite' | 'closed'
              )
            }
            className="w-full"
          >
            <option value="open">Open — anyone can register</option>
            <option value="invite">Invite only — requires an invite key</option>
            <option value="closed">Closed — registration disabled</option>
          </select>
        </div>

        <div>
          <Field
            id="max-users"
            label="Maximum users"
            type="number"
            min={1}
            value={maxUsers}
            onChange={(e) => setMaxUsers(e.target.value)}
          />
          <p data-st="meta" className="text-xs mt-1">
            Registration is blocked once this limit is reached. Default: 7000.
          </p>
        </div>

        <div>
          <label
            htmlFor="approved-domains"
            data-st="meta"
            className="block text-xs mb-1"
          >
            Approved contribution link domains{' '}
            <span className="text-[var(--st-text-faint)]">(optional)</span>
          </label>
          <textarea
            id="approved-domains"
            data-st="field"
            value={domainsText}
            onChange={(e) => setDomainsText(e.target.value)}
            rows={6}
            className="w-full font-mono resize-y"
            placeholder={'example.com\ncdn.example.org'}
          />
          <p data-st="meta" className="text-xs mt-1">
            One hostname per line. If empty, all domains are permitted.
          </p>
        </div>

        <Button variant="primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </Button>
      </Panel>
    </PageShell>
  );
};

export default SiteSettingsPage;
