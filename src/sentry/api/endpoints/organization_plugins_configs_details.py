from __future__ import absolute_import

from rest_framework.response import Response

from sentry.plugins.base import plugins
from sentry.api.bases.organization import OrganizationEndpoint
from sentry.api.serializers import serialize
from sentry.api.serializers.models.organization_plugin import (
    OrganizationPluginProjectListSerializer,
)
from sentry.models import ProjectOption


class OrganizationPluginsConfigsDetailsEndpoint(OrganizationEndpoint):
    def get(self, request, organization, plugin_slug=None):
        try:
            plugin = plugins.get(plugin_slug)
        except KeyError:
            return Response({"detail": "Plugin not found"}, status=404)

        keys_to_check = ["%s:enabled" % plugin_slug]
        if plugin.required_field:
            keys_to_check.append("%s:%s" % (plugin_slug, plugin.required_field))

        # Get all the project options for org that have truthy values
        project_options = (
            ProjectOption.objects.filter(key__in=keys_to_check, project__organization=organization)
            .exclude(value__in=[False, ""])
            .select_related("project")
        )

        # assemble the unique projects in a map so we can de-dedup them
        project_map = {}
        for project_option in project_options:
            project_map[project_option.project.id] = project_option.project

        return Response(
            serialize(
                plugin, request.user, OrganizationPluginProjectListSerializer(project_map.values())
            )
        )
