import type { LinkHealthStatus } from '../../types';

interface Props {
  status: LinkHealthStatus;
}

const LABELS: Record<LinkHealthStatus, string> = {
  UNKNOWN: 'Unchecked',
  PASS: 'Link OK',
  WARN: 'Link Warning',
  FAIL: 'Dead Link'
};

const CLASSES: Record<LinkHealthStatus, string> = {
  UNKNOWN: 'bg-gray-700 text-gray-300',
  PASS: 'bg-green-800 text-green-200',
  WARN: 'bg-yellow-800 text-yellow-200',
  FAIL: 'bg-red-800 text-red-200'
};

const LinkStatusBadge = ({ status }: Props) => (
  <span
    className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${CLASSES[status]}`}
    title={`Link health: ${LABELS[status]}`}
  >
    {LABELS[status]}
  </span>
);

export default LinkStatusBadge;
