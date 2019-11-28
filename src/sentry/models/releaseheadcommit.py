from __future__ import absolute_import, print_function

from django.db import models

from sentry.db.models import BoundedPositiveIntegerField, FlexibleForeignKey, Model, sane_repr


class ReleaseHeadCommit(Model):
    __core__ = False

    organization_id = BoundedPositiveIntegerField(db_index=True)
    repository_id = BoundedPositiveIntegerField()
    release = FlexibleForeignKey("sentry.Release", on_delete=models.CASCADE)
    commit = FlexibleForeignKey("sentry.Commit", on_delete=models.CASCADE)

    class Meta:
        app_label = "sentry"
        db_table = "sentry_releaseheadcommit"
        unique_together = (("repository_id", "release"),)

    __repr__ = sane_repr("release_id", "commit_id", "repository_id")
