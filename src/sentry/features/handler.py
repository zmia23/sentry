from __future__ import absolute_import

from builtins import object
__all__ = ['FeatureHandler']


class FeatureHandler(object):
    features = set()

    def __call__(self, feature, actor):
        if feature.name not in self.features:
            return None

        return self.has(feature, actor)

    def has(self, feature, actor):
        raise NotImplementedError
