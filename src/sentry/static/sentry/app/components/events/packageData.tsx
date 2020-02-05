import React from 'react';

import {Event} from 'app/types';
import {t} from 'app/locale';
import ClippedBox from 'app/components/clippedBox';
import ErrorBoundary from 'app/components/errorBoundary';
import EventDataSection from 'app/components/events/eventDataSection';
import KeyValueList from 'app/components/events/interfaces/keyValueList';
import SentryTypes from 'app/sentryTypes';

type Props = {
  event: Event;
};

class EventPackageData extends React.Component<Props> {
  static propTypes = {
    event: SentryTypes.Event.isRequired,
  };

  shouldComponentUpdate(nextProps: Props) {
    return this.props.event.id !== nextProps.event.id;
  }

  render() {
    let longKeys: boolean, title: string;

    switch (this.props.event.platform) {
      case 'csharp':
        longKeys = true;
        title = t('Assemblies');
        break;
      default:
        longKeys = false;
        title = t('Packages');
    }

    console.log('title', title);
    return (
      <EventDataSection type="packages" title={title}>
        <ClippedBox>
          <ErrorBoundary mini>
            <KeyValueList
              completeData={this.props.event}
              data={this.props.event.packages || {}}
              longKeys={longKeys}
            />
          </ErrorBoundary>
        </ClippedBox>
      </EventDataSection>
    );
  }
}

export default EventPackageData;
