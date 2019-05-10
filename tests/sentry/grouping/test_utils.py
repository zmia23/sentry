# -*- coding: utf-8 -*-

from __future__ import absolute_import, print_function

from sentry.grouping.utils import get_rule_range


def test_rule_range():
    assert get_rule_range('..') == (None, None)
    assert get_rule_range('1..10') == (1, 10)
    assert get_rule_range('-5..') == (-5, None)
    assert get_rule_range('..-5') == (None, -5)
    assert get_rule_range('garbage') is None
