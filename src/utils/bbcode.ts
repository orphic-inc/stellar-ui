const escape = (str: string) =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function parseBBCode(raw: string): string {
  let s = escape(raw);

  // Block-level: quote
  s = s.replace(
    /\[quote=([^\]]+)\]([\s\S]*?)\[\/quote\]/gi,
    (_, user, content) =>
      `<blockquote class="bbcode-quote"><cite>${escape(
        user
      )} wrote:</cite>${content}</blockquote>`
  );
  s = s.replace(
    /\[quote\]([\s\S]*?)\[\/quote\]/gi,
    (_, content) => `<blockquote class="bbcode-quote">${content}</blockquote>`
  );

  // Block-level: code
  s = s.replace(
    /\[code\]([\s\S]*?)\[\/code\]/gi,
    (_, content) => `<pre class="bbcode-code"><code>${content}</code></pre>`
  );

  // Block-level: list
  s = s.replace(/\[list\]([\s\S]*?)\[\/list\]/gi, (_, content) => {
    const items = content
      .split(/\[\*\]/)
      .filter((i: string) => i.trim())
      .map((i: string) => `<li>${i.trim()}</li>`)
      .join('');
    return `<ul class="bbcode-list">${items}</ul>`;
  });

  // Inline: bold, italic, underline, strikethrough
  s = s.replace(/\[b\](.*?)\[\/b\]/gi, '<strong>$1</strong>');
  s = s.replace(/\[i\](.*?)\[\/i\]/gi, '<em>$1</em>');
  s = s.replace(/\[u\](.*?)\[\/u\]/gi, '<u>$1</u>');
  s = s.replace(/\[s\](.*?)\[\/s\]/gi, '<s>$1</s>');

  // Inline: color
  s = s.replace(
    /\[color=([a-zA-Z0-9#]+)\](.*?)\[\/color\]/gi,
    '<span style="color:$1">$2</span>'
  );

  // Inline: size (clamp 8–24pt)
  s = s.replace(/\[size=(\d+)\](.*?)\[\/size\]/gi, (_, n, content) => {
    const pt = Math.min(24, Math.max(8, parseInt(n)));
    return `<span style="font-size:${pt}pt">${content}</span>`;
  });

  // Inline: url with label
  s = s.replace(
    /\[url=([^\]]+)\](.*?)\[\/url\]/gi,
    '<a href="$1" rel="noopener noreferrer" target="_blank">$2</a>'
  );
  // Inline: url without label
  s = s.replace(
    /\[url](https?:\/\/[^[]+)\[\/url]/gi,
    '<a href="$1" rel="noopener noreferrer" target="_blank">$1</a>'
  );

  // Inline: img
  s = s.replace(
    /\[img](https?:\/\/[^[]+)\[\/img]/gi,
    '<img src="$1" alt="" class="bbcode-img" />'
  );

  // Newlines → <br>
  s = s.replace(/\n/g, '<br />');

  return s;
}

export function quotePost(username: string, body: string): string {
  return `[quote=${username}]${body}[/quote]\n`;
}
