import React, { useMemo } from 'react';
import { View, Text, type ViewStyle, type StyleProp } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { parseLatex } from './mathParser';
import { texToSvg } from './mathjax';

export interface MathViewProps {
  /** String containing text and/or LaTeX math delimited by $, $$, \( \), \[ \] */
  math: string;
  /** Base font size in pixels (default: 16) */
  fontSize?: number;
  /** Text and math color (default: 'black') */
  color?: string;
  /** Container style */
  style?: StyleProp<ViewStyle>;
  /** Called when a LaTeX segment fails to render */
  onError?: (error: Error, latex: string) => void;
  /** Show colored borders around each segment for debugging layout */
  debug?: boolean;
}

// MathJax uses "ex" units. 1ex ≈ x-height of the font ≈ 0.4423em.
// This multiplier converts ex → px given a fontSize in px.
const EX_TO_PX = 0.4423;

/**
 * Parse width/height in "ex" units and vertical-align from MathJax SVG output.
 */
function parseSvgDimensions(svg: string): {
  widthEx: number;
  heightEx: number;
  verticalAlignEx: number;
} {
  const wMatch = svg.match(/width="([\d.]+)ex"/);
  const hMatch = svg.match(/height="([\d.]+)ex"/);
  const vMatch = svg.match(/vertical-align:\s*([-\d.]+)ex/);
  return {
    widthEx: wMatch?.[1] ? parseFloat(wMatch[1]) : 0,
    heightEx: hMatch?.[1] ? parseFloat(hMatch[1]) : 0,
    verticalAlignEx: vMatch?.[1] ? parseFloat(vMatch[1]) : 0,
  };
}

/**
 * Check if MathJax produced an error SVG and extract the message.
 */
function extractMathJaxError(svg: string): string | null {
  const match = svg.match(/data-mjx-error="([^"]*)"/);
  return match?.[1] ?? null;
}

interface SvgSegment {
  type: 'svg';
  xml: string;
  display: boolean;
  widthPx: number;
  heightPx: number;
  verticalAlignPx: number;
  key: number;
}

interface TextSegment {
  type: 'text';
  content: string;
  key: number;
}

interface ErrorSegment {
  type: 'error';
  content: string;
  key: number;
}

type RenderSegment = SvgSegment | TextSegment | ErrorSegment;

export const MathView = React.memo(function MathView({
  math,
  fontSize = 16,
  color = 'black',
  style,
  onError,
  debug = false,
}: MathViewProps) {
  const rendered = useMemo(() => {
    const segments = parseLatex(math);
    const result: RenderSegment[] = [];
    const pxPerEx = fontSize * EX_TO_PX;

    segments.forEach((seg, i) => {
      if (seg.type === 'text') {
        result.push({ type: 'text', content: seg.content, key: i });
      } else {
        try {
          const svg = texToSvg(seg.content, {
            displayMode: seg.display,
            color,
          });

          // Detect MathJax error SVGs (e.g. unknown environments)
          const mjxError = extractMathJaxError(svg);
          if (mjxError) {
            onError?.(new Error(mjxError), seg.content);
            result.push({ type: 'error', content: seg.content, key: i });
            return;
          }

          const dims = parseSvgDimensions(svg);
          result.push({
            type: 'svg',
            xml: svg,
            display: seg.display,
            widthPx: dims.widthEx * pxPerEx,
            heightPx: dims.heightEx * pxPerEx,
            verticalAlignPx: dims.verticalAlignEx * pxPerEx,
            key: i,
          });
        } catch (e) {
          const error = e instanceof Error ? e : new Error(String(e));
          onError?.(error, seg.content);
          result.push({ type: 'error', content: seg.content, key: i });
        }
      }
    });

    return result;
  }, [math, fontSize, color, onError]);

  const debugText = debug
    ? {
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.5)',
        backgroundColor: 'rgba(59,130,246,0.08)',
      }
    : undefined;
  const debugInlineSvg = debug
    ? {
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.5)',
        backgroundColor: 'rgba(239,68,68,0.08)',
      }
    : undefined;
  const debugDisplaySvg = debug
    ? {
        borderWidth: 1,
        borderColor: 'rgba(34,197,94,0.5)',
        backgroundColor: 'rgba(34,197,94,0.08)',
      }
    : undefined;

  return (
    <View style={[styles.container, debug && styles.debugContainer, style]}>
      {rendered.map((seg) => {
        if (seg.type === 'text') {
          return (
            <Text key={seg.key} style={[{ fontSize, color }, debugText]}>
              {seg.content}
            </Text>
          );
        }

        if (seg.type === 'error') {
          return (
            <Text key={seg.key} style={{ fontSize, color: 'red' }}>
              {seg.content}
            </Text>
          );
        }

        // Display math: scale to fit container width
        if (seg.display) {
          const aspectRatio = seg.widthPx / seg.heightPx;
          return (
            <View
              key={seg.key}
              style={[styles.displayContainer, debugDisplaySvg]}
            >
              <View
                style={{ width: seg.widthPx, maxWidth: '100%', aspectRatio }}
              >
                <SvgXml xml={seg.xml} width="100%" height="100%" />
              </View>
            </View>
          );
        }

        // Inline math: fixed pixel size
        return (
          <View
            key={seg.key}
            style={[{ marginBottom: seg.verticalAlignPx }, debugInlineSvg]}
          >
            <SvgXml xml={seg.xml} width={seg.widthPx} height={seg.heightPx} />
          </View>
        );
      })}
    </View>
  );
});

const styles = {
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  } as ViewStyle,
  debugContainer: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    borderStyle: 'dashed',
  } as ViewStyle,
  displayContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 8,
  } as ViewStyle,
};
