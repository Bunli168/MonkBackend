const test = require('node:test');
const assert = require('node:assert/strict');
const { transitionLeaveRequest } = require('../utils/leaveRequestWorkflow');

test('MEKUDI approval moves request to super admin stage', () => {
  const result = transitionLeaveRequest({
    currentStatus: 'pending_mekudi',
    requestedAction: 'approved',
    actorRole: 'MEKUDI'
  });

  assert.equal(result.nextStatus, 'pending_superadmin');
  assert.equal(result.allowed, true);
  assert.equal(result.message, 'Request forwarded to Super Admin for final approval');
});

test('Admin approval forwards the request to Super Admin', () => {
  const result = transitionLeaveRequest({
    currentStatus: 'pending_mekudi',
    requestedAction: 'approved',
    actorRole: 'Admin'
  });

  assert.equal(result.nextStatus, 'pending_superadmin');
  assert.equal(result.allowed, true);
  assert.equal(result.message, 'Request forwarded to Super Admin for final approval');
});

test('Super Admin approval finalizes the request', () => {
  const result = transitionLeaveRequest({
    currentStatus: 'pending_superadmin',
    requestedAction: 'approved',
    actorRole: 'SuperAdmin'
  });

  assert.equal(result.nextStatus, 'approved');
  assert.equal(result.allowed, true);
});

test('MEKUDI cannot finalize a Super Admin stage request', () => {
  const result = transitionLeaveRequest({
    currentStatus: 'pending_superadmin',
    requestedAction: 'approved',
    actorRole: 'MEKUDI'
  });

  assert.equal(result.allowed, false);
  assert.match(result.message, /not authorized/i);
});
