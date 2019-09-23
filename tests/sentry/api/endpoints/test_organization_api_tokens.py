from __future__ import absolute_import


import six
from mock import patch
from django.core.urlresolvers import reverse

from sentry.testutils import APITestCase
from sentry.models import ApiToken, AuditLogEntry


class OrganizationApiTokensTest(APITestCase):
    def setUp(self):
        self.user = self.create_user(email="boop@example.com")
        self.org = self.create_organization(owner=self.user)
        self.create_project(organization=self.org)
        self.internal_app = self.create_internal_integration(organization=self.org)

        self.url = reverse("sentry-api-0-organization-api-tokens", args=[self.org.slug])
        self.login_as(user=self.user)


class PostOrganizationApiTokensTest(OrganizationApiTokensTest):
    @patch("sentry.analytics.record")
    def test_create_api_token(self, record):

        response = self._post()

        assert response.status_code == 201
        token = ApiToken.objects.get(user__is_org_proxy_user=True)
        assert response.data["id"] == six.binary_type(token.id)
        assert token.get_scopes() == ["project:read", "event:read"]
        assert token.application is None

        log = AuditLogEntry.objects.get(organization=self.org)
        assert log.get_note() == "created a token for organization %s" % (self.org.slug)
        assert log.organization == self.org
        assert log.target_object == token.id

        record.assert_called_with(
            "organization_token.created", user_id=self.user.id, organization_id=self.org.id
        )

    def test_bad_scopes(self):
        response = self._post(scopes=("something-else",))
        assert response.status_code == 400
        assert response.data["scopes"] == [
            "Select a valid choice. something-else is not one of the available choices."
        ]

    def test_token_limit(self):
        for i in range(20):
            response = self._post()
            assert response.status_code == 201

        response = self._post()
        assert response.status_code == 403
        assert response.data == "Cannot generate more than 20 tokens for an organization"

    def _post(self, **kwargs):
        body = {"organization": self.org.slug, "scopes": ("project:read", "event:read")}

        body.update(**kwargs)

        return self.client.post(self.url, body, headers={"Content-Type": "application/json"})


class GetOrganizationApiTokensTest(OrganizationApiTokensTest):
    def test_get_api_tokens(self):
        self.org2 = self.create_organization(owner=self.user)

        self.create_organization_api_token(organization=self.org)
        self.create_organization_api_token(
            organization=self.org, scopes=("project:read", "event:read")
        )
        self.create_organization_api_token(organization=self.org2)

        # validate setup
        assert ApiToken.objects.count() == 4

        response = self.client.get(self.url)

        assert response.status_code == 200
        assert len(response.data) == 2
        assert response.data[0]["scopes"] == []
        assert response.data[1]["scopes"] == ["project:read", "event:read"]
