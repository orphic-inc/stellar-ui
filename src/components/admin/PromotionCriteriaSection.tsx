import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import {
  useGetPromotionRulesQuery,
  useGetUserRanksQuery,
  useCreatePromotionRuleMutation,
  useUpdatePromotionRuleMutation
} from '../../store/services/userApi';
import { addAlert } from '../../store/slices/alertSlice';

interface PromotionFormValues {
  toRankId: number | '';
  minContributed: string;
  minRatio: number;
  minContributions: number;
  minAccountAgeDays: number;
  extra: '' | 'DISTINCT_RELEASES_500' | 'QUALITY_CONTRIB_500';
  enabled: boolean;
}

const inputClass =
  'w-full rounded bg-gray-700 border border-gray-600 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm';
const labelClass = 'block text-sm font-medium text-gray-300 mb-1';

// Edits the auto-class promotion rule whose `fromRankId` is the rank being
// edited (the outgoing rung). Creates one when none exists yet. Its own <form>
// with its own save mutation — rendered as a sibling of the rank-definition
// form, never nested inside it (nested <form>s are invalid DOM).
const PromotionCriteriaSection = ({ fromRankId }: { fromRankId: number }) => {
  const dispatch = useDispatch();
  const { data: rules } = useGetPromotionRulesQuery();
  const { data: ranks } = useGetUserRanksQuery();
  const [createPromotionRule] = useCreatePromotionRuleMutation();
  const [updatePromotionRule] = useUpdatePromotionRuleMutation();

  const existingRule = rules?.find((r) => r.fromRankId === fromRankId);

  const { register, handleSubmit, reset } = useForm<PromotionFormValues>({
    defaultValues: {
      toRankId: '',
      minContributed: '0',
      minRatio: 0,
      minContributions: 0,
      minAccountAgeDays: 0,
      extra: '',
      enabled: true
    }
  });

  useEffect(() => {
    if (existingRule) {
      reset({
        toRankId: existingRule.toRankId,
        minContributed: existingRule.minContributed,
        minRatio: existingRule.minRatio,
        minContributions: existingRule.minContributions,
        minAccountAgeDays: existingRule.minAccountAgeDays,
        extra: existingRule.extra ?? '',
        enabled: existingRule.enabled
      });
    }
  }, [existingRule, reset]);

  const onSubmit = async (data: PromotionFormValues) => {
    const body = {
      fromRankId,
      toRankId: Number(data.toRankId),
      minContributed: data.minContributed, // bytes — string, never a number
      minRatio: data.minRatio,
      minContributions: data.minContributions,
      minAccountAgeDays: data.minAccountAgeDays,
      extra: data.extra === '' ? null : data.extra,
      enabled: data.enabled
    };
    try {
      if (existingRule) {
        await updatePromotionRule({ id: existingRule.id, ...body }).unwrap();
      } else {
        await createPromotionRule(body).unwrap();
      }
      dispatch(addAlert('Promotion criteria saved.', 'success'));
    } catch {
      dispatch(addAlert('Failed to save promotion criteria.', 'danger'));
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <div className="bg-gray-700/60 px-4 py-2 border-b border-gray-700">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
          Promotion Criteria
        </h3>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
        <p className="text-sm text-gray-400">
          Thresholds a member must clear to be auto-promoted out of this class.
          Contributed bytes are link-health-eligible (ADR-0006).
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label htmlFor="promo-to-rank" className={labelClass}>
              Promotes to
            </label>
            <select
              id="promo-to-rank"
              {...register('toRankId', { valueAsNumber: true })}
              className={inputClass}
            >
              <option value="">— Select class —</option>
              {ranks
                ?.filter((r) => r.id !== fromRankId)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label htmlFor="promo-min-contributed" className={labelClass}>
              Min contributed (bytes)
            </label>
            <input
              id="promo-min-contributed"
              type="text"
              inputMode="numeric"
              {...register('minContributed')}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="promo-min-ratio" className={labelClass}>
              Min ratio
            </label>
            <input
              id="promo-min-ratio"
              type="number"
              step="0.01"
              min={0}
              {...register('minRatio', { valueAsNumber: true })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="promo-min-contributions" className={labelClass}>
              Min contributions
            </label>
            <input
              id="promo-min-contributions"
              type="number"
              min={0}
              {...register('minContributions', { valueAsNumber: true })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="promo-min-age" className={labelClass}>
              Min account age (days)
            </label>
            <input
              id="promo-min-age"
              type="number"
              min={0}
              {...register('minAccountAgeDays', { valueAsNumber: true })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="promo-extra" className={labelClass}>
              Extra requirement
            </label>
            <select
              id="promo-extra"
              {...register('extra')}
              className={inputClass}
            >
              <option value="">— None —</option>
              <option value="DISTINCT_RELEASES_500">
                500 distinct releases
              </option>
              <option value="QUALITY_CONTRIB_500">
                500 quality contributions
              </option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...register('enabled')}
            className="rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-800"
          />
          <span className="text-sm text-gray-300">Rule enabled</span>
        </label>
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            Save Promotion Criteria
          </button>
        </div>
      </form>
    </div>
  );
};

export default PromotionCriteriaSection;
