export interface Delimiter {
  left: string;
  right: string;
  display: boolean;
}

export const DELIMITERS: Delimiter[] = [
  { left: '$$', right: '$$', display: true },
  { left: '\\[', right: '\\]', display: true },
  { left: '$', right: '$', display: false },
  { left: '\\(', right: '\\)', display: false },
];

export function findNextDelimiter(
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

export type Segment =
  | { type: 'text'; content: string }
  | { type: 'math'; content: string; display: boolean };

/**
 * Parse content with LaTeX delimiters into structured segments
 * of text and math content.
 */
export function parseLatex(content: string): Segment[] {
  const segments: Segment[] = [];
  let pos = 0;

  while (pos < content.length) {
    const found = findNextDelimiter(content, pos);

    if (!found) {
      segments.push({ type: 'text', content: content.slice(pos) });
      break;
    }

    // Text before the delimiter
    if (found.index > pos) {
      segments.push({ type: 'text', content: content.slice(pos, found.index) });
    }

    // Find closing delimiter
    const mathStart = found.index + found.delimiter.left.length;
    const closeIdx = content.indexOf(found.delimiter.right, mathStart);

    if (closeIdx === -1) {
      // No closing delimiter, treat rest as plain text
      segments.push({ type: 'text', content: content.slice(found.index) });
      break;
    }

    const math = content.slice(mathStart, closeIdx);
    segments.push({
      type: 'math',
      content: math.trim(),
      display: found.delimiter.display,
    });

    pos = closeIdx + found.delimiter.right.length;
  }

  return segments;
}
