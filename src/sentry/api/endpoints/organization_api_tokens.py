from __future__ import absolute_import

from django.conf import settings
from django.db import IntegrityError, transaction
from rest_framework import serializers
from rest_framework.response import Response

from sentry.api.base import SessionAuthentication
from sentry.api.fields import MultipleChoiceField
from sentry.api.bases.organization import OrganizationEndpoint, OrganizationPermission
from sentry.api.serializers import serialize
from sentry.models import ApiToken
from sentry.exceptions import ApiTokenLimitError
from sentry.mediators.organization_api_tokens import Creator


class ApiTokenSerializer(serializers.Serializer):
    scopes = MultipleChoiceField(required=True, choices=settings.SENTRY_SCOPES)


class OrganizationApiTokensEndpoint(OrganizationEndpoint):
    authentication_classes = (SessionAuthentication,)

    def post(self, request, organization):
        """
        Create an organization token

        """
        serializer = ApiTokenSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        try:
            api_token = Creator.run(
                request=request,
                organization=organization,
                user=request.user,
                scopes=request.data["scopes"],
                organization=organization,
            )
        except ApiTokenLimitError as e:
            return Response(e.message, status=status.HTTP_403_FORBIDDEN)

        return Response(serialize(access_requests, request.user))
