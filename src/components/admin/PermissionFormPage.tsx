import { useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  useGetPermissionByIdQuery,
  useCreatePermissionMutation,
  useUpdatePermissionMutation
} from '../../store/services/userApi';
import Spinner from '../layout/Spinner';

const ALL_PERMISSIONS = [
  'site_leech',
  'site_upload',
  'site_vote',
  'site_submit_requests',
  'site_advanced_search',
  'site_top10',
  'site_album_votes',
  'site_collages_create',
  'site_collages_manage',
  'site_make_bookmarks',
  'site_edit_wiki',
  'site_can_invite_always',
  'site_send_unlimited_invites',
  'site_moderate_forums',
  'site_admin_forums',
  'site_forums_double_post',
  'site_view_flow',
  'users_edit_usernames',
  'users_edit_ratio',
  'users_edit_profiles',
  'users_view_invites',
  'users_warn',
  'users_disable_users',
  'users_delete_users',
  'users_mod',
  'communities_edit',
  'communities_delete',
  'communities_freeleech',
  'admin_manage_news',
  'admin_manage_polls',
  'admin_manage_forums',
  'admin_reports',
  'admin_create_users',
  'admin_clear_cache',
  'admin_manage_permissions'
] as const;

interface FormValues {
  level: number;
  name: string;
  permissions: Record<string, boolean>;
}

const PermissionFormPage = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { data: existing, isLoading } = useGetPermissionByIdQuery(id!, {
    skip: !isEditing
  });
  const [createPermission] = useCreatePermissionMutation();
  const [updatePermission] = useUpdatePermissionMutation();

  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { level: 0, name: '', permissions: {} }
  });

  useEffect(() => {
    if (existing) {
      reset({
        level: existing.level,
        name: existing.name,
        permissions: existing.permissions ?? {}
      });
    }
  }, [existing, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEditing && id) {
        await updatePermission({ id: parseInt(id), ...data }).unwrap();
      } else {
        await createPermission(data).unwrap();
      }
      navigate('/private/staff/tools/permissions');
    } catch (err) {
      console.error(err);
    }
  };

  if (isEditing && isLoading) return <Spinner />;

  return (
    <div className="thin">
      <div className="linkbox">
        <Link to="/private/staff/tools/permissions" className="brackets">
          Back to Permissions Manager
        </Link>{' '}
        <Link to="/private/staff/tools" className="brackets">
          Back to Toolbox
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="box">
          <div className="head colhead_dark">
            {isEditing ? 'Edit' : 'New'} Permission Class
          </div>
          <table className="layout">
            <tbody>
              <tr>
                <td className="label">Level</td>
                <td>
                  <input
                    type="number"
                    {...register('level', {
                      required: true,
                      valueAsNumber: true
                    })}
                  />
                </td>
              </tr>
              <tr>
                <td className="label">Name</td>
                <td>
                  <input
                    type="text"
                    size={40}
                    {...register('name', { required: true })}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="box">
          <div className="head colhead_dark">Permissions</div>
          <table className="layout">
            <tbody>
              {ALL_PERMISSIONS.map((perm) => (
                <tr key={perm}>
                  <td className="label">{perm}</td>
                  <td>
                    <input
                      type="checkbox"
                      {...register(`permissions.${perm}`)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="center">
          <button type="submit">{isEditing ? 'Update' : 'Create'}</button>
        </div>
      </form>
    </div>
  );
};

export default PermissionFormPage;
