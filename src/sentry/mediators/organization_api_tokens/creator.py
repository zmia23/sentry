from __future__ import absolute_import


from collections import Iterable
from uuid import uuid4


from sentry.mediators import Mediator, Param
from sentry.models import ApiToken, User, OrganizationApiToken, AuditLogEntryEvent
from sentry.exceptions import ApiTokenLimitError
from sentry.constants import ORGANIZATION_TOKEN_COUNT_MAX


class Creator(Mediator):
    organization = Param("sentry.models.Organization")
    scopes = Param(Iterable, default=lambda self: [])
    # analytics and audit params
    request = Param("rest_framework.request.Request", required=False)
    user = Param("sentry.models.User", required=False)

    def call(self):
        self._check_token_limit()
        self._create_proxy_user()
        self._create_api_token()
        self._create_organization_api_token()
        return self.api_token

    def _check_token_limit(self):
        curr_count = OrganizationApiToken.objects.filter(organization=self.organization).count()
        if curr_count >= ORGANIZATION_TOKEN_COUNT_MAX:
            raise ApiTokenLimitError(
                "Cannot generate more than %d tokens for an organization"
                % ORGANIZATION_TOKEN_COUNT_MAX
            )

    def _create_proxy_user(self):
        self.proxy_user = User.objects.create(username=uuid4().hex, is_org_proxy_user=True)

    def _create_api_token(self):
        self.api_token = ApiToken.objects.create(user=self.proxy_user, scope_list=self.scopes)

    def _create_organization_api_token(self):
        OrganizationApiToken.objects.create(
            organization=self.organization, api_token=self.api_token
        )

    def audit(self):
        from sentry.utils.audit import create_audit_entry

        if self.request:
            create_audit_entry(
                request=self.request,
                organization=self.organization,
                target_object=self.api_token.id,
                event=AuditLogEntryEvent.ORG_ADD_TOKEN,
            )

    def record_analytics(self):
        from sentry import analytics

        if self.user:
            analytics.record(
                "organization_token.created",
                user_id=self.user.id,
                organization_id=self.organization.id,
            )
