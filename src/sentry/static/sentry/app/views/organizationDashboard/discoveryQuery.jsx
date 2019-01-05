import PropTypes from 'prop-types';
import React from 'react';

import {getPeriod} from 'app/utils/getPeriod';
import SentryTypes from 'app/sentryTypes';
import createQueryBuilder from 'app/views/organizationDiscover/queryBuilder';
import withGlobalSelection from 'app/utils/withGlobalSelection';
import withOrganization from 'app/utils/withOrganization';

class DiscoverQuery extends React.Component {
  static propTypes = {
    includePreviousPeriod: PropTypes.bool,
    organization: SentryTypes.Organization,
    selection: SentryTypes.GlobalSelection,
    queries: PropTypes.arrayOf(SentryTypes.DiscoverQuery),
  };

  constructor(props) {
    super(props);

    this.state = {
      results: null,
    };

    this.queryBuilders = props.queries.map(query =>
      createQueryBuilder(this.getQuery(query), props.organization)
    );
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    if (prevProps === this.props) {
      return;
    }

    this.fetchData();
  }

  getQuery(query) {
    const {includePreviousPeriod} = this.props;
    const {datetime, ...selection} = this.props.selection;
    const {start, end, statsPeriod} = getPeriod(datetime, {
      shouldDoublePeriod: includePreviousPeriod,
    });

    return {
      ...query,
      ...selection,
      start,
      end,
      range: statsPeriod,
    };
  }

  resetQueries() {
    this.queryBuilders.forEach((builder, i) =>
      builder.reset(this.getQuery(this.props.queries[i]))
    );
  }

  async fetchData() {
    // Reset query builder
    this.resetQueries();

    // Fetch
    const promises = this.queryBuilders.map(builder => builder.fetch());
    let results = await Promise.all(promises);
    let previousData = null;
    let data = null;

    this.setState({
      results,
      data,
      previousData,
    });
  }

  render() {
    const {children} = this.props;

    return children({
      queries: this.queryBuilders.map(builder => builder.getInternal()),
      results: this.state.results,
      data: this.state.data,
      previousData: this.state.previousData,
    });
  }
}

export default withGlobalSelection(withOrganization(DiscoverQuery));
