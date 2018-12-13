from __future__ import absolute_import

from sentry import http
from sentry.app import ratelimiter
from sentry.plugins.providers import EventProcessor
from sentry.utils.hashlib import md5_text


class SplunkEventProcessor(EventProcessor):
    def process(self, config, event, **kwargs):
        token = config.get('token')
        index = config.get('index')
        endpoint = config.get('endpoint')
        if not (token and index and endpoint):
            return

        source = self.get_option('source', event.project) or 'sentry'

        rl_key = 'splunk:{}'.format(md5_text(token).hexdigest())
        # limit splunk to 50 requests/second
        if ratelimiter.is_limited(rl_key, limit=50, window=1):
            return

        payload = {
            'time': int(event.datetime.strftime('%s')),
            'source': source,
            'index': index,
            'event': self.get_event_payload(event),
        }
        host = self.get_host_for_splunk(event)
        if host:
            payload['host'] = host

        session = http.build_session()
        session.post(
            endpoint,
            json=payload,
            # Splunk cloud instances certifcates dont play nicely
            verify=False,
            headers={
                'Authorization': 'Splunk {}'.format(token)
            },
        ).raise_for_status()
