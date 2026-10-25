import { Component, type PropsWithChildren } from 'react';
import { View } from 'react-native';
import { QueryError } from '~/components/ui/QueryError';

export class MapErrorBoundary extends Component<
  PropsWithChildren,
  { failed: boolean; attempt: number }
> {
  state = { failed: false, attempt: 0 };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <QueryError
            retry={() => this.setState((s) => ({ failed: false, attempt: s.attempt + 1 }))}
          />
        </View>
      );
    return (
      <View key={this.state.attempt} style={{ position: 'absolute', inset: 0 }}>
        {this.props.children}
      </View>
    );
  }
}
