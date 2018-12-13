from __future__ import absolute_import


class EventProcessor(object):
    def process_event(self, event, **kwargs):
        raise NotImplementedError
