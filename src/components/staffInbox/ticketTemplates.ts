/**
 * Pre-filled Staff PM tickets, opened as `/inbox/staff/new?template=<name>`
 * (#100). The form owns the wording, so a link carries only the name, and an
 * unknown name opens the blank form.
 */
export type TicketTemplate = {
  /** Fixed, outside the input: the member types only what follows it. */
  subjectPrefix: string;
  subjectPlaceholder: string;
  /** `siteName` is null when it could not be read. */
  body: (siteName: string | null, username: string) => string;
  /** The body text the cursor starts after. */
  cursorAfter: string;
};

const COMMUNITY_NAME = 'Community name: ';

export const TICKET_TEMPLATES: Record<string, TicketTemplate> = {
  'community-request': {
    subjectPrefix: '[Create a Community Request]',
    subjectPlaceholder:
      'Your subject line for why you should be a Community Leader',
    body: (siteName, username) =>
      [
        siteName ? `Hey there ${siteName} staff,` : 'Hey there staff,',
        '',
        COMMUNITY_NAME,
        'What it would hold: ',
        "Why I'd lead it: ",
        '',
        `Best, ${username}`
      ].join('\n'),
    cursorAfter: COMMUNITY_NAME
  }
};

/**
 * Where "Can't find your community?" points (#100). ContributeForm spells the
 * same path out rather than importing this: an import line would grow that
 * over-limit file and move its flagged functions, which re-reports them.
 */
export const COMMUNITY_REQUEST_HREF =
  '/inbox/staff/new?template=community-request';
