from __future__ import absolute_import

from sentry.api.serializers.models.plugin import PluginSerializer


class OrganizationPluginSerializer(PluginSerializer):
    def serialize(self, obj, attrs, user):
        data = super(OrganizationPluginSerializer, self).serialize(obj, attrs, user)
        data["project"] = {"id": self.project.id, "slug": self.project.slug}
        return data


class OrganizationPluginProjectListSerializer(PluginSerializer):
    def __init__(self, project_list):
        self.project_list = project_list
        self.project = None

    def serialize(self, obj, attrs, user):
        data = super(OrganizationPluginProjectListSerializer, self).serialize(obj, attrs, user)
        data["projectList"] = []
        for project in self.project_list:
            data["projectList"].append(
                {
                    "id": project.id,
                    "slug": project.slug,
                    "name": project.name,
                    "enabled": obj.is_enabled(project),
                }
            )
        return data
