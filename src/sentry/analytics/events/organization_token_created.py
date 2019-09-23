from __future__ import absolute_import, print_function

from sentry import analytics


class OrganizationTokenCreated(analytics.Event):
    type = "organization_token.created"

    attributes = (analytics.Attribute("user_id"), analytics.Attribute("organization_id"))


analytics.register(OrganizationTokenCreated)
