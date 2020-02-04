import React from 'react';
import {User, EventUser} from 'app/types';

import UserAvatar from 'app/components/avatar/userAvatar';
import ErrorBoundary from 'app/components/errorBoundary';
import Annotated from 'app/components/events/meta/annotated';
import KeyValueList from 'app/components/events/interfaces/keyValueList';
import {removeFilterMaskedEntries} from 'app/components/events/interfaces/utils';

import getConvertedUserValues from './getConvertedUserValues';

type UserContextType = {
  data: User;
  children?: React.ReactNode;
};

const UserContextType = ({children, data: user}: UserContextType) => {
  const userKeys = Object.keys(user) as Array<keyof EventUser>;
  return (
    <div className="user-widget">
      <div className="pull-left">
        <UserAvatar user={removeFilterMaskedEntries(user)} size={48} gravatar={false} />
      </div>
      <table className="key-value table">
        <tbody>
          {userKeys.map(key => {
            const convertedUserValues = getConvertedUserValues({
              type: key,
              value: user[key],
            });
            if (!convertedUserValues) return null;
            return (
              <tr key={key}>
                <td className="key" key="0">
                  {convertedUserValues.key}
                </td>
                <td
                  className="value"
                  key="1"
                  data-test-id={`user-context-${key.toLowerCase()}-value`}
                >
                  <pre className="val-string">
                    <Annotated object={user} prop={key} required>
                      {value => value}
                    </Annotated>
                  </pre>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {children && (
        <ErrorBoundary mini>
          <KeyValueList data={children} isContextData />
        </ErrorBoundary>
      )}
    </div>
  );
};

export default UserContextType;
