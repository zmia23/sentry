import React from 'react';
import SentryTypes from 'app/sentryTypes';

import EventDataSection from 'app/components/events/eventDataSection';
import Annotated from 'app/components/events/meta/annotated';
import {t} from 'app/locale';

class EventSdk extends React.Component {
  static propTypes = {
    event: SentryTypes.Event.isRequired,
  };

  render() {
    const data = this.props.event.sdk;

    return (
      <EventDataSection event={event} type="sdk" title={t('SDK')} wrapTitle>
        <table className="table key-value">
          <tbody>
            <tr key="name">
              <td className="key">{t('Name')}</td>
              <td className="value">
                <pre>
                  <Annotated object={data} prop="name">
                    {value => value}
                  </Annotated>
                </pre>
              </td>
            </tr>
            <tr key="version">
              <td className="key">{t('Version')}</td>
              <td className="value">
                <pre>
                  <Annotated object={data} prop="version">
                    {value => value}
                  </Annotated>
                </pre>
              </td>
            </tr>
          </tbody>
        </table>
      </EventDataSection>
    );
  }
}

export default EventSdk;
