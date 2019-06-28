import PropTypes from 'prop-types';
import React from 'react';

import EventDataSection from 'app/components/events/eventDataSection';
import {Panel, PanelBody, PanelHeader} from 'app/components/panels';
import {t} from 'app/locale';

import ElementFromConfig from './elementFromConfig';

class EventInfoPane extends React.Component {
  static propTypes = {
    component: PropTypes.object,
  };

  render() {
    const {component} = this.props;
    const {elements = [], title} = component.schema;
    const normalizedTitle = title.text.toLowerCase().split(' ').join('_');

    return (
      <EventDataSection
        event={this.props.event}
        type={normalizedTitle}
        title={t(title.text)}
      >
        {
          elements.map(element => {
            return (
              <ElementFromConfig
                key={`${element.type}-${element.name}`}
                element={element}
              />
            );
          })
        }
      </EventDataSection>
    );
  }
}

export default EventInfoPane;
