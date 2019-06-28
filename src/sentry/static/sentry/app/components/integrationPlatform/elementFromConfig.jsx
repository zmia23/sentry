import PropTypes from 'prop-types';
import React from 'react';

import PanelElement from './panelElement';
import StringElement from './stringElement';

export default class ElementFromConfig extends React.Component {
  static propTypes = {
    element: PropTypes.shape({
      name: PropTypes.string,
      type: PropTypes.oneOf([
        'panel',
        'string',
      ]),
    }),
  };

  render() {
    const {element, ...otherProps} = this.props;
    const props = {
      ...otherProps,
      ...element,
    };

    switch (element.type) {
      case 'panel':
        return <PanelElement {...props} />;
      case 'string':
        return <StringElement {...props} />;
      default:
        return null;
    }
  }
}
