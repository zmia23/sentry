from __future__ import absolute_import

from sentry.api.serializers.rest_framework.sentry_app import SentryAppSerializer
from sentry.testutils import TestCase


class SentryAppSerializerTest(TestCase):
    def test_name_has_alphanumeric(self):
        serializer = SentryAppSerializer(
            data={
                'name': '<>',
            }
        )

        assert 'name' in serializer.errors
