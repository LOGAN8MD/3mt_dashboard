import React from 'react';
import { Link, Navigate, NavLink, useParams } from 'react-router-dom';
import ReminderWorkspace, { channelLabel } from '../components/ReminderWorkspace';
import RentalWorkspace from '../components/RentalWorkspace';
import ReminderPlanManagement from '../components/ReminderPlanManagement';

const modes = [
  { id: 'rental', label: 'Rental Machines' },
  { id: 'custom', label: 'Custom Messages' },
];

const modeLinkClass = ({ isActive }) =>
  `min-w-0 flex-1 rounded px-3 py-2 text-center text-sm font-semibold transition-colors sm:flex-none sm:px-5 ${
    isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
  }`;

const ManageReminders = () => {
  const { mode } = useParams();

  // Preserve the old combined reminder screen until Task 34 redirects legacy links.
  if (!mode) return <ReminderWorkspace />;
  if (!modes.some((item) => item.id === mode)) {
    return <Navigate to="/admin/manage-reminders/rental" replace />;
  }

  const rentalMode = mode === 'rental';

  return <div className="mx-auto w-full max-w-7xl">
    <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-white">Manage Reminders</h1>
        <p className="mt-1 text-sm text-gray-400">
          {rentalMode
            ? 'Manage rental agreements, payments, returns, and the reminder plan attached to each machine.'
            : 'Manage standalone customer message plans without changing rental or machine records.'}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to={`/admin/create-reminder/${mode}`} className="rounded border border-blue-500/70 px-3 py-2 text-sm font-semibold text-blue-300 hover:bg-blue-950/40">
          {rentalMode ? 'Create rental' : 'Create custom message'}
        </Link>
        <Link to={`/admin/reminder-logs/${mode}`} className="rounded border border-gray-600 px-3 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-800">
          View delivery logs
        </Link>
      </div>
    </header>

    <nav aria-label="Reminder management mode" className="mb-7 flex w-full rounded border border-gray-700 bg-gray-900 p-1 sm:w-fit">
      {modes.map((item) => <NavLink key={item.id} to={`/admin/manage-reminders/${item.id}`} className={modeLinkClass}>{item.label}</NavLink>)}
    </nav>

    <section className="border-t border-gray-700 pt-6" aria-label={rentalMode ? 'Rental machine management' : 'Custom message management'}>
      {rentalMode
        ? <RentalWorkspace fixedWorkspace="manage" showHeader={false} />
        : <ReminderPlanManagement fixedPlanType="standalone" />}
    </section>
  </div>;
};

export { channelLabel };
export default ManageReminders;
