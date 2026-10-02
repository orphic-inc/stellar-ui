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

export default StylesheetSourceNote;
