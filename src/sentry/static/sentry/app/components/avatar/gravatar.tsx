import PropTypes from 'prop-types';
import React from 'react';
import qs from 'query-string';
import styled from 'react-emotion';

import ConfigStore from 'app/stores/configStore';

import {imageStyle} from './styles';

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  remoteSize?: number;
  gravatarId?: string;
  placeholder?: string;
  /**
   * Should avatar be round instead of a square
   */
  round?: boolean;
};

type State = {
  MD5: CryptoJS.Hashes['MD5'] | null;
};

class Gravatar extends React.Component<Props, State> {
  static propTypes = {
    remoteSize: PropTypes.number,
    gravatarId: PropTypes.string,
    placeholder: PropTypes.string,
    round: PropTypes.bool,
  };

  state: State = {
    MD5: null,
  };

  async componentDidMount() {
    this._isMounted = true;

    const mod = await import(/* webpackChunkName: "MD5" */ 'crypto-js/md5');

    // eslint-disable-next-line react/no-did-mount-set-state
    this._isMounted && this.setState({MD5: mod.default});
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  _isMounted = false;

  render() {
    const {gravatarId, remoteSize, placeholder, ...props} = this.props;
    const {MD5} = this.state;

    if (!MD5 || !gravatarId) {
      return null;
    }

    const query = {
      s: remoteSize || undefined,
      // If gravatar is not found we need the request to return an error,
      // otherwise error handler will not trigger and avatar will not have a
      // display a LetterAvatar backup.
      d: placeholder || '404',
    };

    const baseUrl = ConfigStore.getConfig().gravatarBaseUrl;
    const hash = MD5(gravatarId);

    const src = `${baseUrl}/avatar/${hash}?${qs.stringify(query)}`;

    return <Image src={src} {...props} />;
  }
}

export default Gravatar;

const Image = styled('img')<{round?: boolean}>`
  ${imageStyle};
`;
