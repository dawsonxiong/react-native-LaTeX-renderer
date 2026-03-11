import { MathView } from '../../src/index';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>React Native LaTeX Renderer</Text>

      <View style={styles.card}>
        <MathView
          math="The Cauchy-Schwarz inequality states that $$\left(\sum_{k=1}^n a_k b_k\right)^2 \leq \left(\sum_{k=1}^n a_k^2\right)\left(\sum_{k=1}^n b_k^2\right)$$ which holds for all real sequences $a_k$ and $b_k$."
          fontSize={16}
          color="#1a1a1a"
        />
      </View>

      <View style={styles.card}>
        <MathView
          math="$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$"
          fontSize={20}
          color="#2563eb"
        />
      </View>

      <View style={styles.card}>
        <MathView
          math="Maxwell's equations: $\nabla \cdot \mathbf{E} = \frac{\rho}{\varepsilon_0}$ and $\nabla \times \mathbf{B} = \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}$"
          fontSize={15}
          color="#1a1a1a"
          style={{ rowGap: 6 }}
        />
      </View>

      <View style={styles.card}>
        <MathView
          math="$$\begin{pmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & 1 \end{pmatrix} \begin{pmatrix} x \\ y \\ z \end{pmatrix} = \begin{pmatrix} x \\ y \\ z \end{pmatrix}$$"
          fontSize={16}
          color="#1a1a1a"
        />
      </View>

      <View style={styles.card}>
        <MathView
          math="$$\int_0^\infty e^{-x^2}\,dx = \frac{\sqrt{\pi}}{2}$$"
          fontSize={20}
          color="#16a34a"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5e5',
  },
});
