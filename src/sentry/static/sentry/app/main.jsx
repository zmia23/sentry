import {unstable_Profiler as Profiler} from 'react';
import {hot} from 'react-hot-loader/root'; // This needs to come before react
import React from 'react';
import {Router, browserHistory} from 'react-router';

import routes from 'app/routes';
import {loadPreferencesState} from 'app/actionCreators/preferences';

class Main extends React.Component {
  componentDidMount() {
    loadPreferencesState();
  }

  handleRender = (...args) => {
    console.log('handle render', ...args);
  };

  render() {
    return (
      <Profiler id="Application" onRender={this.handleRender}>
        <Router history={browserHistory}>{routes()}</Router>
      </Profiler>
    );
  }
}

export default hot(Main);
