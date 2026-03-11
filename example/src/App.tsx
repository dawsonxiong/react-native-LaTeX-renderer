import { useMemo, useCallback } from 'react';
import { KaTeXAutoHeightWebView, createKaTeXHTML } from '../../src/index';
import { View, StyleSheet } from 'react-native';

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
    <View style={styles.container}>
      <KaTeXAutoHeightWebView
        source={src}
        onHeightChange={handleHeightChange}
        containerStyle={viewContainerStyle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 80,
  },
});
