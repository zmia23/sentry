import PropTypes from 'prop-types';
import React from 'react';
import queryString from 'query-string';

import ErrorBoundary from 'app/components/errorBoundary';
import ExceptionContent from 'app/components/events/interfaces/exceptionContent';
import RawExceptionContent from 'app/components/events/interfaces/rawExceptionContent';
import SentryTypes from 'app/sentryTypes';
import StacktraceContent from 'app/components/events/interfaces/stacktraceContent';
import rawStacktraceContent from 'app/components/events/interfaces/rawStacktraceContent';

class SearchOnStackoverflow extends React.Component {
  componentDidMount() {
    const exc = this.props.values[0];
    const {type} = this.props;

    const content =
      exc.stacktrace &&
      rawStacktraceContent(
        type === 'original' ? exc.stacktrace : exc.rawStacktrace,
        this.props.platform,
        exc
      );

    const query = {
      q: String(content).split(/\n/)[0],
    };

    window.location.href = `https://stackoverflow.com/search?${queryString.stringify(
      query
    )}`;
  }

  render() {
    return null;
  }
}

class CrashContent extends React.Component {
  static propTypes = {
    event: SentryTypes.Event.isRequired,
    stackView: PropTypes.string.isRequired,
    projectId: PropTypes.string.isRequired,
    newestFirst: PropTypes.bool.isRequired,
    stackType: PropTypes.string,
    exception: PropTypes.object,
    stacktrace: PropTypes.object,
  };

  renderException = () => {
    const {event, stackView, stackType, newestFirst, exception, projectId} = this.props;

    switch (stackView) {
      case 'raw': {
        return (
          <RawExceptionContent
            eventId={event.id}
            projectId={projectId}
            type={stackType}
            values={exception.values}
            platform={event.platform}
          />
        );
      }

      case 'search_on_stackoverflow': {
        return (
          <SearchOnStackoverflow
            eventId={event.id}
            projectId={projectId}
            type={stackType}
            values={exception.values}
            platform={event.platform}
          />
        );
      }

      default: {
        return (
          <ExceptionContent
            type={stackType}
            view={stackView}
            values={exception.values}
            platform={event.platform}
            newestFirst={newestFirst}
          />
        );
      }
    }
  };

  renderStacktrace = () => {
    const {event, stackView, newestFirst, stacktrace} = this.props;
    return stackView === 'raw' ? (
      <pre className="traceback plain">
        {rawStacktraceContent(stacktrace, event.platform)}
      </pre>
    ) : (
      <StacktraceContent
        data={stacktrace}
        className="no-exception"
        includeSystemFrames={stackView === 'full'}
        platform={event.platform}
        newestFirst={newestFirst}
      />
    );
  };

  render() {
    if (this.props.exception) {
      return <ErrorBoundary mini>{this.renderException()}</ErrorBoundary>;
    }
    if (this.props.stacktrace) {
      return <ErrorBoundary mini>{this.renderStacktrace()}</ErrorBoundary>;
    }
    return null;
  }
}

export default CrashContent;
