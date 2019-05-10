from __future__ import absolute_import

import re
from hashlib import md5

from django.utils.encoding import force_bytes

DEFAULT_FINGERPRINT_VALUES = frozenset(['{{ default }}', '{{default}}'])


_range_re = re.compile(r'^(-?\d+)?\.\.(-?\d+)?$')


def hash_from_values(values):
    result = md5()
    for value in values:
        result.update(force_bytes(value, errors='replace'))
    return result.hexdigest()


def get_rule_bool(value):
    if value:
        value = value.lower()
        if value in ('1', 'yes', 'true', True, 1):
            return True
        elif value in ('0', 'no', 'false', False, 0):
            return False


def get_rule_range(value):
    if value is None:
        return None
    if type(value) is tuple and len(value) == 2:
        return value
    match = _range_re.match(value)
    if match is None:
        return None
    start, end = match.groups()
    return (
        start and int(start) or None,
        end and int(end) or None,
    )
