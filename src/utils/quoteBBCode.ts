// Builds the BBCode for quoting a post into the reply editor. This is a source
// *producer* for the editor, unrelated to the retired client-side parser
// (#207): BBCode is now transcribed to HTML server-side (stellar-api #398/#402),
// so the UI only ever emits raw BBCode here and reads rendered HTML for display.
export function quotePost(username: string, body: string): string {
  return `[quote=${username}]${body}[/quote]\n`;
}
