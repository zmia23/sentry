import {Box, Flex} from 'grid-emotion';
import PropTypes from 'prop-types';
import React from 'react';

import {Panel, PanelBody, PanelHeader, PanelItem} from 'app/components/panels';
import {t} from 'app/locale';

import ElementFromConfig from './elementFromConfig';

export default class PanelElement extends React.Component {
  static propTypes = {
    header: PropTypes.object,
    body: PropTypes.array,
  };

  renderHeader() {
    const {headers} = this.props;

    return (
      <PanelHeader>
        {
          headers.map(header => {
            return (
              <Flex key={header.text}>
                <Box>{t(header.text)}</Box>
              </Flex>
            );
          })
        }
      </PanelHeader>
    );
  }

  renderBody() {
    const {body} = this.props;
    console.log(body);

    return (
      <PanelBody>
        {
          body.map((row, i) => {
            return (
              <PanelItem key={i} justify="space-between">
                {
                  row.map(col => {
                    return (
                      <Flex key={`${col.type}-${col.name}`}>
                        <Box>
                          <ElementFromConfig
                            element={col}
                          />
                        </Box>
                      </Flex>
                    );
                  })
                }
              </PanelItem>
            );
          })
        }
      </PanelBody>
    );
  }

  render() {
    return (
      <Panel>
        {this.renderHeader()}
        {this.renderBody()}
      </Panel>
    );
  }
}
