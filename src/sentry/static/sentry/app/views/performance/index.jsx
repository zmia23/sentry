import React from 'react';
import PropTypes from 'prop-types';
import {Link} from 'react-router';
import styled from 'react-emotion';

import space from 'app/styles/space';

import GlobalSelectionHeader from 'app/components/organizations/globalSelectionHeader';
import withGlobalSelection from 'app/utils/withGlobalSelection';
import withOrganization from 'app/utils/withOrganization';
import withTeamsForUser from 'app/utils/withTeamsForUser';
import AsyncView from 'app/views/asyncView';
import SentryTypes from 'app/sentryTypes';
import Duration from 'app/components/duration';
import NoProjectMessage from 'app/components/noProjectMessage';
import PageHeading from 'app/components/pageHeading';
import Pagination from 'app/components/pagination';
import {PageContent, PageHeader} from 'app/styles/organization';
import {Panel, PanelBody, PanelItem, PanelHeader} from 'app/components/panels';
import {t} from 'app/locale';
import floatFormat from 'app/utils/floatFormat';

const Layout = styled('div')`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
  grid-column-gap: ${space(1.5)};
  width: 100%;
  align-items: center;
  grid-template-areas: 'project-name errors rpm p75 p95 apdex';

  @media (max-width: ${p => p.theme.breakpoints[0]}) {
    grid-template-columns: 5fr 1fr;
    grid-template-areas: 'project-name errors';
  }
`;

const ProjectColumn = styled('div')`
  grid-area: project-name;
  overflow: hidden;
`;

const P75Column = styled('div')`
  grid-area: p75;
  text-align: right;

  @media (max-width: ${p => p.theme.breakpoints[0]}) {
    display: none;
  }
`;
const P95Column = styled('div')`
  grid-area: p95;
  text-align: right;

  @media (max-width: ${p => p.theme.breakpoints[0]}) {
    display: none;
  }
`;
const ApdexColumn = styled('div')`
  grid-area: apdex;
  text-align: right;

  @media (max-width: ${p => p.theme.breakpoints[0]}) {
    display: none;
  }
`;
const RpmColumn = styled('div')`
  grid-area: rpm;
  text-align: right;

  @media (max-width: ${p => p.theme.breakpoints[0]}) {
    display: none;
  }
`;
const ErrorsColumn = styled('div')`
  grid-area: errors;
  text-align: right;
`;

class PerformanceContainer extends AsyncView {
  static propTypes = {
    organization: SentryTypes.Organization,
    teams: PropTypes.array,
  };

  getTitle() {
    return 'Performance';
  }

  getEndpoints() {
    const {organization} = this.props;
    return [
      [
        'results',
        `/organizations/${
          organization.slug
        }/eventsv2/?statsPeriod=14d&field=project.name&field=count(id)&field=p75&field=p95&field=apdex&sort=p95&per_page=50&query=event.type%3Atransaction`,
      ],
    ];
  }

  renderStreamBody() {
    const {organization} = this.props;
    // TODO(dcramer): major issue here is that we always need to show all projects
    // even when there is no data for them. We also can't sort them by just querying discover
    return this.state.results.data.map(row => {
      return (
        <PanelItem key={row.project}>
          <Layout>
            <ProjectColumn>
              <Link
                to={`/organizations/${organization.slug}/performance/${
                  row['project.name']
                }/`}
              >
                {row['project.name']}
              </Link>
            </ProjectColumn>
            <ErrorsColumn>{''}</ErrorsColumn>
            <RpmColumn>{row.rpm || ''}</RpmColumn>
            <P75Column>
              <Duration seconds={row.p75 / 1000} fixedDigits={2} abbreviation />
            </P75Column>
            <P95Column>
              <Duration seconds={row.p95 / 1000} fixedDigits={2} abbreviation />
            </P95Column>
            <ApdexColumn>{floatFormat(row.apdex, 3)}</ApdexColumn>
          </Layout>
        </PanelItem>
      );
    });
  }

  renderBody() {
    const {organization} = this.props;
    return (
      <React.Fragment>
        <GlobalSelectionHeader organization={organization} />
        <PageContent>
          <NoProjectMessage organization={organization}>
            <PageHeader>
              <PageHeading>{t('Performance')}</PageHeading>
            </PageHeader>
            <div>
              <Panel>
                <PanelHeader>
                  <Layout>
                    <ProjectColumn>{t('Project')}</ProjectColumn>
                    <ErrorsColumn>{t('Errors')}</ErrorsColumn>
                    <RpmColumn>{t('RPM')}</RpmColumn>
                    <P75Column>{t('p75')}</P75Column>
                    <P95Column>{t('p95')}</P95Column>
                    <ApdexColumn>{t('Apdex')}</ApdexColumn>
                  </Layout>
                </PanelHeader>
                <PanelBody>{this.renderStreamBody()}</PanelBody>
              </Panel>
              <Pagination pageLinks={this.state.resultsPageLinks} />
            </div>
          </NoProjectMessage>
        </PageContent>
      </React.Fragment>
    );
  }
}

export default withGlobalSelection(
  withOrganization(withTeamsForUser(PerformanceContainer))
);
export {PerformanceContainer};
