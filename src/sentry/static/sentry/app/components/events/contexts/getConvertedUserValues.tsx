import React from 'react';
import {EventUser} from 'app/types';

import ExternalLink from 'app/components/links/externalLink';

const EMAIL_REGEX = /[^@]+@[^\.]+\..+/;

type UserLabelProps = {
  type: keyof EventUser;
  value?: any;
};

type UserLabelPropsOutput = {
  key: string;
  value: React.ReactNode;
};

function getConvertedUserValues({
  type,
  value,
}: UserLabelProps): UserLabelPropsOutput | undefined {
  switch (type) {
    case 'id':
      return {
        key: 'ID',
        value,
      };
    case 'username':
      return {
        key: 'Username',
        value,
      };
    case 'ip_address':
      return {
        key: 'IP Address',
        value,
      };
    case 'name':
      return {
        key: 'Username',
        value,
      };
    case 'email':
      return {
        key: 'Email',
        value: (
          <React.Fragment>
            {value}
            {EMAIL_REGEX.test(value) && (
              <ExternalLink href={`mailto:${value}`} className="external-icon">
                <em className="icon-envelope" />
              </ExternalLink>
            )}
          </React.Fragment>
        ),
      };
    default:
      return undefined;
  }
}

export default getConvertedUserValues;
