import React from 'react';

import {t} from 'app/locale';
import {AvatarUser as UserType} from 'app/types';
import ExternalLink from 'app/components/links/externalLink';

import {UserKnownDataType} from './types';

const EMAIL_REGEX = /[^@]+@[^\.]+\..+/;

type Output = {
  subject: string;
  value: React.ReactNode;
  subjectIcon?: React.ReactNode;
};

function getUserKnownDataDetails(
  data: UserType,
  type: UserKnownDataType
): Output | undefined {
  switch (type) {
    case UserKnownDataType.NAME:
      return {
        subject: t('Name'),
        value: data.name,
      };
    case UserKnownDataType.USERNAME:
      return {
        subject: t('Username'),
        value: data.username,
      };
    case UserKnownDataType.ID:
      return {
        subject: t('ID'),
        value: data.id,
      };
    case UserKnownDataType.EMAIL:
      return {
        subject: t('Email'),
        value: data.email,
        subjectIcon: true && (
          <ExternalLink href={`mailto:${data.email}`} className="external-icon">
            <em className="icon-envelope" />
          </ExternalLink>
        ),
      };
    default:
      return undefined;
  }
}

export default getUserKnownDataDetails;
