import katex from 'katex';

interface Delimiter {
  left: string;
  right: string;
  display: boolean;
}

const DELIMITERS: Delimiter[] = [
  { left: '$$', right: '$$', display: true },
  { left: '\\[', right: '\\]', display: true },
  { left: '$', right: '$', display: false },
  { left: '\\(', right: '\\)', display: false },
];

function findNextDelimiter(
  text: string,
  startPos: number
): { index: number; delimiter: Delimiter } | null {
  let best: { index: number; delimiter: Delimiter } | null = null;

  for (const delim of DELIMITERS) {
    const idx = text.indexOf(delim.left, startPos);
    if (idx !== -1 && (best === null || idx < best.index)) {
      best = { index: idx, delimiter: delim };
    }
  }

  return best;
}

/**
 * Parse content with LaTeX delimiters and render math segments
 * using KaTeX server-side. Returns HTML with pre-rendered math.
 */
export function renderLatexContent(content: string): string {
  const parts: string[] = [];
  let pos = 0;

  while (pos < content.length) {
    const found = findNextDelimiter(content, pos);

    if (!found) {
      parts.push(content.slice(pos));
      break;
    }

    // Text before the delimiter
    if (found.index > pos) {
      parts.push(content.slice(pos, found.index));
    }

    // Find closing delimiter
    const mathStart = found.index + found.delimiter.left.length;
    const closeIdx = content.indexOf(found.delimiter.right, mathStart);

    if (closeIdx === -1) {
      // No closing delimiter, treat rest as plain text
      parts.push(content.slice(found.index));
      break;
    }

    const math = content.slice(mathStart, closeIdx);

    try {
      parts.push(
        katex.renderToString(math.trim(), {
          displayMode: found.delimiter.display,
          throwOnError: false,
        })
      );
    } catch {
      // If KaTeX fails, output the original delimited text
      parts.push(
        content.slice(found.index, closeIdx + found.delimiter.right.length)
      );
    }

    pos = closeIdx + found.delimiter.right.length;
  }

  return parts.join('');
}
