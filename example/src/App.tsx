import { useMemo, useCallback } from 'react';
import {
  KaTeXAutoHeightWebView,
  createKaTeXHTML,
  MathView,
} from '../../src/index';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const testing = `
  This is a test latex equation:
  $$
  I(\\lambda)
  =
  \\int_0^{\\infty} e^{-\\lambda x^2}\\cos(x)\\,dx
  \\sim
  \\sum_{k=0}^{\\infty}
  \\frac{(-1)^k (2k)!}{2^{2k+1} k!}
  \\lambda^{-k-\\tfrac12}
  $$
  End of test latex equation.
`;

const containerStyles = {
  'width': '75%',
  'font-size': '15px',
  'color': 'pink',
  'background-color': 'green',
  'border': '1px solid black',
} as const;

const latexStyles = {
  'color': 'white',
  'background-color': 'purple',
  'border': '1px solid red',
} as const;

const viewContainerStyle = {
  width: '100%' as const,
  backgroundColor: 'yellow',
  borderWidth: '1',
  borderColor: 'orange',
};

export default function HomeScreen() {
  const src = useMemo(
    () => createKaTeXHTML(testing, containerStyles, latexStyles),
    []
  );

  const handleHeightChange = useCallback((height: number) => {
    console.log('New height:', height);
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* WebView approach (KaTeX) */}
      <Text style={styles.heading}>WebView (KaTeX)</Text>
      <KaTeXAutoHeightWebView
        source={src}
        onHeightChange={handleHeightChange}
        containerStyle={viewContainerStyle}
      />

      <View style={styles.divider} />

      {/* Native SVG approach (MathView) */}
      <Text style={styles.heading}>Native SVG (MathView)</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Mixed text + inline math</Text>
        <MathView
          math="Einstein showed $E = mc^2$ and the Lorentz factor $\gamma = \frac{1}{\sqrt{1 - v^2/c^2}}$"
          fontSize={16}
          color="black"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Display math</Text>
        <MathView
          math="$$\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$"
          fontSize={18}
          color="#333"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Same equation as WebView above</Text>
        <MathView math={testing} fontSize={15} color="black" />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Color + large font</Text>
        <MathView
          math="$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$"
          fontSize={22}
          color="blue"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Multiple inline in sequence</Text>
        <MathView
          math="Let $a = 1$, $b = 2$, and $c = 3$, then $a + b = c$."
          fontSize={16}
          color="black"
        />
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 80,
    paddingHorizontal: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 24,
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
  },
});
