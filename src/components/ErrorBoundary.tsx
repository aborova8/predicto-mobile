import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  children: ReactNode;
  onSignOut?: () => void;
}

interface State {
  error: Error | null;
}

// Root-level catch for render errors. RN ships its own LogBox in dev, but a
// production crash white-screens with no recovery — this gives the user a
// way back. Uses hardcoded colors instead of theme tokens so it still
// renders if the theme provider itself is the one that threw.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
    // TODO: forward to Sentry / crash reporting once telemetry is wired.
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;
    const message = this.state.error.message || 'Something unexpected happened.';

    return (
      <View style={styles.root}>
        <Text style={styles.title}>Something broke.</Text>
        <Text style={styles.message}>{message}</Text>
        <Pressable style={styles.primary} onPress={this.reset}>
          <Text style={styles.primaryText}>Try again</Text>
        </Pressable>
        {this.props.onSignOut ? (
          <Pressable
            style={styles.secondary}
            onPress={() => {
              this.reset();
              this.props.onSignOut?.();
            }}
          >
            <Text style={styles.secondaryText}>Sign out</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0b0b0e',
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  message: {
    color: '#cdcfd6',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  primary: {
    backgroundColor: '#c8ff00',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
  },
  primaryText: {
    color: '#06091A',
    fontWeight: '700',
    fontSize: 15,
  },
  secondary: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#25272f',
  },
  secondaryText: {
    color: '#e9e9ee',
    fontWeight: '600',
    fontSize: 14,
  },
});
