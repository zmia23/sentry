from __future__ import absolute_import

from rest_framework.response import Response
import requests

from sentry.api.base import Endpoint
from sentry.api.permissions import ScopedPermission


STACK_EXCHANGE_SEARCH_API = 'api.stackexchange.com/2.2/search/advanced'


class StackExchangeEndpoint(Endpoint):
    permission_classes = (ScopedPermission, )

    def get(self, request):
        query_dict = {
            'q': request.GET.get('title'),
            'order': 'desc',
            'sort': 'votes',
            'site': 'stackoverflow',
        }
        query_string = '&'.join(['{}={}'.format(k, v) for k, v in query_dict.items()])
        response = requests.get('https://{}?{}'.format(STACK_EXCHANGE_SEARCH_API, query_string))
        return Response(response.json(), status=200)
