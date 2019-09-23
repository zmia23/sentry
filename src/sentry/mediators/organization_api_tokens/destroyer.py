from __future__ import absolute_import


from collections import Iterable
from uuid import uuid4


from sentry.mediators import Mediator, Param
from sentry.models import OrganizationApiToken, AuditLogEntryEvent


class Destoyer(Mediator):
    api_token = Param("sentry.models.ApiToken")
    # analytics and audit params
    request = Param("rest_framework.request.Request", required=False)
    user = Param("sentry.models.User", required=False)

    def call(self):
        self._destroy_organization_api_token()
        self._destroy_api_token()
        return self.api_token

    def _destroy_api_token(self):
        self.api_token.delete()

    def _destroy_organization_api_token(self):
        org_token = OrganizationApiToken.objects.get(
            api_token=self.api_token
        )
        org_token.delete()

    def audit(self):
        from sentry.utils.audit import create_audit_entry

        if self.request:
            create_audit_entry(
                request=self.request,
                organization=self.organization,
                target_object=self.api_token.id,
                event=AuditLogEntryEvent.ORG_REMOVE_TOKEN,
            )

    def record_analytics(self):
        from sentry import analytics

        if self.user:
            analytics.record(
                "organization_token.deleted",
                user_id=self.user.id,
                organization_id=self.organization.id,
            )
