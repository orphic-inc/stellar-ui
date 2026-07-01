import { useState, type ReactNode } from 'react';
import type { ReleaseContributionDetail } from '../../types';
import { formatSize } from '../../utils';
import { bitrateLabel, editionLabel, isLossless } from '../../utils/edition';

type EditionStackProps = {
  contributions: ReleaseContributionDetail[];
  // Per-format-row actions (download/report) — omitted on read-only surfaces
  // like the collage disclosure, present on the release workbench.
  renderActions?: (contribution: ReleaseContributionDetail) => ReactNode;
};

type Group = {
  editionId: number;
  heading: string;
  rows: ReleaseContributionDetail[];
};

// Group contributions by their Edition, preserving first-seen order so the
// heading order matches the API's ordering.
const groupByEdition = (
  contributions: ReleaseContributionDetail[]
): Group[] => {
  const groups = new Map<number, Group>();
  for (const c of contributions) {
    const editionId = c.edition.id;
    let group = groups.get(editionId);
    if (!group) {
      group = { editionId, heading: editionLabel(c.edition), rows: [] };
      groups.set(editionId, group);
    }
    group.rows.push(c);
  }
  return [...groups.values()];
};

// The shared edition disclosure (D-2): editions as collapsible headings, each
// with its format/quality rows (format, rip flags, size, optional actions).
// Lossless rows carry data-st-lossless so the token layer tiers them.
const EditionStack = ({ contributions, renderActions }: EditionStackProps) => {
  const groups = groupByEdition(contributions);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  const toggle = (editionId: number) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(editionId)) next.delete(editionId);
      else next.add(editionId);
      return next;
    });

  return (
    <div data-st="edition-stack">
      {groups.map((group) => {
        const isCollapsed = collapsed.has(group.editionId);
        return (
          <div key={group.editionId}>
            <button
              type="button"
              data-st="edition-heading"
              aria-expanded={!isCollapsed}
              onClick={() => toggle(group.editionId)}
            >
              <span aria-hidden>{isCollapsed ? '+' : '−'}</span>
              {group.heading}
            </button>
            {!isCollapsed &&
              group.rows.map((c) => {
                const lossless = isLossless(c.releaseFile?.bitrate ?? null);
                return (
                  <div
                    key={c.id}
                    data-st="edition"
                    data-st-lossless={lossless ? '' : undefined}
                  >
                    <span data-st="edition-format">
                      {c.type.toUpperCase()} /{' '}
                      {bitrateLabel(c.releaseFile?.bitrate ?? null)}
                    </span>
                    <span className="flex gap-1">
                      {c.releaseFile?.hasLog && (
                        <span
                          data-st="edition-flag"
                          data-st-lossless={lossless ? '' : undefined}
                        >
                          Log
                        </span>
                      )}
                      {c.releaseFile?.hasCue && (
                        <span
                          data-st="edition-flag"
                          data-st-lossless={lossless ? '' : undefined}
                        >
                          Cue
                        </span>
                      )}
                      {c.releaseFile?.isScene && (
                        <span data-st="edition-flag">Scene</span>
                      )}
                    </span>
                    <span data-st="edition-size">
                      {formatSize(c.sizeInBytes)}
                    </span>
                    <span data-st="edition-availability">
                      {renderActions?.(c)}
                    </span>
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
};

export default EditionStack;
