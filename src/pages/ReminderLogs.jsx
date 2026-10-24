import React from 'react';
import { Link, Navigate, NavLink, useParams } from 'react-router-dom';
import { ReminderDeliveryHistory } from '../components/ReminderWorkspace';

const modes = [
  { id: 'rental', label: 'Rental Machines' },
  { id: 'custom', label: 'Custom Messages' },
];

const modeLinkClass = ({ isActive }) =>
  `min-w-0 flex-1 rounded px-3 py-2 text-center text-sm font-semibold transition-colors sm:flex-none sm:px-5 ${
    isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
  }`;

const ReminderLogs = () => {
  const { mode } = useParams();
  if (!modes.some((item) => item.id === mode)) {
    return <Navigate to="/admin/reminder-logs/rental" replace />;
  }

  const rentalMode = mode === 'rental';
  const scope = rentalMode ? 'rental' : 'standalone';

  return <div className="mx-auto w-full max-w-7xl">
    <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-white">Reminder Logs</h1>
        <p className="mt-1 text-sm text-gray-400">Review scheduled and completed delivery outcomes. Plan editing remains in Manage Reminders.</p>
      </div>
      <Link to={`/admin/manage-reminders/${mode}`} className="w-fit rounded border border-blue-500/70 px-3 py-2 text-sm font-semibold text-blue-300 hover:bg-blue-950/40">
        {rentalMode ? 'Manage rentals and plans' : 'Manage custom plans'}
      </Link>
    </header>

    <nav aria-label="Reminder log mode" className="mb-7 flex w-full rounded border border-gray-700 bg-gray-900 p-1 sm:w-fit">
      {modes.map((item) => <NavLink key={item.id} to={`/admin/reminder-logs/${item.id}`} className={modeLinkClass}>{item.label}</NavLink>)}
    </nav>

    <section className="border-t border-gray-700 pt-6" aria-label={rentalMode ? 'Rental reminder logs' : 'Custom message logs'}>
      <ReminderDeliveryHistory scope={scope} />
    </section>
  </div>;
};

export default ReminderLogs;
