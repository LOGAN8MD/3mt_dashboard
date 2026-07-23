export const ADMIN_ROLE = 'admin';
export const EMPLOYEE_ROLE = 'employee';
export const CUSTOMER_ROLE = 'customer';
export const DASHBOARD_ROLES = [ADMIN_ROLE, EMPLOYEE_ROLE];
export const USER_MANAGEMENT_ROLES = [CUSTOMER_ROLE, EMPLOYEE_ROLE, ADMIN_ROLE];

export const isAdminRole = (role) => role === ADMIN_ROLE;

export const isEmployeeRole = (role) => role === EMPLOYEE_ROLE;

export const isDashboardRole = (role) => DASHBOARD_ROLES.includes(role);

export const getRoleLabel = (role) => {
  if (role === ADMIN_ROLE) return 'Admin';
  if (role === EMPLOYEE_ROLE) return 'Employee';
  if (role === CUSTOMER_ROLE) return 'Customer';
  return role || 'Unknown';
};

export const getDashboardHomePath = (role) => {
  if (isAdminRole(role)) {
    return '/admin';
  }

  if (isEmployeeRole(role)) {
    return '/user';
  }

  return '/login';
};
