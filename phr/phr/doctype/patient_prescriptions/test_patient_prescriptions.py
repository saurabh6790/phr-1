# Copyright (c) 2013, indictrans and Contributors
# See license.txt

import frappe
import unittest

test_records = frappe.get_test_records('Patient Prescriptions')

class TestPatientPrescriptions(unittest.TestCase):
	pass
