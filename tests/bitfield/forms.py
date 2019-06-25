from __future__ import absolute_import

from builtins import object
from django import forms

from .models import BitFieldTestModel


class BitFieldTestModelForm(forms.ModelForm):
    class Meta(object):
        model = BitFieldTestModel
        exclude = tuple()
