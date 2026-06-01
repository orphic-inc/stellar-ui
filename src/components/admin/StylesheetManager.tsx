import { useDispatch } from 'react-redux';
import {
  useGetStylesheetsQuery,
  useGetStylesheetStatsQuery,
  useUpdateStylesheetMutation
} from '../../store/services/siteApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import Spinner from '../layout/Spinner';

const StylesheetManager = () => {
  const dispatch = useDispatch();
  const { data: stylesheets, isLoading: listLoading } =
    useGetStylesheetsQuery();
  const { data: stats, isLoading: statsLoading } = useGetStylesheetStatsQuery();
  const [updateStylesheet, { isLoading: isSaving }] =
    useUpdateStylesheetMutation();

  const userCountById = Object.fromEntries(
    (stats ?? []).map((s) => [s.id, s.userCount])
  );

  const handleSetDefault = async (id: number, name: string) => {
    try {
      await updateStylesheet({ id, isDefault: true }).unwrap();
      dispatch(addAlert(`"${name}" is now the default stylesheet.`, 'success'));
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to update default.',
          'danger'
        )
      );
    }
  };

  if (listLoading || statsLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Stylesheets</h2>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-700/60 border-b border-gray-700">
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-300">
                Name
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-300">
                Description
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-300">
                CSS URL
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-300">
                Users
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-300">
                Status
              </th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/40">
            {stylesheets?.map((s) => (
              <tr key={s.id} className="hover:bg-gray-700/40 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-200">
                  {s.name}
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {s.description || '—'}
                </td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs break-all">
                  {s.cssUrl}
                </td>
                <td className="px-4 py-3 text-right text-gray-400">
                  {userCountById[s.id] ?? 0}
                </td>
                <td className="px-4 py-3 text-center">
                  {s.isDefault ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-900/30 text-indigo-300 border border-indigo-700">
                      Default
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-right">
                  {!s.isDefault && (
                    <button
                      onClick={() => handleSetDefault(s.id, s.name)}
                      disabled={isSaving}
                      className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-700 hover:border-indigo-600 px-2 py-1 rounded transition-colors disabled:opacity-50"
                    >
                      Set default
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!stylesheets?.length && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No stylesheets found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-600">
        User counts reflect stored stylesheet selections and may differ from
        active rendering when an external stylesheet URL is set.
      </p>
    </div>
  );
};

export default StylesheetManager;
