from __future__ import absolute_import


from datetime import datetime

from sentry.utils.cache import memoize
from sentry.mediators import Mediator, Param
from sentry.models import ApiToken, User
from sentry.exceptions import ApiTokenLimitError
# from sentry.constants import INTERNAL_INTEGRATION_TOKEN_COUNT_MAX


class Creator(Mediator):
    organization = Param("sentry.models.Organization")
    request = Param("rest_framework.request.Request", required=False)
    scopes = Param(Iterable, default=lambda self: [])
    # analytics and audit params
    # generate_audit = Param(bool, default=False)
    # user = Param("sentry.models.User")

    def call(self):
        self._check_token_limit()
        self._create_proxy_user()
        self._create_api_token()
        return self.api_token

    def _check_token_limit(self):
        # TODO: Check token limit
        pass

    def _create_proxy_user(self):
        self.proxy_user = User.objects.create(is_org_proxy_user=True)

    def _create_api_token(self):
        self.api_token = ApiToken.objects.create(
            user=self.proxy_user,
            scope_list=self.scopes,
        )

    # def audit(self):
    #     from sentry.utils.audit import create_audit_entry

    #     if self.request and self.generate_audit:
    #         create_audit_entry(
    #             request=self.request,
    #             organization=self.organization,
    #             target_object=self.api_token.id,
    #             event=AuditLogEntryEvent.INTERNAL_INTEGRATION_ADD_TOKEN,
    #             data={"sentry_app": self.sentry_app.name},
    #         )

    # def record_analytics(self):
    #     from sentry import analytics

    #     analytics.record(
    #         "sentry_app_installation_token.created",
    #         user_id=self.user.id,
    #         organization_id=self.organization.id,
    #         sentry_app_installation_id=self.sentry_app_installation.id,
    #         sentry_app=self.sentry_app.slug,
    #     )
