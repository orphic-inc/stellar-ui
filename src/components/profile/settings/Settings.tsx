import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import {
  useGetUserSettingsQuery,
  useUpdateUserSettingsMutation
} from '../../../store/services/userApi';
import { addAlert } from '../../../store/slices/alertSlice';
import Spinner from '../../layout/Spinner';
import type { paths } from '../../../types/api';

type UserSettingsForm = NonNullable<
  paths['/users/settings']['put']['requestBody']
>['content']['application/json'];
type UserSettingsResponse =
  paths['/users/settings']['get']['responses'][200]['content']['application/json'];

const toSettingsForm = (settings: UserSettingsResponse): UserSettingsForm => ({
  siteAppearance: settings.siteAppearance,
  externalStylesheet: settings.externalStylesheet ?? '',
  styledTooltips: settings.styledTooltips,
  paranoia: settings.paranoia
});

const Settings = () => {
  const { id } = useParams<{ id: string }>();
  const { data: settings, isLoading } = useGetUserSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] =
    useUpdateUserSettingsMutation();

  const dispatch = useDispatch();
  const { register, handleSubmit, reset } = useForm<UserSettingsForm>();

  useEffect(() => {
    if (settings) reset(toSettingsForm(settings));
  }, [settings, reset]);

  const onSubmit = async (data: UserSettingsForm) => {
    try {
      await updateSettings(data).unwrap();
      dispatch(addAlert('Settings saved.', 'success'));
    } catch {
      dispatch(addAlert('Failed to save settings.', 'danger'));
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="thin">
      <div className="header">
        <h2>
          <strong>Settings</strong>
        </h2>
      </div>
      <div className="linkbox">
        <Link to={`/private/user/${id}`} className="brackets">
          Profile
        </Link>
      </div>

      <form className="main_column" onSubmit={handleSubmit(onSubmit)}>
        <div className="box">
          <div className="head colhead_dark">Appearance</div>
          <table className="layout">
            <tbody>
              <tr>
                <td className="label">Avatar URL</td>
                <td>
                  <input type="text" size={50} {...register('avatar')} />
                </td>
              </tr>
              <tr>
                <td className="label">Custom stylesheet URL</td>
                <td>
                  <input
                    type="text"
                    size={50}
                    {...register('externalStylesheet')}
                  />
                </td>
              </tr>
              <tr>
                <td className="label">Styled tooltips</td>
                <td>
                  <input type="checkbox" {...register('styledTooltips')} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="box">
          <div className="head colhead_dark">Privacy</div>
          <table className="layout">
            <tbody>
              <tr>
                <td className="label">Paranoia level</td>
                <td>
                  <input
                    type="number"
                    size={5}
                    min={0}
                    max={3}
                    {...register('paranoia', { valueAsNumber: true })}
                  />
                  <span className="label">
                    {' '}
                    (0 = public, 3 = maximum privacy)
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="center">
          <input type="submit" value="Save settings" disabled={isSaving} />
        </div>
      </form>
    </div>
  );
};

export default Settings;
