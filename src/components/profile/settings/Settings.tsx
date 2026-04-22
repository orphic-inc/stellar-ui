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
import type { UserSettings } from '../../../types';

const Settings = () => {
  const { id } = useParams<{ id: string }>();
  const { data: settings, isLoading } = useGetUserSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] =
    useUpdateUserSettingsMutation();

  const dispatch = useDispatch();
  const { register, handleSubmit, reset } = useForm<UserSettings>();

  useEffect(() => {
    if (settings) reset(settings);
  }, [settings, reset]);

  const onSubmit = async (data: UserSettings) => {
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
                  <input type="text" size={50} {...register('styleUrl')} />
                </td>
              </tr>
              <tr>
                <td className="label">Use OpenDyslexic font</td>
                <td>
                  <input type="checkbox" {...register('useOpenDyslexic')} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="box">
          <div className="head colhead_dark">Forum</div>
          <table className="layout">
            <tbody>
              <tr>
                <td className="label">Posts per page</td>
                <td>
                  <input
                    type="number"
                    size={5}
                    min={1}
                    max={100}
                    {...register('postsPerPage', { valueAsNumber: true })}
                  />
                </td>
              </tr>
              <tr>
                <td className="label">Autoload community stats</td>
                <td>
                  <input
                    type="checkbox"
                    {...register('autoloadCommunityStats')}
                  />
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
