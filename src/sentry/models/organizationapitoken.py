from __future__ import absolute_import


from sentry.db.models import Model, FlexibleForeignKey


class OrganizationApiToken(Model):
    __core__ = False

    api_token = FlexibleForeignKey("sentry.ApiToken")
    organization = FlexibleForeignKey("sentry.Organization")

    class Meta:
        app_label = "sentry"
        db_table = "sentry_organizationapitoken"
