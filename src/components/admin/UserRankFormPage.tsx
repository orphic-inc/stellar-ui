import { useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import {
  useGetUserRankByIdQuery,
  useCreateUserRankMutation,
  useUpdateUserRankMutation,
  useGetStaffGroupsQuery,
  useGetPermissionCatalogQuery
} from '../../store/services/userApi';
import { useGetForumCategoriesQuery } from '../../store/services/forumApi';
import { addAlert } from '../../store/slices/alertSlice';
import Spinner from '../layout/Spinner';
import PromotionCriteriaSection from './PromotionCriteriaSection';

interface FormValues {
  level: number;
  name: string;
  permissions: Record<string, boolean>;
  secondary: boolean;
  permittedForumIds: number[];
  personalCollageLimit: number;
  displayStaff: boolean;
  staffGroupId: number | '';
}

type ForumCategory = {
  id: number;
  name: string;
  forums?: Array<{ id: number; name: string; minClassRead?: number | null }>;
};

const UserRankFormPage = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { data: existing, isLoading } = useGetUserRankByIdQuery(id!, {
    skip: !isEditing
  });
  const { data: staffGroups } = useGetStaffGroupsQuery();
  const { data: permissionCatalog } = useGetPermissionCatalogQuery();
  const { data: forumCategories } = useGetForumCategoriesQuery({ all: true });
  const [createUserRank] = useCreateUserRankMutation();
  const [updateUserRank] = useUpdateUserRankMutation();
  const dispatch = useDispatch();

  const { register, handleSubmit, reset, watch, setValue } =
    useForm<FormValues>({
      defaultValues: {
        level: 0,
        name: '',
        permissions: {},
        secondary: false,
        permittedForumIds: [],
        personalCollageLimit: 0,
        displayStaff: false,
        staffGroupId: ''
      }
    });

  const displayStaff = watch('displayStaff');
  const selectedForumIds = watch('permittedForumIds');

  useEffect(() => {
    if (existing) {
      reset({
        level: existing.level,
        name: existing.name,
        permissions: existing.permissions ?? {},
        secondary: existing.secondary ?? false,
        permittedForumIds: existing.permittedForumIds ?? [],
        personalCollageLimit: existing.personalCollageLimit ?? 0,
        displayStaff: existing.displayStaff ?? false,
        staffGroupId: existing.staffGroupId ?? ''
      });
    }
  }, [existing, reset]);

  const togglePermittedForum = (forumId: number) => {
    const next = selectedForumIds.includes(forumId)
      ? selectedForumIds.filter((id) => id !== forumId)
      : [...selectedForumIds, forumId].sort((a, b) => a - b);
    setValue('permittedForumIds', next, { shouldDirty: true });
  };

  const onSubmit = async (data: FormValues) => {
    const payload = {
      ...data,
      staffGroupId: data.staffGroupId !== '' ? Number(data.staffGroupId) : null
    };
    try {
      if (isEditing && id) {
        await updateUserRank({ id: parseInt(id), ...payload }).unwrap();
      } else {
        await createUserRank(payload).unwrap();
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
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
              <div>
                <label
                  htmlFor="perm-collage-limit"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Personal Collage Limit
                </label>
                <input
                  id="perm-collage-limit"
                  type="number"
                  min={0}
                  {...register('personalCollageLimit', { valueAsNumber: true })}
                  className="w-full rounded bg-gray-700 border border-gray-600 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">0 = unlimited</p>
              </div>
              <div className="rounded border border-gray-700 bg-gray-900/50 px-3 py-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('secondary')}
                    className="mt-0.5 rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-800"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm text-gray-200">
                      Secondary class
                    </span>
                    <span className="block text-xs text-gray-500">
                      Assignable as an additional class without replacing the
                      user&apos;s primary rank.
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="bg-gray-700/60 px-4 py-2 border-b border-gray-700">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
              Permitted Forums
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <p className="text-sm text-gray-400">
              Grant access to specific forums even when the effective class
              level would normally be too low.
            </p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(forumCategories as ForumCategory[] | undefined)?.map(
                (category) => (
                  <div
                    key={category.id}
                    className="rounded border border-gray-700 bg-gray-900/40 p-3"
                  >
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {category.name}
                    </h4>
                    <div className="space-y-2">
                      {category.forums?.length ? (
                        category.forums.map((forum) => (
                          <label
                            key={forum.id}
                            aria-label={forum.name}
                            className="flex items-start gap-3 cursor-pointer rounded border border-gray-800 px-3 py-2 hover:border-gray-700"
                          >
                            <input
                              type="checkbox"
                              checked={selectedForumIds.includes(forum.id)}
                              onChange={() => togglePermittedForum(forum.id)}
                              className="mt-0.5 rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-800"
                            />
                            <span className="min-w-0">
                              <span className="block text-sm text-gray-200">
                                {forum.name}
                              </span>
                              <span className="block text-xs text-gray-500">
                                Read level {forum.minClassRead ?? 0}
                              </span>
                            </span>
                          </label>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500">
                          No forums in this category.
                        </p>
                      )}
                    </div>
                  </div>
                )
              )}
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
          <div className="p-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {(permissionCatalog ?? []).map(({ title, permissions }) => (
              <div key={title}>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 pb-1 border-b border-gray-700">
                  {title}
                </h4>
                <div className="space-y-2">
                  {permissions.map(({ key, label, description }) => (
                    <label
                      key={key}
                      className="flex items-start gap-3 cursor-pointer group rounded border border-gray-700/70 px-3 py-2 hover:border-gray-600"
                    >
                      <input
                        type="checkbox"
                        {...register(`permissions.${key}`)}
                        className="mt-0.5 rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-800"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm text-gray-200 group-hover:text-white transition-colors">
                          {label}
                        </span>
                        <span className="block text-xs text-gray-500">
                          {description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Staff display */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="bg-gray-700/60 px-4 py-2 border-b border-gray-700">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
              Staff Display
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('displayStaff')}
                className="rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-800"
              />
              <span className="text-sm text-gray-300">Show on staff page</span>
            </label>
            <div>
              <label
                htmlFor="staff-group-id"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Staff Group
              </label>
              <select
                id="staff-group-id"
                {...register('staffGroupId')}
                disabled={!displayStaff}
                className="w-full rounded bg-gray-700 border border-gray-600 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-40"
              >
                <option value="">— None (ungrouped) —</option>
                {staffGroups?.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
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

      {/* Promotion criteria (#170) — only when editing an existing rank. A
          sibling of the rank form (its own <form> + save), never nested. */}
      {isEditing && id && (
        <PromotionCriteriaSection fromRankId={parseInt(id)} />
      )}
    </div>
  );
};

export default UserRankFormPage;
