from __future__ import absolute_import

from django.conf import settings
from rest_framework import serializers
from rest_framework.response import Response

from sentry.api.base import SessionAuthentication
from sentry.api.fields import MultipleChoiceField
from sentry.api.bases.organization import OrganizationEndpoint
from sentry.api.serializers import serialize
from sentry.models import OrganizationApiToken
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
            )
        except ApiTokenLimitError as e:
            return Response(e.message, status=403)

        return Response(serialize(api_token, request.user), status=201)

    def get(self, request, organization):
        """
        Get organization tokens

        """
        org_api_tokens = OrganizationApiToken.objects.filter(
            organization=organization
        ).select_related("api_token")
        api_tokens = list(org_api_token.api_token for org_api_token in org_api_tokens)
        # pagination not needed because of token limit
        return Response(serialize(api_tokens, request.user))
