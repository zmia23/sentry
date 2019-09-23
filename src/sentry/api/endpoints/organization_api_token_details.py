from __future__ import absolute_import

from rest_framework.response import Response

from sentry.api.base import SessionAuthentication
from sentry.api.bases import OrganizationEndpoint
from sentry.api.serializers import serialize
from sentry.mediators.organization_api_tokens import Destroyer
from sentry.models import OrganizationApiToken


class OrganizationApiTokenDetailsEndpoint(OrganizationEndpoint):
    authentication_classes = (SessionAuthentication,)

    def convert_args(self, request, organization_slug, api_token, *args, **kwargs):
        try:
            org_token = OrganizationApiToken.objects.get(organization__slug=organization_slug,
             api_token__token=api_token).select_related('api_token')
        except OrganizationApiToken.DoesNotExist:
            raise Http404

        self.check_object_permissions(request, org_token)

        kwargs["api_token"] = org_token.api_token
        return (args, kwargs)

    def delete(self, request, api_token):
        Destroyer.run(api_token=api_token, user=request.user, request=request)
        return Response(status=204)
