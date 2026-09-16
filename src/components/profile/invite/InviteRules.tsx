import { Link } from 'react-router-dom';
import { useGetRulesTreeQuery } from '../../../store/services/rulesApi';
import { renderRuleText } from '../../../utils/rulesText';

// The three Golden Rules a member is about to act under (stellar-ui#331).
// Selected by the STABLE `code`, not by position: the displayed number is
// positional (it must match /rules and the `[rule]` anchors), so quoting by
// number would silently quote the wrong rule the day a rule is reordered.
const QUOTED: readonly { rule: string; sub: string }[] = [
  { rule: 'golden.accounts', sub: 'single-account' },
  { rule: 'golden.invites', sub: 'no-bad-invitees' },
  { rule: 'golden.invites', sub: 'no-trade-invites' }
];

type Quoted = { number: string; title: string; description: string };

/** The quoted sub-rules found in the tree, each with its positional number. */
const selectQuoted = (
  rules: {
    code: string;
    subRules: { code: string; title: string; description: string }[];
  }[]
): Quoted[] =>
  QUOTED.flatMap(({ rule, sub }) => {
    const ruleIndex = rules.findIndex((r) => r.code === rule);
    if (ruleIndex < 0) return [];
    const subIndex = rules[ruleIndex].subRules.findIndex((s) => s.code === sub);
    if (subIndex < 0) return [];
    const found = rules[ruleIndex].subRules[subIndex];
    return [
      {
        number: `${ruleIndex + 1}.${subIndex + 1}`,
        title: found.title,
        description: found.description
      }
    ];
  });

/**
 * `${irc}` resolves to a route stellar-ui does not have, so on this page it
 * points at the public IRC guide instead — the same URL a disabled member is
 * given at login (stellar-api#622). Both values come from the api's own
 * variables map; only the choice between them is this page's. Remove once
 * stellar-api#630 settles what `${irc}` means.
 */
const withReachableIrc = (variables: Record<string, string>) => ({
  ...variables,
  irc: variables.irc_guide_article ?? variables.irc
});

const InviteRules = () => {
  const { data: tree } = useGetRulesTreeQuery();
  const quoted = selectQuoted(tree?.rules ?? []);
  if (quoted.length === 0) return null;
  const variables = withReachableIrc(tree?.variables ?? {});

  return (
    <div className="box pad" data-st="panel">
      <ul className="space-y-2">
        {quoted.map((rule) => (
          <li key={rule.number} data-st="prose" className="text-sm">
            <Link to={`/rules#${rule.number}`} data-st="meta" className="mr-2">
              {rule.number}
            </Link>
            <span data-st="prose" data-st-strong className="font-semibold">
              {rule.title}
            </span>{' '}
            {renderRuleText(rule.description, variables)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InviteRules;
