import hoistStatics from 'hoist-non-react-statics';
import React from 'react';

export default function deferComponentRender(WrappedComponent: any) {
  class DeferredRenderWrapper extends React.Component {
    state: { shouldRender: boolean };

    constructor(props, context) {
      super(props, context);
      this.state = { shouldRender: false };
    }

    componentDidMount() {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => this.setState({ shouldRender: true }));
      });
    }

    render() {
      return this.state.shouldRender ? <WrappedComponent {...this.props} /> : null;
    }
  }

  return hoistStatics(DeferredRenderWrapper, WrappedComponent);
}
