import {
  useEffect,
  type ComponentPropsWithRef,
  type FormEventHandler
} from 'react';
import { useForm, type UseFormRegister } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import {
  useGetPromotionRulesQuery,
  useGetUserRanksQuery,
  useCreatePromotionRuleMutation,
  useUpdatePromotionRuleMutation,
  useDeletePromotionRuleMutation
} from '../../store/services/userApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import { promotionPosition } from '../../utils/promotionLadder';
import { Panel, Button, SectionHeading } from '../ui';
import type { components } from '../../types/api';

type PromotionRule = components['schemas']['PromotionRule'];

/** The anchor the rank page's stale-rule notice links to (#383). */
export const PROMOTION_SECTION_ID = 'promotion-criteria';

interface PromotionFormValues {
  minContributed: string;
  minRatio: number;
  minContributions: number;
  minAccountAgeDays: number;
  extra: '' | 'DISTINCT_RELEASES_500' | 'QUALITY_CONTRIB_500';
  enabled: boolean;
}

const EMPTY_RULE: PromotionFormValues = {
  minContributed: '0',
  minRatio: 0,
  minContributions: 0,
  minAccountAgeDays: 0,
  extra: '',
  enabled: true
};

// `field`-direct inputs, not the kit's <Field>: react-hook-form's register()
// hands the control a ref, and Field is a plain function component that doesn't
// forward one. Labels decompose to `meta`.
const labelClass = 'block text-sm mb-1';

/**
 * Every other rule leaving this rank (#383). The api's sweep ignores them now
 * (stellar-api#718), so deleting them is housekeeping. The current rule has no
 * Delete here: its `enabled` checkbox is the way to switch it off.
 */
const OutOfDateRules = ({ rules }: { rules: PromotionRule[] }) => {
  const dispatch = useDispatch();
  const [deletePromotionRule] = useDeletePromotionRuleMutation();

  const remove = async (rule: PromotionRule) => {
    try {
      await deletePromotionRule(rule.id).unwrap();
      dispatch(addAlert(`Deleted the rule to ${rule.toRankName}.`, 'success'));
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to delete the promotion rule.',
          'danger'
        )
      );
    }
  };

  return (
    <div
      role="alert"
      className="text-sm rounded border border-[var(--st-warning)] px-3 py-2 text-[var(--st-warning)] space-y-2"
    >
      <p>
        Out of date: these rules no longer step to the next class, so they never
        fire. Delete them to tidy up.
      </p>
      <ul className="space-y-1">
        {rules.map((rule) => (
          <li key={rule.id} className="flex items-center gap-3">
            <span>→ {rule.toRankName ?? `rank #${rule.toRankId}`}</span>
            <Button
              type="button"
              variant="link-danger"
              aria-label={`Delete the rule to ${rule.toRankName}`}
              onClick={() => remove(rule)}
            >
              Delete
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

/** Why a rank can hold no promotion rule (#383, #425). */
const noRuleReason = (secondary: boolean, autoManaged: boolean) => {
  if (secondary) return 'Secondary classes are not on the promotion ladder.';
  if (!autoManaged)
    return 'Staff classes are assigned by hand, never auto-promoted into or out of.';
  return 'No auto-managed class sits above this one, so there is nothing to promote to.';
};

/** Scroll here when the rank page's stale-rule notice linked to this section. */
const useScrollIntoViewOnHash = (ready: boolean) => {
  const { hash } = useLocation();
  useEffect(() => {
    if (ready && hash === `#${PROMOTION_SECTION_ID}`) {
      document.getElementById(PROMOTION_SECTION_ID)?.scrollIntoView?.();
    }
  }, [ready, hash]);
};

// Edits the auto-class promotion rule from the rank being edited to the next
// primary rank up, the only target the api accepts (#383). Creates one when
// none exists yet. Its own <form> with its own save mutation — rendered as a
// sibling of the rank-definition form, never nested inside it (nested <form>s
// are invalid DOM).
const PromotionCriteriaSection = ({ fromRankId }: { fromRankId: number }) => {
  const dispatch = useDispatch();
  const { data: rules } = useGetPromotionRulesQuery();
  const { data: ranks } = useGetUserRanksQuery();
  const [createPromotionRule] = useCreatePromotionRuleMutation();
  const [updatePromotionRule] = useUpdatePromotionRuleMutation();

  const {
    secondary,
    autoManaged,
    next,
    current: existingRule,
    outOfDate
  } = promotionPosition(fromRankId, ranks, rules);
  const shown = Boolean(next) || outOfDate.length > 0;
  useScrollIntoViewOnHash(shown);

  const { register, handleSubmit, reset } = useForm<PromotionFormValues>({
    defaultValues: EMPTY_RULE
  });

  // Back to the defaults when this rank has no current rule: the page stays
  // mounted when the stale-rule notice links from one rank to another.
  useEffect(() => {
    reset(
      existingRule
        ? {
            minContributed: existingRule.minContributed,
            minRatio: existingRule.minRatio,
            minContributions: existingRule.minContributions,
            minAccountAgeDays: existingRule.minAccountAgeDays,
            extra: existingRule.extra ?? '',
            enabled: existingRule.enabled
          }
        : EMPTY_RULE
    );
  }, [existingRule, reset]);

  const onSubmit = async (data: PromotionFormValues) => {
    if (!next) return;
    const body = {
      fromRankId,
      toRankId: next.id,
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
    } catch (err) {
      // 409 (the pair exists) and 422 (off the ladder) say why; show it.
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to save promotion criteria.',
          'danger'
        )
      );
    }
  };

  // A secondary rank or the top rung can hold no valid rule. The section still
  // shows when old rules leave the rank, so they can be deleted.
  if (!shown) return null;

  return (
    <Panel id={PROMOTION_SECTION_ID} className="overflow-hidden">
      <div className="bg-[var(--st-raised)] px-4 py-2 border-b border-[var(--st-border-subtle)]">
        <SectionHeading>Promotion Criteria</SectionHeading>
      </div>
      <div className="p-4 space-y-4">
        {outOfDate.length > 0 && <OutOfDateRules rules={outOfDate} />}
        {next ? (
          <PromotionForm
            nextName={next.name}
            register={register}
            onSubmit={handleSubmit(onSubmit)}
          />
        ) : (
          <p data-st="meta" className="text-sm">
            {noRuleReason(secondary, autoManaged)}
          </p>
        )}
      </div>
    </Panel>
  );
};

type RuleInputProps = ComponentPropsWithRef<'input'> & {
  id: string;
  label: string;
};

/** One labelled threshold; a non-negative number unless the caller says otherwise. */
const RuleInput = ({ id, label, ...input }: RuleInputProps) => {
  return (
    <div>
      <label htmlFor={id} data-st="meta" className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={0}
        data-st="field"
        className="w-full"
        {...input}
      />
    </div>
  );
};

/**
 * The target is fixed: the next primary rank up is the only one the api
 * accepts (#383), so it is shown, not chosen.
 */
const PromotesTo = ({ name }: { name: string }) => {
  return (
    <div>
      <span id="promo-to-rank" data-st="meta" className={labelClass}>
        Promotes to
      </span>
      <p data-st="prose" aria-labelledby="promo-to-rank">
        {name}
      </p>
    </div>
  );
};

/** The optional extra predicate (stellar-api `RankExtraPredicate`). */
const ExtraSelect = (select: ComponentPropsWithRef<'select'>) => {
  return (
    <div>
      <label htmlFor="promo-extra" data-st="meta" className={labelClass}>
        Extra requirement
      </label>
      <select id="promo-extra" data-st="field" className="w-full" {...select}>
        <option value="">— None —</option>
        <option value="DISTINCT_RELEASES_500">500 distinct releases</option>
        <option value="QUALITY_CONTRIB_500">500 quality contributions</option>
      </select>
    </div>
  );
};

interface PromotionFormProps {
  nextName: string;
  register: UseFormRegister<PromotionFormValues>;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

const PromotionForm = ({
  nextName,
  register,
  onSubmit
}: PromotionFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p data-st="meta" className="text-sm">
        Thresholds a member must clear to be auto-promoted out of this class.
        Contributed bytes are link-health-eligible (ADR-0006).
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <PromotesTo name={nextName} />
        <RuleInput
          id="promo-min-contributed"
          label="Min contributed (bytes)"
          type="text"
          inputMode="numeric"
          {...register('minContributed')}
        />
        <RuleInput
          id="promo-min-ratio"
          label="Min ratio"
          step="0.01"
          {...register('minRatio', { valueAsNumber: true })}
        />
        <RuleInput
          id="promo-min-contributions"
          label="Min contributions"
          {...register('minContributions', { valueAsNumber: true })}
        />
        <RuleInput
          id="promo-min-age"
          label="Min account age (days)"
          {...register('minAccountAgeDays', { valueAsNumber: true })}
        />
        <ExtraSelect {...register('extra')} />
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
  );
};

export default PromotionCriteriaSection;
