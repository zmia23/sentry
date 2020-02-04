import React from 'react';

import ContextBlock from 'app/components/events/contexts/contextBlock';

type Props = {
  data: Data;
  alias: string;
};

type Data = {
  name: string;
  version: string;
  build: any;
};

const Runtime = ({alias, data}: Props) => (
  <ContextBlock
    data={data}
    knownData={[
      ['Name', data.name],
      ['Version', data.version + (data.build ? ` (${data.build})` : '')],
    ]}
    alias={alias}
  />
);

export default Runtime;
