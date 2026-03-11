import { useState, useRef, useCallback, useMemo, memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { renderLatexContent } from './parser';

type LatexStyle =
  | 'border'
  | 'font-size'
  | 'line-height'
  | 'color'
  | 'background-color';
type LatexStyleMap = Partial<Record<LatexStyle, string>>;

type InnerContainerStyle =
  | 'padding'
  | 'border'
  | 'font-size'
  | 'line-height'
  | 'width'
  | 'height'
  | 'color'
  | 'background-color';
type InnerContainerMap = Partial<Record<InnerContainerStyle, string>>;

type ContainerStyle =
  | 'padding'
  | 'width'
  | 'backgroundColor'
  | 'borderWidth'
  | 'borderColor';
type ContainerMap = Partial<Record<ContainerStyle, string>>;

const CAMEL_TO_KEBAB_RE = /([a-z0-9]|(?=[A-Z]))([A-Z])/g;

/**
 * Height calculation script for WebView.
 * Since math is pre-rendered, only need to measure the static content.
 */
const HEIGHT_CALCULATION_SCRIPT = `
  (function() {
    let lastSentHeight = 0;
    let rafId = null;
    const HEIGHT_THRESHOLD = 5;

    const calculateHeight = () => {
      const scrollHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      const bodyRect = document.body.getBoundingClientRect();
      const rectHeight = bodyRect.height + window.pageYOffset;
      return Math.max(scrollHeight, rectHeight);
    };

    const sendHeightUpdate = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        try {
          const height = calculateHeight();
          if (Math.abs(height - lastSentHeight) > HEIGHT_THRESHOLD) {
            lastSentHeight = height;
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'height',
              height: Math.ceil(height),
              timestamp: Date.now()
            }));
          }
        } catch (error) {
          console.error('Height calculation error:', error);
        }
        rafId = null;
      });
    };

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => sendHeightUpdate());
      ro.observe(document.body);
      ro.observe(document.documentElement);
    } else {
      new MutationObserver(() => sendHeightUpdate()).observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class'],
        characterData: false
      });
      window.addEventListener('resize', sendHeightUpdate);
    }

    sendHeightUpdate();
    return true;
  })();
  true;
`;

/**
 * Auto-height WebView component optimized for KaTeX content.
 */
const KaTeXAutoHeightWebView = memo(
  ({
    source,
    onHeightChange,
    minHeight = 50,
    containerStyle,
    ...webViewProps
  }: {
    source: string;
    onHeightChange?: (height: number) => void;
    minHeight?: number;
    containerStyle?: ContainerMap;
    [key: string]: any;
  }) => {
    const [height, setHeight] = useState(minHeight);
    const webViewRef = useRef(null);
    const lastHeightRef = useRef(minHeight);

    const handleMessage = useCallback(
      (event: any) => {
        try {
          const data = JSON.parse(event.nativeEvent.data);

          if (data.type === 'height' && data.height) {
            const newHeight = Math.max(data.height, minHeight);

            if (Math.abs(newHeight - lastHeightRef.current) > 1) {
              lastHeightRef.current = newHeight;
              setHeight(newHeight);

              if (onHeightChange) {
                onHeightChange(newHeight);
              }
            }
          }
        } catch (error) {
          console.error('Error parsing WebView message:', error);
        }
      },
      [minHeight, onHeightChange]
    );

    const resolvedContainerStyle = useMemo(() => {
      if (!containerStyle) return undefined;
      return Object.entries(containerStyle).reduce(
        (acc: Record<string, any>, [key, value]) => {
          if (
            typeof value === 'string' &&
            key.includes('borderWidth') &&
            !isNaN(parseFloat(value))
          ) {
            acc[key] = parseFloat(value);
          } else {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, any>
      );
    }, [containerStyle]);

    const webViewSource = useMemo(() => ({ html: source }), [source]);

    return (
      <View style={[styles.container, { height }, resolvedContainerStyle]}>
        <WebView
          ref={webViewRef}
          source={webViewSource}
          injectedJavaScript={HEIGHT_CALCULATION_SCRIPT}
          onMessage={handleMessage}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          {...webViewProps}
          style={styles.webview}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  webview: {
    backgroundColor: 'transparent',
  },
});

/**
 * Generate HTML with pre-rendered KaTeX math.
 * Math is rendered at call time via katex.renderToString(),
 * so the WebView only needs to load CSS for fonts — no JS execution.
 */
const createKaTeXHTML = (
  latexContent: string,
  containerStyles?: InnerContainerMap,
  latexStyles?: LatexStyleMap
) => {
  const renderedContent = renderLatexContent(latexContent);

  const containerCSS = formatStyles(formatContainerStyles(containerStyles));
  const latexCSS = formatStyles(formatLatexStyles(latexStyles));

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css" integrity="sha384-5TcZemv2l/9On385z///+d7MSYlvIEw9FuZTIdZ14vJLqWphw7e7ZPuOiCHJcFCP" crossorigin="anonymous">
        <style>
          * {
            margin: 0 !important;
            padding: 0 !important;
          }

          #outer-wrapper {
            ${containerCSS}
          }

          #container {
            width: 100% !important;
            box-sizing: border-box !important;
            background-color: transparent !important;
          }

          .katex-display {
            overflow-x: auto !important;
            overflow-y: visible !important;
          }

          .katex-html {
            max-width: 100% !important;
            overflow-x: auto !important;
          }

          .katex {
            flex-wrap: wrap !important;
            overflow-wrap: break-word !important;
            max-width: 100% !important;
            white-space: normal !important;

            ${latexCSS}
          }
        </style>
      </head>
      <body>
        <div id="outer-wrapper">
          <div id="container">
            ${renderedContent}
          </div>
        </div>
      </body>
    </html>
  `;
};

const formatStyles = (styleMap: Record<string, string>): string => {
  return Object.entries(styleMap)
    .map(([key, value]) => {
      const cssKey = key.replace(CAMEL_TO_KEBAB_RE, '$1-$2').toLowerCase();
      return `${cssKey}: ${value};`;
    })
    .join('\n            ');
};

const formatContainerStyles = (
  s?: InnerContainerMap
): Record<string, string> => {
  const defaults: Record<string, string> = {
    'font-family':
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'font-size': '16px',
    'line-height': '1.6',
    'padding': '8px',
    'background-color': 'transparent',
    'color': 'black',
  };

  if (!s || typeof s !== 'object' || Array.isArray(s)) {
    return {};
  }

  return { ...defaults, ...s };
};

const formatLatexStyles = (s?: LatexStyleMap): Record<string, string> => {
  const defaults: Record<string, string> = {
    'color': 'black',
    'font-size': '1em',
    'line-height': '2',
  };

  if (!s || typeof s !== 'object' || Array.isArray(s)) {
    return {};
  }

  return { ...defaults, ...s };
};

export { KaTeXAutoHeightWebView, createKaTeXHTML };
