import { readableTime, formatDate } from '../../utils';

interface Props {
  date?: string;
  full?: boolean;
}

const Time = ({ date, full = false }: Props) => {
  const display = full ? formatDate(date) : readableTime(date);
  return (
    <time dateTime={date} title={formatDate(date)}>
      {display}
    </time>
  );
};

export default Time;
