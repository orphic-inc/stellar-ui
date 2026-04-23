import { useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import {
  useGetUserRankByIdQuery,
  useCreateUserRankMutation,
  useUpdateUserRankMutation
} from '../../store/services/userApi';
import { addAlert } from '../../store/slices/alertSlice';
import Spinner from '../layout/Spinner';

const PERM_GROUPS: { title: string; perms: string[] }[] = [
  {
    title: 'Forums',
    perms: ['forums_read', 'forums_post', 'forums_moderate', 'forums_manage']
  },
  {
    title: 'Communities',
    perms: ['communities_manage']
  },
  {
    title: 'Users',
    perms: ['users_edit', 'users_warn', 'users_disable', 'invites_manage']
  },
  {
    title: 'System',
    perms: ['news_manage', 'staff', 'admin']
  }
];

interface FormValues {
  level: number;
  name: string;
  permissions: Record<string, boolean>;
}

const formatPerm = (perm: string) => perm.replace(/_/g, ' ');

const UserRankFormPage = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { data: existing, isLoading } = useGetUserRankByIdQuery(id!, {
    skip: !isEditing
  });
  const [createUserRank] = useCreateUserRankMutation();
  const [updateUserRank] = useUpdateUserRankMutation();
  const dispatch = useDispatch();

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
        await updateUserRank({ id: parseInt(id), ...data }).unwrap();
      } else {
        await createUserRank(data).unwrap();
      }
      navigate('/private/staff/tools/user-ranks');
    } catch {
      dispatch(
        addAlert(
          `Failed to ${isEditing ? 'update' : 'create'} user rank.`,
          'danger'
        )
      );
    }
  };

  if (isEditing && isLoading) return <Spinner />;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <div className="flex gap-3 text-sm mb-2">
            <Link
              to="/private/staff/tools/user-ranks"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              ← User Ranks
            </Link>
            <span className="text-gray-600">·</span>
            <Link
              to="/private/staff/tools"
              className="text-gray-400 hover:text-gray-300 transition-colors"
            >
              Toolbox
            </Link>
          </div>
          <h2 className="text-2xl font-bold text-white">
            {isEditing ? 'Edit' : 'New'} User Rank
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic info */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="bg-gray-700/60 px-4 py-2 border-b border-gray-700">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
              Details
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="perm-name"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Name
                </label>
                <input
                  id="perm-name"
                  type="text"
                  {...register('name', { required: true })}
                  className="w-full rounded bg-gray-700 border border-gray-600 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="perm-level"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Level
                </label>
                <input
                  id="perm-level"
                  type="number"
                  {...register('level', {
                    required: true,
                    valueAsNumber: true
                  })}
                  className="w-full rounded bg-gray-700 border border-gray-600 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Permissions grid */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="bg-gray-700/60 px-4 py-2 border-b border-gray-700">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
              Rank Permissions
            </h3>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PERM_GROUPS.map(({ title, perms }) => (
              <div key={title}>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 pb-1 border-b border-gray-700">
                  {title}
                </h4>
                <div className="space-y-1.5">
                  {perms.map((perm) => (
                    <label
                      key={perm}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        {...register(`permissions.${perm}`)}
                        className="rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-800"
                      />
                      <span className="text-xs text-gray-400 group-hover:text-gray-200 transition-colors capitalize">
                        {formatPerm(perm)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            to="/private/staff/tools/user-ranks"
            className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded text-sm transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            {isEditing ? 'Save Changes' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserRankFormPage;
