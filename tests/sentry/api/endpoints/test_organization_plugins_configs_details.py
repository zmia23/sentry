from __future__ import absolute_import

from django.core.urlresolvers import reverse
from django.conf import settings

from sentry.plugins.base import plugins
from sentry.testutils import APITestCase
from sentry.runner.initializer import register_plugins, unregister_plugins


class OrganizationPluginsTest(APITestCase):
    def setUp(self):

        register_plugins(settings, raise_on_plugin_load_failure=True)

        self.projectA = self.create_project()
        self.organization = self.projectA.organization
        self.projectB = self.create_project(organization=self.organization)
        self.projectC = self.create_project(organization=self.organization)
        self.login_as(user=self.user)
        self.url = reverse(
            "sentry-api-0-organization-plugins-configs-details",
            kwargs={"organization_slug": self.organization.slug, "plugin_slug": "trello"},
        )

    def tearDown(self):
        unregister_plugins(settings)

    def test_no_configs(self):

        response = self.client.get(self.url)

        assert response.status_code == 200
        assert response.data == []

    def test_bad_slug(self):
        url = reverse(
            "sentry-api-0-organization-plugins-configs-details",
            kwargs={"organization_slug": self.organization.slug, "plugin_slug": "bad_slug"},
        )

        response = self.client.get(url)

        assert response.status_code == 404
        assert response.data["detail"] == "Plugin not found"

    def test_multiple_configs(self):
        plugins.get("trello").enable(self.projectA)
        plugins.get("trello").set_option("key", "a_value", self.projectA)
        plugins.get("trello").disable(self.projectB)
        plugins.get("trello").set_option("key", "b_value", self.projectB)
        plugins.get("trello").set_option("wrong_key", "c_value", self.projectC)

        response = self.client.get(self.url)

        assert response.status_code == 200
        assert len(response.data) == 2

        project_a_config = filter(lambda x: x["project"]["id"] == self.projectA.id, response.data)[
            0
        ]
        project_b_config = filter(lambda x: x["project"]["id"] == self.projectB.id, response.data)[
            0
        ]
        assert project_a_config["enabled"]
        assert not project_b_config["enabled"]
