const ROLE_ORDER = {
  MEKUDI: 'mekudi',
  ADMIN: 'admin',
  SuperAdmin: 'superadmin'
};

function transitionLeaveRequest({ currentStatus, requestedAction, actorRole }) {
  const normalizedRole = (actorRole || '').toUpperCase();

  if (requestedAction === 'rejected') {
    return {
      allowed: true,
      nextStatus: 'rejected',
      message: 'Request rejected'
    };
  }

  if (requestedAction !== 'approved') {
    return {
      allowed: false,
      nextStatus: currentStatus,
      message: 'Unsupported action'
    };
  }

  if (currentStatus === 'pending' || currentStatus === 'pending_mekudi') {
    if (normalizedRole === 'ADMIN' || normalizedRole === 'MEKUDI' || normalizedRole === 'ATTENDANCETAKER') {
      return {
        allowed: true,
        nextStatus: 'pending_superadmin',
        message: 'Request forwarded to Super Admin for final approval'
      };
    }
    
    if (normalizedRole === 'SUPERADMIN') {
      return {
        allowed: false,
        nextStatus: currentStatus,
        message: 'Only Admin or MEKUDI can forward this request to Super Admin'
      };
    }

    return {
      allowed: false,
      nextStatus: currentStatus,
      message: 'Only Admin or MEKUDI can forward this request to Super Admin'
    };
  }

  if (currentStatus === 'pending_superadmin') {
    if (normalizedRole === 'SUPERADMIN') {
      return {
        allowed: true,
        nextStatus: 'approved',
        message: 'Request approved by Super Admin'
      };
    }

    return {
      allowed: false,
      nextStatus: currentStatus,
      message: 'This request is awaiting Super Admin approval and is not authorized for the current role'
    };
  }

  return {
    allowed: false,
    nextStatus: currentStatus,
    message: 'No workflow transition available'
  };
}

module.exports = {
  transitionLeaveRequest
};
