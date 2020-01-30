from __future__ import absolute_import
import six

from sentry.api.serializers.models.plugin import PluginSerializer


class OrganizationPluginSerializer(PluginSerializer):
    def serialize(self, obj, attrs, user):
        data = super(OrganizationPluginSerializer, self).serialize(obj, attrs, user)
        data["project"] = {"id": self.project.id, "slug": self.project.slug}
        return data


class OrganizationPluginConfigSerializer(PluginSerializer):
    """
        info_by_project should have the following structure:
        {
            "project_id": {
                "enabled": True,
                "configured": False,
            },
            ...
        }
        Where `enabled` denotes if the plugin is enabled for that project
        and `configured` denotes if the plugin is configured for that project

        project_map should be a key/value map of the project_id and the project
    """

    def __init__(self, info_by_project, project_map):
        super(OrganizationPluginConfigSerializer, self).__init__()
        self.info_by_project = info_by_project
        self.project_map = project_map

    def serialize(self, obj, attrs, user):
        data = super(OrganizationPluginConfigSerializer, self).serialize(obj, attrs, user)
        data["projectList"] = []

        # iterate through the projects
        for project_id, plugin_info in six.iteritems(self.info_by_project):
            project = self.project_map[project_id]

            # only include plugins which are configured
            if not plugin_info["configured"]:
                continue

            data["projectList"].append(
                {
                    "projectId": project.id,
                    "projectSlug": project.slug,
                    "projectName": project.name,  # TODO(steve): do we need?
                    "enabled": plugin_info["enabled"],
                    "configured": plugin_info["configured"],  # TODO(steve): do we need?
                }
            )

        return data
