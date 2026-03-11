import { mathjax } from 'mathjax-full/js/mathjax';
import { TeX } from 'mathjax-full/js/input/tex';
import { SVG } from 'mathjax-full/js/output/svg';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages';

export interface TexToSvgOptions {
  displayMode?: boolean;
  color?: string;
}

let adaptor: ReturnType<typeof liteAdaptor> | null = null;
let html: ReturnType<typeof mathjax.document> | null = null;

function ensureInitialized() {
  if (adaptor && html) return;

  adaptor = liteAdaptor();
  RegisterHTMLHandler(adaptor);

  html = mathjax.document('', {
    InputJax: new TeX({ packages: AllPackages }),
    OutputJax: new SVG({ fontCache: 'none' }),
  });
}

/**
 * Convert a TeX string to an SVG XML string using MathJax.
 * Lazily initializes MathJax on first call.
 */
export function texToSvg(tex: string, options: TexToSvgOptions = {}): string {
  const { displayMode = false, color } = options;

  ensureInitialized();

  const node = html!.convert(tex, { display: displayMode });
  let svg = adaptor!.outerHTML(node);

  // Strip the surrounding <mjx-container> wrapper that MathJax adds
  const svgStart = svg.indexOf('<svg');
  const svgEnd = svg.lastIndexOf('</svg>');
  if (svgStart !== -1 && svgEnd !== -1) {
    svg = svg.slice(svgStart, svgEnd + 6);
  }

  // Apply color by setting fill on the root SVG element
  if (color) {
    svg = svg.replace('<svg', `<svg fill="${color}"`);
  }

  return svg;
}
