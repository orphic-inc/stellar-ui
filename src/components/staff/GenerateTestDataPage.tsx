import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  useGetDevStatusQuery,
  useListSeedRunsQuery,
  useEstimateGenerateMutation,
  useGenerateDataMutation,
  useCleanupRunMutation,
  useCleanupAllRunsMutation,
  type GenerateConfig,
  type GenerationMode,
  type SectionKey,
  type PresetKey,
  type SeedRunSummary
} from '../../store/services/devToolsApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import Spinner from '../layout/Spinner';
import Time from '../layout/Time';

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_SECTIONS: {
  key: SectionKey;
  label: string;
  integratedOnly?: boolean;
}[] = [
  { key: 'users', label: 'Users' },
  { key: 'communities', label: 'Communities' },
  { key: 'releases', label: 'Releases' },
  { key: 'contributions', label: 'Contributions' },
  { key: 'collages', label: 'Collages' },
  { key: 'requests', label: 'Requests' },
  { key: 'forum', label: 'Forum', integratedOnly: true },
  { key: 'wiki', label: 'Wiki' },
  { key: 'reports', label: 'Reports' },
  { key: 'staffInbox', label: 'Staff Inbox' },
  { key: 'messages', label: 'Messages' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'stats', label: 'Stats' },
  { key: 'moderation', label: 'Moderation' },
  { key: 'donations', label: 'Donations' },
  { key: 'invites', label: 'Invites' }
];

const PRESETS: { key: PresetKey; label: string; description: string }[] = [
  { key: 'minimal', label: 'Minimal', description: '~5 users, 10 releases' },
  {
    key: 'balanced',
    label: 'Balanced',
    description: '~50 users, 100 releases'
  },
  { key: 'large', label: 'Large', description: '~200 users, 500 releases' },
  {
    key: 'edge_case',
    label: 'Edge cases',
    description: '~20 users, boundary conditions'
  }
];

const DEFAULT_SECTIONS: SectionKey[] = ALL_SECTIONS.filter(
  (s) => !s.integratedOnly
).map((s) => s.key);

// ─── Sub-components ──────────────────────────────────────────────────────────

const inputClass =
  'rounded bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full';

const labelClass = 'block text-xs font-medium text-gray-400 mb-1';

interface ConfirmModalProps {
  mode: GenerationMode;
  config: GenerateConfig;
  estimatedCounts: Record<string, number> | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

const ConfirmModal = ({
  mode,
  config,
  estimatedCounts,
  onConfirm,
  onCancel,
  isLoading
}: ConfirmModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
    <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-xl w-full max-w-md mx-4">
      <div className="p-5 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">
          Confirm test data generation
        </h3>
      </div>
      <div className="p-5 space-y-4">
        {mode === 'integrated' && (
          <div className="flex gap-2 p-3 bg-amber-900/40 border border-amber-700/60 rounded text-sm text-amber-300">
            <span className="shrink-0">⚠</span>
            <span>
              Integrated mode attaches generated content to existing forums and
              tags. Some side effects (notifications, job-triggered state
              changes) may <strong>not be fully reversible</strong> on cleanup.
            </span>
          </div>
        )}
        {mode === 'isolated' && (
          <div className="flex gap-2 p-3 bg-blue-900/30 border border-blue-700/50 rounded text-sm text-blue-300">
            <span className="shrink-0">ℹ</span>
            <span>
              Isolated mode only creates seed-owned rows using the{' '}
              <code className="font-mono text-blue-200 text-xs">
                @seed.invalid
              </code>{' '}
              domain. Cleanup is fully reversible.
            </span>
          </div>
        )}

        {estimatedCounts && Object.keys(estimatedCounts).length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Estimated counts
            </p>
            <div className="bg-gray-900 rounded border border-gray-700 divide-y divide-gray-700/60 max-h-48 overflow-y-auto">
              {Object.entries(estimatedCounts)
                .filter(([, v]) => v > 0)
                .map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between px-3 py-1.5 text-sm"
                  >
                    <span className="text-gray-300">{k}</span>
                    <span className="text-gray-400 font-mono">
                      {v.toLocaleString()}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          Label:{' '}
          <span className="text-gray-300">{config.label || '(none)'}</span> ·
          Seed: <span className="text-gray-300">{config.seed ?? 42}</span> ·
          Scale: <span className="text-gray-300">{config.scale ?? 1}×</span>
        </div>
      </div>
      <div className="p-5 border-t border-gray-700 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className="px-4 py-2 text-sm bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white rounded font-medium transition-colors"
        >
          {isLoading ? 'Generating…' : 'Generate test data'}
        </button>
      </div>
    </div>
  </div>
);

interface CleanupConfirmModalProps {
  label: string;
  isAll?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

const CleanupConfirmModal = ({
  label,
  isAll,
  onConfirm,
  onCancel,
  isLoading
}: CleanupConfirmModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
    <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-xl w-full max-w-sm mx-4">
      <div className="p-5">
        <h3 className="text-lg font-semibold text-white mb-2">
          {isAll ? 'Clean up all runs?' : 'Clean up this run?'}
        </h3>
        <p className="text-sm text-gray-400">
          {isAll ? (
            'All generated seed records will be deleted. This cannot be undone.'
          ) : (
            <>
              All records generated by{' '}
              <strong className="text-gray-200">{label}</strong> will be
              deleted.
            </>
          )}
        </p>
      </div>
      <div className="p-5 border-t border-gray-700 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className="px-4 py-2 text-sm bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white rounded font-medium transition-colors"
        >
          {isLoading ? 'Cleaning up…' : 'Clean up'}
        </button>
      </div>
    </div>
  </div>
);

// ─── Run row ─────────────────────────────────────────────────────────────────

interface RunRowProps {
  run: SeedRunSummary;
  onCleanup: (id: string, label: string) => void;
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    active: 'bg-blue-900/50 text-blue-300 border-blue-700/50',
    cleaning: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/50',
    cleaned: 'bg-gray-700/50 text-gray-400 border-gray-600/50',
    partial: 'bg-orange-900/50 text-orange-300 border-orange-700/50',
    failed: 'bg-red-900/50 text-red-300 border-red-700/50'
  };
  return map[status] ?? 'bg-gray-700/50 text-gray-400 border-gray-600/50';
};

const reversibilityBadge = (level: string) =>
  level === 'full'
    ? 'bg-green-900/40 text-green-300 border-green-700/40'
    : 'bg-amber-900/40 text-amber-300 border-amber-700/40';

const RunRow = ({ run, onCleanup }: RunRowProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className="hover:bg-gray-700/20 transition-colors">
        <td className="px-4 py-2.5 text-gray-200 text-sm">
          {run.label ?? <span className="text-gray-600 italic">—</span>}
        </td>
        <td className="px-4 py-2.5">
          <span className="text-xs font-mono text-gray-400">{run.mode}</span>
        </td>
        <td className="px-4 py-2.5 text-gray-400 text-xs">
          <Time date={run.createdAt} />
        </td>
        <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">
          {run._count.records.toLocaleString()}
        </td>
        <td className="px-4 py-2.5">
          <span
            className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${reversibilityBadge(
              run.reversibilityLevel
            )}`}
          >
            {run.reversibilityLevel}
          </span>
        </td>
        <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">
          {run.warnings?.length ?? 0}
        </td>
        <td className="px-4 py-2.5">
          <span
            className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${statusBadge(
              run.cleanupStatus
            )}`}
          >
            {run.cleanupStatus}
          </span>
        </td>
        <td className="px-4 py-2.5 text-right space-x-3">
          {(run.warnings?.length ?? 0) > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              {expanded ? 'Hide' : 'Expand'}
            </button>
          )}
          {run.cleanupStatus === 'active' && (
            <button
              type="button"
              onClick={() => onCleanup(run.id, run.label ?? run.id.slice(0, 8))}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Clean up
            </button>
          )}
        </td>
      </tr>
      {expanded && (run.warnings?.length ?? 0) > 0 && (
        <tr>
          <td colSpan={8} className="px-4 pb-3">
            <div className="bg-gray-900 rounded border border-gray-700 p-3 space-y-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Warnings
              </p>
              {run.warnings!.map((w, i) => (
                <p key={i} className="text-xs text-amber-300 font-mono">
                  {w}
                </p>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const GenerateTestDataPage = () => {
  const dispatch = useDispatch();

  // Queries
  const { data: status, isLoading: statusLoading } = useGetDevStatusQuery();
  const {
    data: runs,
    isLoading: runsLoading,
    refetch: refetchRuns
  } = useListSeedRunsQuery();

  // Mutations
  const [estimateGenerate, { isLoading: estimating }] =
    useEstimateGenerateMutation();
  const [generateData, { isLoading: generating }] = useGenerateDataMutation();
  const [cleanupRun, { isLoading: cleaningRun }] = useCleanupRunMutation();
  const [cleanupAllRuns, { isLoading: cleaningAll }] =
    useCleanupAllRunsMutation();

  // Form state
  const [mode, setMode] = useState<GenerationMode>('isolated');
  const [preset, setPreset] = useState<PresetKey | null>(null);
  const [sections, setSections] = useState<SectionKey[]>(DEFAULT_SECTIONS);
  const [seed, setSeed] = useState('42');
  const [scale, setScale] = useState(1);
  const [label, setLabel] = useState('');
  const [includeEdgeCases, setIncludeEdgeCases] = useState(false);
  const [includeModerationData, setIncludeModerationData] = useState(true);
  const [includeStatsData, setIncludeStatsData] = useState(false);

  // UI state
  const [estimatedCounts, setEstimatedCounts] = useState<Record<
    string,
    number
  > | null>(null);
  const [lastResult, setLastResult] = useState<{
    summary: Record<string, number>;
    warnings: string[];
    validation: {
      passed: boolean;
      checks: Array<{ name: string; passed: boolean; message?: string }>;
    };
  } | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [cleanupTarget, setCleanupTarget] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [showCleanupAllModal, setShowCleanupAllModal] = useState(false);

  // Ref to scroll the runs table into view after a run completes
  const runsRef = useRef<HTMLDivElement>(null);

  // Keep forum deselected in isolated mode
  const visibleSections = ALL_SECTIONS.filter(
    (s) => mode === 'integrated' || !s.integratedOnly
  );

  const buildConfig = (): GenerateConfig => ({
    seed: parseInt(seed, 10) || 42,
    scale,
    preset: preset ?? undefined,
    sections,
    mode,
    includeEdgeCases,
    includeModerationData,
    includeStatsData,
    label: label.trim() || undefined
  });

  const handlePreset = (key: PresetKey) => {
    setPreset(key);
    // Select all non-integrated sections by default for presets
    setSections(DEFAULT_SECTIONS);
  };

  const handleModeChange = (m: GenerationMode) => {
    setMode(m);
    // Remove forum from sections if switching to isolated
    if (m === 'isolated') {
      setSections((prev) => prev.filter((s) => s !== 'forum'));
    }
  };

  const handleSectionToggle = (key: SectionKey) => {
    setSections((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  const handleEstimate = async () => {
    try {
      const result = await estimateGenerate(buildConfig()).unwrap();
      setEstimatedCounts(result.counts);
      if (result.warnings.length) {
        dispatch(
          addAlert(
            `Estimate warnings: ${result.warnings.join('; ')}`,
            'warning'
          )
        );
      }
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Estimate failed.', 'danger')
      );
    }
  };

  const handleGenerate = async () => {
    setShowGenerateModal(false);
    try {
      const result = await generateData({
        ...buildConfig(),
        dryRun: false
      }).unwrap();
      setLastResult({
        summary: result.summary,
        warnings: result.warnings,
        validation: result.validation
      });
      const total = Object.values(result.summary).reduce((a, b) => a + b, 0);
      dispatch(
        addAlert(
          `Generated ${total.toLocaleString()} records. Run ID: ${
            result.runId
          }`,
          'success'
        )
      );
      // Explicitly refetch so the runs table updates without a page reload,
      // then scroll it into view once the data arrives
      refetchRuns().then(() => {
        setTimeout(() => {
          runsRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }, 100);
      });
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Generation failed.', 'danger')
      );
      // Still refetch — a partial run may have been recorded
      refetchRuns();
    }
  };

  const handleCleanupRun = async () => {
    if (!cleanupTarget) return;
    const id = cleanupTarget.id;
    setCleanupTarget(null);
    try {
      const result = await cleanupRun(id).unwrap();
      const total = Object.values(result.deletedCounts).reduce(
        (a, b) => a + b,
        0
      );
      dispatch(
        addAlert(
          `Cleaned ${total.toLocaleString()} records. Status: ${result.status}`,
          result.status === 'cleaned' ? 'success' : 'warning'
        )
      );
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Cleanup failed.', 'danger')
      );
    }
  };

  const handleCleanupAll = async () => {
    setShowCleanupAllModal(false);
    try {
      const result = await cleanupAllRuns().unwrap();
      dispatch(
        addAlert(
          `Cleaned ${result.cleaned} run(s). Partial: ${result.partial}. Failed: ${result.failed}.`,
          result.failed > 0 ? 'warning' : 'success'
        )
      );
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Bulk cleanup failed.', 'danger')
      );
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Modals */}
      {showGenerateModal && (
        <ConfirmModal
          mode={mode}
          config={buildConfig()}
          estimatedCounts={estimatedCounts}
          onConfirm={handleGenerate}
          onCancel={() => setShowGenerateModal(false)}
          isLoading={generating}
        />
      )}
      {cleanupTarget && (
        <CleanupConfirmModal
          label={cleanupTarget.label}
          onConfirm={handleCleanupRun}
          onCancel={() => setCleanupTarget(null)}
          isLoading={cleaningRun}
        />
      )}
      {showCleanupAllModal && (
        <CleanupConfirmModal
          label="all runs"
          isAll
          onConfirm={handleCleanupAll}
          onCancel={() => setShowCleanupAllModal(false)}
          isLoading={cleaningAll}
        />
      )}

      {/* Header */}
      <div>
        <Link
          to="/private/staff/tools"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          ← Toolbox
        </Link>
        <h2 className="mt-1 text-2xl font-bold text-white">
          Generate test data
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          Populate the database with synthetic seed data for development and
          testing. Only available outside production.
        </p>
      </div>

      {/* Status banner */}
      {statusLoading ? (
        <Spinner />
      ) : !status?.enabled ? (
        <div className="rounded-lg border border-red-700 bg-red-900/30 p-4 text-sm text-red-300">
          <strong>Generation unavailable.</strong> This tool is disabled in the
          current environment (
          <code className="font-mono text-xs">{status?.environment}</code>). All
          controls below are inactive.
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-700 bg-gray-800/60 px-4 py-3 text-sm">
          <span className="text-gray-400">Environment:</span>
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-700 text-green-300 border border-gray-600">
            {status.environment}
          </span>
          <span className="text-gray-600">·</span>
          <span className="text-gray-400">
            Existing runs:{' '}
            <span className="text-white font-medium">{status.runCount}</span>
          </span>
          {status.jobsEnabled && (
            <>
              <span className="text-gray-600">·</span>
              <span className="text-amber-400 text-xs">
                ⚠ Background jobs are running. Set{' '}
                <code className="font-mono">DISABLE_BACKGROUND_JOBS=1</code> to
                prevent interference with generated data.
              </span>
            </>
          )}
        </div>
      )}

      {status?.enabled && (
        <>
          {/* Generation form */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg divide-y divide-gray-700">
            {/* Mode */}
            <div className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-200">
                Generation mode
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                {(
                  [
                    {
                      value: 'isolated',
                      title: 'Isolated',
                      description:
                        'Creates only seed-owned rows. Tags use seed. prefix. Cleanup fully reversible.'
                    },
                    {
                      value: 'integrated',
                      title: 'Integrated',
                      description:
                        'May attach to existing forums and tags. Tracks mutations. Cleanup partially reversible.'
                    }
                  ] as const
                ).map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex-1 flex gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      mode === opt.value
                        ? 'border-indigo-500 bg-indigo-900/20'
                        : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="mode"
                      value={opt.value}
                      checked={mode === opt.value}
                      onChange={() => handleModeChange(opt.value)}
                      className="mt-0.5 shrink-0 accent-indigo-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {opt.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {opt.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Presets */}
            <div className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-200">Preset</h3>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => handlePreset(p.key)}
                    title={p.description}
                    className={`px-4 py-2 rounded text-sm font-medium border transition-colors ${
                      preset === p.key
                        ? 'bg-indigo-700 border-indigo-500 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white'
                    }`}
                  >
                    {p.label}
                    <span className="ml-2 text-xs opacity-60">
                      {p.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sections */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-200">
                  Sections
                </h3>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      setSections(visibleSections.map((s) => s.key))
                    }
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    All
                  </button>
                  <span className="text-gray-600">·</span>
                  <button
                    type="button"
                    onClick={() => setSections([])}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    None
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ALL_SECTIONS.map((s) => {
                  const disabled = s.integratedOnly && mode === 'isolated';
                  return (
                    <label
                      key={s.key}
                      className={`flex items-start gap-2 p-2 rounded border text-sm cursor-pointer transition-colors ${
                        disabled
                          ? 'border-gray-700 opacity-40 cursor-not-allowed'
                          : sections.includes(s.key)
                          ? 'border-indigo-600 bg-indigo-900/10 text-white'
                          : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={sections.includes(s.key)}
                        disabled={disabled}
                        onChange={() => !disabled && handleSectionToggle(s.key)}
                        className="mt-0.5 accent-indigo-500 shrink-0"
                      />
                      <span>
                        {s.label}
                        {s.integratedOnly && (
                          <span className="block text-xs text-gray-600">
                            integrated only
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Options */}
            <div className="p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-200">Options</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="gen-seed" className={labelClass}>
                    Seed (deterministic)
                  </label>
                  <input
                    id="gen-seed"
                    type="number"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    min={0}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="gen-scale" className={labelClass}>
                    Scale: <span className="text-white">{scale}×</span>
                  </label>
                  <input
                    id="gen-scale"
                    type="range"
                    min={0.1}
                    max={5}
                    step={0.1}
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-0.5">
                    <span>0.1×</span>
                    <span>5×</span>
                  </div>
                </div>
                <div>
                  <label htmlFor="gen-label" className={labelClass}>
                    Label (optional)
                  </label>
                  <input
                    id="gen-label"
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. Sprint 12 smoke test"
                    maxLength={100}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                {/* Edge cases — has tooltip explaining how it differs from the preset */}
                <label className="flex items-center gap-2 cursor-pointer group relative">
                  <input
                    id="edge-cases"
                    type="checkbox"
                    checked={includeEdgeCases}
                    onChange={(e) => setIncludeEdgeCases(e.target.checked)}
                    className="accent-indigo-500"
                  />
                  <span className="text-gray-300 flex items-center gap-1">
                    Include edge cases
                    <span
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-600 text-gray-300 text-xs cursor-help"
                      title=""
                    >
                      ?
                    </span>
                  </span>
                  {/* Tooltip */}
                  <span className="pointer-events-none absolute bottom-full left-0 mb-2 w-64 rounded bg-gray-900 border border-gray-700 px-3 py-2 text-xs text-gray-300 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    Adds deliberately extreme rows alongside normal ones —
                    zero-bounty requests, empty collages, max-length profiles,
                    etc. Independent of the preset volume.
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    id="mod-data"
                    type="checkbox"
                    checked={includeModerationData}
                    onChange={(e) => setIncludeModerationData(e.target.checked)}
                    className="accent-indigo-500"
                  />
                  <span className="text-gray-300">Include moderation data</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    id="stats-data"
                    type="checkbox"
                    checked={includeStatsData}
                    onChange={(e) => setIncludeStatsData(e.target.checked)}
                    className="accent-indigo-500"
                  />
                  <span className="text-gray-300">Include stats data</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 flex flex-wrap gap-3 items-center">
              <button
                type="button"
                onClick={handleEstimate}
                disabled={estimating || sections.length === 0}
                className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-200 rounded border border-gray-600 transition-colors"
              >
                {estimating ? 'Estimating…' : 'Preview counts'}
              </button>
              <button
                type="button"
                onClick={() => setShowGenerateModal(true)}
                disabled={generating || sections.length === 0}
                className="px-4 py-2 text-sm bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white rounded font-medium transition-colors"
              >
                Generate test data
              </button>
              {sections.length === 0 && (
                <p className="text-xs text-gray-500">
                  Select at least one section.
                </p>
              )}
              {estimatedCounts && (
                <p className="text-xs text-gray-500">
                  Estimate:{' '}
                  {Object.values(estimatedCounts)
                    .reduce((a, b) => a + b, 0)
                    .toLocaleString()}{' '}
                  total records
                </p>
              )}
            </div>
          </div>

          {/* Last result */}
          {lastResult && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-200">
                  Last run result
                </h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded border font-medium ${
                    lastResult.validation.passed
                      ? 'bg-green-900/40 text-green-300 border-green-700/40'
                      : 'bg-red-900/40 text-red-300 border-red-700/40'
                  }`}
                >
                  Validation:{' '}
                  {lastResult.validation.passed ? 'passed' : 'failed'}
                </span>
              </div>

              {/* Summary counts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(lastResult.summary)
                  .filter(([, v]) => v > 0)
                  .map(([k, v]) => (
                    <div
                      key={k}
                      className="bg-gray-900 border border-gray-700 rounded px-3 py-2"
                    >
                      <p className="text-xs text-gray-500">{k}</p>
                      <p className="text-lg font-semibold text-white font-mono">
                        {v.toLocaleString()}
                      </p>
                    </div>
                  ))}
              </div>

              {/* Validation checks */}
              {lastResult.validation.checks.some((c) => !c.passed) && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Failed checks
                  </p>
                  {lastResult.validation.checks
                    .filter((c) => !c.passed)
                    .map((c) => (
                      <div
                        key={c.name}
                        className="flex gap-2 text-xs text-red-300 font-mono"
                      >
                        <span className="shrink-0">✗</span>
                        <span>
                          {c.name}
                          {c.message ? ` — ${c.message}` : ''}
                        </span>
                      </div>
                    ))}
                </div>
              )}

              {/* Warnings */}
              {lastResult.warnings.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Warnings
                  </p>
                  {lastResult.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-amber-300 font-mono">
                      {w}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Previous runs */}
          <div
            ref={runsRef}
            className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <h3 className="text-sm font-semibold text-gray-200">
                Previous runs{' '}
                {runs?.length ? (
                  <span className="text-gray-500 font-normal">
                    ({runs.length})
                  </span>
                ) : null}
              </h3>
              {(runs?.some((r) => r.cleanupStatus === 'active') ?? false) && (
                <button
                  type="button"
                  onClick={() => setShowCleanupAllModal(true)}
                  disabled={cleaningAll}
                  className="text-xs text-red-400 hover:text-red-300 border border-red-800/60 rounded px-2 py-1 transition-colors disabled:opacity-50"
                >
                  {cleaningAll ? 'Cleaning…' : 'Clean up all'}
                </button>
              )}
            </div>

            {runsLoading ? (
              <div className="p-6 flex justify-center">
                <Spinner />
              </div>
            ) : !runs?.length ? (
              <p className="px-4 py-6 text-center text-sm text-gray-500">
                No runs yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-700/40 text-xs uppercase tracking-wider text-gray-400">
                      <th className="text-left px-4 py-2 font-semibold">
                        Label
                      </th>
                      <th className="text-left px-4 py-2 font-semibold">
                        Mode
                      </th>
                      <th className="text-left px-4 py-2 font-semibold">
                        Date
                      </th>
                      <th className="text-left px-4 py-2 font-semibold">
                        Records
                      </th>
                      <th className="text-left px-4 py-2 font-semibold">
                        Reversibility
                      </th>
                      <th className="text-left px-4 py-2 font-semibold">
                        Warns
                      </th>
                      <th className="text-left px-4 py-2 font-semibold">
                        Status
                      </th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {runs.map((run) => (
                      <RunRow
                        key={run.id}
                        run={run}
                        onCleanup={(id, lbl) =>
                          setCleanupTarget({ id, label: lbl })
                        }
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GenerateTestDataPage;
