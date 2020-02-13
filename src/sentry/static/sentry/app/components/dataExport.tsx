import React from 'react';
import AsyncComponent from 'app/components/asyncComponent';
import styled from '@emotion/styled';
import space from 'app/styles/space';
import {Organization} from 'app/types';
import withOrganization from 'app/utils/withOrganization';
import {t} from 'app/locale';

type DataExportPayload = {
  query_type: number;
  query_info: any; // TODO(ts): Formalize different possible payloads
};

type Props = {
  organization: Organization;
  payload: DataExportPayload;
};

type State = {
  inProgress: boolean;
  dataExportId?: number;
};

const Button = styled('button')`
  margin-left: ${space(1)};
`;

class DataExport extends AsyncComponent<
  Props & AsyncComponent['props'],
  State & AsyncComponent['state']
> {
  async startDataExport() {
    const {
      organization: {slug},
      payload,
    } = this.props;
    const {id: dataExportId} = await this.api.requestPromise(
      `/organizations/${slug}/data-export/`,
      {
        method: 'POST',
        data: payload,
      }
    );
    this.setState({inProgress: true, dataExportId});
  }

  render() {
    const {
      organization: {slug},
    } = this.props;
    const {inProgress, dataExportId} = this.state;
    return (
      <React.Fragment>
        {inProgress && dataExportId ? (
          <a href={`/organizations/${slug}/data-export/${dataExportId}/`}>
            <Button style={{marginLeft: 10}} className="btn btn-default btn-sm">
              {t('Click for Progress...')}
            </Button>
          </a>
        ) : (
          <Button
            className="btn btn-default btn-sm"
            onClick={() => this.startDataExport()}
          >
            {t('Export All to CSV')}
          </Button>
        )}
      </React.Fragment>
    );
  }
}

export default withOrganization(DataExport);
