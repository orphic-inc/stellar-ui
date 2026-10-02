import { Link } from 'react-router-dom';

/** Under the Site Stylesheet source radios; links to the member's own sheets (#450). */
const StylesheetSourceNote = () => (
  <p data-st="meta" className="text-xs">
    One source at a time — choosing one clears the other. With neither set, the
    built-in stylesheet selected above is used.{' '}
    <Link to="/stylesheets" data-st="control">
      My stylesheets →
    </Link>
  </p>
);

/** The Registry option's hint: where to adopt one, or which is in use (#451). */
export const AdoptedSheetHint = ({ id }: { id: number | null }) => (
  <p data-st="meta" className="text-xs pl-7">
    {id === null ? (
      "None adopted yet — open a stylesheet's page to adopt it."
    ) : (
      <>
        Using adopted stylesheet #{id}.{' '}
        <Link to={`/stylesheets/${id}`} data-st="control">
          Its page →
        </Link>
      </>
    )}
  </p>
);

export default StylesheetSourceNote;
