from __future__ import absolute_import

from rest_framework.response import Response
import six

from sentry.plugins.base import plugins
from sentry.api.bases.organization import OrganizationEndpoint
from sentry.api.serializers import serialize
from sentry.api.serializers.models.plugin import PluginSerializer
from sentry.models import ProjectOption, Project


class OrganizationPluginsConfigsEndpoint(OrganizationEndpoint):
    def get(self, request, organization):
        all_plugins = dict([(p.slug, p) for p in plugins.all()])

        # find all the keys that will tell us if a plugin is enabled OR configured
        keys_to_check = []
        for slug, plugin in six.iteritems(all_plugins):
            keys_to_check.append("%s:enabled" % slug)
            if plugin.required_field:
                keys_to_check.append("%s:%s" % (slug, plugin.required_field))

        # Get all the project options for org that have truthy values
        project_options = ProjectOption.objects.filter(
            key__in=keys_to_check, project__organization=organization
        ).exclude(value__in=[False, ""])

        all_project_plugins = {}
        project_plugins_enabled = {}
        project_plugins_configured = {}
        for project_option in project_options:
            [slug, field] = project_option.key.split(":")
            project_id = project_option.project_id

            # first add to the set of all projects by plugin
            all_project_plugins.setdefault(slug, set()).add(project_id)

            # next check if enabled
            if field == "enabled":
                project_plugins_enabled.setdefault(slug, set()).add(project_id)
            else:
                project_plugins_configured.setdefault(slug, set()).add(project_id)

        project_id_set = set([project_option.project_id for project_option in project_options])

        projects = []
        project_map = {}
        if request.GET.get("use_cache"):
            for project_id in project_id_set:
                projects.append(Project.objects.get_from_cache(id=project_id))
        else:
            projects = Project.objects.filter(id__in=project_id_set)

        for project in projects:
            project_map[project.id] = project

        serialized_plugins = []
        for slug, plugin in six.iteritems(all_plugins):
            serialized_plugin = serialize(plugin, request.user, PluginSerializer())

            serialized_plugin["projectList"] = []

            projects_enabled = project_plugins_enabled.get(slug, set())
            projects_configured = project_plugins_configured.get(slug, set())

            # iterate through the projects
            for project_id in all_project_plugins.get(slug, []):
                project = project_map[project_id]

                # only include plugins which are configured or require no confiugration
                if serialized_plugin["hasConfiguration"] and project_id not in projects_configured:
                    continue

                serialized_plugin["projectList"].append(
                    {
                        "projectId": project.id,
                        "projectSlug": project.slug,
                        "projectName": project.name,
                        "enabled": project_id in projects_enabled,
                    }
                )
            serialized_plugins.append(serialized_plugin)

        return Response(serialized_plugins)
