import React from 'react';

import ContextBlock from 'app/components/events/contexts/contextBlock';
import {defined} from 'app/utils';

type Props = {
  alias: String;
  data: Data;
};

type Data = {
  name: string;
  version: string;
  build: string;
  kernel_version: string;
  rooted?: any;
};

const OsContextType = ({alias, data}: Props) => {
  const {name, version, build, kernel_version, rooted, ...test} = data;
  console.log('TESSSST', test);
  return (
    <ContextBlock
      data={test}
      knownData={[
        ['?Name', name],
        ['?Version', version + (build ? ` (${build})` : '')],
        ['?Kernel Version', kernel_version],
        ['?Rooted', defined(rooted) ? (rooted ? 'yes' : 'no') : null],
      ]}
      alias={alias}
    />
  );
};

export default OsContextType;
