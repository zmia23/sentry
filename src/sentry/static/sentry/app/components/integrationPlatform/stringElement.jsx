import PropTypes from 'prop-types';
import React from 'react';

import {t} from 'app/locale';

export default class StringElement extends React.Component {
  static propTypes = {
    render: PropTypes.string,
  };

  render() {
    const {text} = this.props;
    return <React.Fragment>{text}</React.Fragment>;
  }
}
