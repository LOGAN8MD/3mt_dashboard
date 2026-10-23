import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import axios from '../utils/axiosInstance';
import {
  ADMIN_ROLE,
  CUSTOMER_ROLE,
  EMPLOYEE_ROLE,
  USER_MANAGEMENT_ROLES,
  getRoleLabel,
} from '../utils/roles';

const initialFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  role: EMPLOYEE_ROLE,
};

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [deletingUser, setDeletingUser] = useState(null);
  const [existingUserPrompt, setExistingUserPrompt] = useState(null);
  const [roleUpdateForm, setRoleUpdateForm] = useState({ role: EMPLOYEE_ROLE });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await axios.get('/api/users?roles=employee,admin');
      setUsers(response.data);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load users';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const userStats = useMemo(
    () =>
      users.reduce(
        (stats, user) => ({
          total: stats.total + 1,
          admins: user.role === ADMIN_ROLE ? stats.admins + 1 : stats.admins,
          employees: user.role === EMPLOYEE_ROLE ? stats.employees + 1 : stats.employees,
        }),
        { total: 0, admins: 0, employees: 0 }
      ),
    [users]
  );

  const updateUserInList = (updatedUser) => {
    setUsers((currentUsers) => {
      if (updatedUser.role === CUSTOMER_ROLE) {
        return currentUsers.filter((user) => user._id !== updatedUser._id);
      }

      const userExistsInList = currentUsers.some((user) => user._id === updatedUser._id);

      if (!userExistsInList) {
        return [updatedUser, ...currentUsers];
      }

      return currentUsers.map((user) =>
        user._id === updatedUser._id ? { ...user, ...updatedUser } : user
      );
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim()) return 'Last name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!formData.password.trim()) return 'Password is required';
    if (formData.password.length < 6) return 'Password must be at least 6 characters';
    if (![EMPLOYEE_ROLE, ADMIN_ROLE].includes(formData.role)) return 'Select a valid role';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setSubmitting(true);

    try {
      const firstName = formData.firstName.trim();
      const lastName = formData.lastName.trim();
      const response = await axios.post('/api/users', {
        firstName,
        lastName,
        name: [firstName, lastName].filter(Boolean).join(' '),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: formData.role,
      });

      setUsers((currentUsers) => [response.data, ...currentUsers]);
      setFormData(initialFormData);
      toast.success('Employee account created successfully');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create user';
      const duplicateUser = error.response?.status === 409 && error.response?.data?.existingUser;

      if (duplicateUser && error.response?.data?.canUpdateRole) {
        setExistingUserPrompt(duplicateUser);
        setRoleUpdateForm({ role: duplicateUser.role || CUSTOMER_ROLE });
        toast.error(message);
        return;
      }

      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExistingUserRoleUpdate = async (event) => {
    event.preventDefault();

    if (!existingUserPrompt) return;

    if (!USER_MANAGEMENT_ROLES.includes(roleUpdateForm.role)) {
      toast.error('Select a valid role');
      return;
    }

    setIsUpdatingRole(true);

    try {
      const response = await axios.patch(`/api/users/${existingUserPrompt._id}/role`, {
        role: roleUpdateForm.role,
      });

      updateUserInList(response.data);
      setExistingUserPrompt(null);
      setRoleUpdateForm({ role: EMPLOYEE_ROLE });
      setFormData(initialFormData);
      toast.success('Account role updated successfully');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update user role';
      toast.error(message);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser) return;

    setIsDeleting(true);

    try {
      await axios.delete(`/api/users/${deletingUser._id}`);
      setUsers((currentUsers) =>
        currentUsers.filter((user) => user._id !== deletingUser._id)
      );
      setDeletingUser(null);
      toast.success('Employee account deleted successfully');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete user';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Access Control</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Employees</h1>
          </div>
          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="w-full rounded-lg border border-gray-700 bg-[#0e1726] px-5 py-3 text-sm font-bold uppercase tracking-wide text-gray-300 transition hover:border-blue-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            Refresh
          </button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Total Staff', value: userStats.total, color: 'border-blue-500/40 bg-blue-500/10 text-blue-400' },
            { label: 'Admins', value: userStats.admins, color: 'border-amber-500/40 bg-amber-500/10 text-amber-400' },
            { label: 'Employees', value: userStats.employees, color: 'border-green-500/40 bg-green-500/10 text-green-400' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-gray-800 bg-[#0e1726] p-5 shadow-lg">
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg border ${stat.color}`}>
                <span className="text-sm font-black">{stat.label.charAt(0)}</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{stat.label}</p>
              <p className="mt-2 text-3xl font-black text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
          <section className="rounded-xl border border-gray-800 bg-[#0e1726] p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white">Create Employee</h2>
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">First Name</label>
                  <input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter first name"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Last Name</label>
                  <input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="employee@3mt.com"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Mobile Number Optional</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter mobile number"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value={EMPLOYEE_ROLE}>Employee</option>
                  <option value={ADMIN_ROLE}>Admin</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-900 disabled:opacity-70"
              >
                {submitting ? 'Creating...' : 'Create Employee'}
              </button>
            </form>
          </section>

          <section className="overflow-hidden rounded-xl border border-gray-800 bg-[#0e1726] shadow-lg">
            <div className="border-b border-gray-800 px-6 py-5">
              <h2 className="text-xl font-bold text-white">Employee Accounts</h2>
            </div>

            {loading ? (
              <div className="space-y-3 p-6">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-16 animate-pulse rounded-lg bg-[#1b2128]" />
                ))}
              </div>
            ) : errorMessage ? (
              <div className="p-8 text-center">
                <p className="text-sm font-semibold text-red-400">{errorMessage}</p>
                <button
                  type="button"
                  onClick={fetchUsers}
                  className="mt-4 rounded-lg border border-red-500/40 px-5 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/10"
                >
                  Retry
                </button>
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-semibold text-gray-400">No employee accounts have been created yet.</p>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[820px] text-left">
                    <thead className="bg-[#111b2b] text-xs uppercase tracking-widest text-gray-500">
                      <tr>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Mobile</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Created</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {users.map((user) => (
                        <tr key={user._id} className="transition hover:bg-[#162033]">
                          <td className="px-6 py-4 text-sm font-bold text-white">{user.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-300">{user.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-300">{user.phone || 'Not added'}</td>
                          <td className="px-6 py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ${
                              user.role === 'admin'
                                ? 'bg-amber-500/10 text-amber-300'
                                : 'bg-green-500/10 text-green-300'
                            }`}
                            >
                              {getRoleLabel(user.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setDeletingUser(user)}
                              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/20 hover:text-white"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-gray-800 md:hidden">
                  {users.map((user) => (
                    <div key={user._id} className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold text-white">{user.name}</p>
                          <p className="mt-1 text-sm text-gray-400">{user.email}</p>
                          <p className="mt-1 text-sm text-gray-500">{user.phone || 'Mobile not added'}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ${
                          user.role === 'admin'
                            ? 'bg-amber-500/10 text-amber-300'
                            : 'bg-green-500/10 text-green-300'
                        }`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </div>
                      <p className="mt-4 text-xs uppercase tracking-widest text-gray-500">
                        Created {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setDeletingUser(user)}
                        className="mt-4 w-full rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 transition hover:bg-red-500/20 hover:text-white"
                      >
                        Delete Employee
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-[#0e1726] p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white">Delete Employee</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              Delete <span className="font-bold text-white">{deletingUser.name}</span>? This user will no longer be able to log in with these credentials.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                disabled={isDeleting}
                className="rounded-lg border border-gray-700 px-5 py-3 text-sm font-bold text-gray-300 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                disabled={isDeleting}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-300 transition hover:bg-red-500/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? 'Deleting...' : 'Delete Employee'}
              </button>
            </div>
          </div>
        </div>
      )}

      {existingUserPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-[#0e1726] p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white">User Already Exists</h2>
            <div className="mt-4 rounded-xl border border-gray-800 bg-[#1b2128] p-4 text-sm text-gray-300">
              <p><span className="font-bold text-gray-500">Name:</span> {existingUserPrompt.name || 'N/A'}</p>
              <p className="mt-2"><span className="font-bold text-gray-500">Email:</span> {existingUserPrompt.email || 'N/A'}</p>
              <p className="mt-2">
                <span className="font-bold text-gray-500">Current Role:</span>{' '}
                <span className="font-bold text-white">{getRoleLabel(existingUserPrompt.role)}</span>
              </p>
            </div>
            <form onSubmit={handleExistingUserRoleUpdate} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Update Role To</label>
                <select
                  value={roleUpdateForm.role}
                  onChange={(event) => setRoleUpdateForm({ role: event.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {USER_MANAGEMENT_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {getRoleLabel(role)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setExistingUserPrompt(null)}
                  disabled={isUpdatingRole}
                  className="rounded-lg border border-gray-700 px-5 py-3 text-sm font-bold text-gray-300 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingRole}
                  className="rounded-lg border border-blue-500/30 bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-900 disabled:opacity-70"
                >
                  {isUpdatingRole ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ManageUsers;
