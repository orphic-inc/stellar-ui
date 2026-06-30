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
import { Panel, Button, SectionHeading } from '../ui';

interface PromotionFormValues {
  toRankId: number | '';
  minContributed: string;
  minRatio: number;
  minContributions: number;
  minAccountAgeDays: number;
  extra: '' | 'DISTINCT_RELEASES_500' | 'QUALITY_CONTRIB_500';
  enabled: boolean;
}

// `field`-direct inputs, not the kit's <Field>: react-hook-form's register()
// hands the control a ref, and Field is a plain function component that doesn't
// forward one. Labels decompose to `meta`.
const labelClass = 'block text-sm mb-1';

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
    <Panel className="overflow-hidden">
      <div className="bg-[var(--st-raised)] px-4 py-2 border-b border-[var(--st-border-subtle)]">
        <SectionHeading>Promotion Criteria</SectionHeading>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
        <p data-st="meta" className="text-sm">
          Thresholds a member must clear to be auto-promoted out of this class.
          Contributed bytes are link-health-eligible (ADR-0006).
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label
              htmlFor="promo-to-rank"
              data-st="meta"
              className={labelClass}
            >
              Promotes to
            </label>
            <select
              id="promo-to-rank"
              data-st="field"
              className="w-full"
              {...register('toRankId', { valueAsNumber: true })}
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
            <label
              htmlFor="promo-min-contributed"
              data-st="meta"
              className={labelClass}
            >
              Min contributed (bytes)
            </label>
            <input
              id="promo-min-contributed"
              type="text"
              inputMode="numeric"
              data-st="field"
              className="w-full"
              {...register('minContributed')}
            />
          </div>
          <div>
            <label
              htmlFor="promo-min-ratio"
              data-st="meta"
              className={labelClass}
            >
              Min ratio
            </label>
            <input
              id="promo-min-ratio"
              type="number"
              step="0.01"
              min={0}
              data-st="field"
              className="w-full"
              {...register('minRatio', { valueAsNumber: true })}
            />
          </div>
          <div>
            <label
              htmlFor="promo-min-contributions"
              data-st="meta"
              className={labelClass}
            >
              Min contributions
            </label>
            <input
              id="promo-min-contributions"
              type="number"
              min={0}
              data-st="field"
              className="w-full"
              {...register('minContributions', { valueAsNumber: true })}
            />
          </div>
          <div>
            <label
              htmlFor="promo-min-age"
              data-st="meta"
              className={labelClass}
            >
              Min account age (days)
            </label>
            <input
              id="promo-min-age"
              type="number"
              min={0}
              data-st="field"
              className="w-full"
              {...register('minAccountAgeDays', { valueAsNumber: true })}
            />
          </div>
          <div>
            <label htmlFor="promo-extra" data-st="meta" className={labelClass}>
              Extra requirement
            </label>
            <select
              id="promo-extra"
              data-st="field"
              className="w-full"
              {...register('extra')}
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
          <input type="checkbox" data-st="field" {...register('enabled')} />
          <span data-st="meta">Rule enabled</span>
        </label>
        <div className="flex justify-end">
          <Button type="submit" variant="primary">
            Save Promotion Criteria
          </Button>
        </div>
      </form>
    </Panel>
  );
};

export default PromotionCriteriaSection;
