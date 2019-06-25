from __future__ import absolute_import

from builtins import object
__all__ = ['PluginStatusMixin']


class PluginStatus(object):
    BETA = 'beta'
    STABLE = 'stable'
    UNKNOWN = 'unknown'


class PluginStatusMixin(object):
    status = PluginStatus.UNKNOWN

    @classmethod
    def get_status(cls):
        return cls.status
