from __future__ import absolute_import, print_function

from sentry import analytics


class OrganizationTokenDeleted(analytics.Event):
    type = "organization_token.deleted"

    attributes = (analytics.Attribute("user_id"), analytics.Attribute("organization_id"))


analytics.register(OrganizationTokenDeleted)
