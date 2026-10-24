import React from 'react';
import { Link, Navigate, NavLink, useParams } from 'react-router-dom';
import StandaloneReminderForm from '../components/StandaloneReminderForm';

const modes = [
  { id: 'rental', label: 'Rental Machine' },
  { id: 'custom', label: 'Custom Message' },
];

const modeLinkClass = ({ isActive }) =>
  `min-w-0 flex-1 rounded px-3 py-2 text-center text-sm font-semibold transition-colors sm:flex-none sm:px-5 ${
    isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
  }`;

const ContextItem = ({ label, value }) => (
  <div className="min-w-0 border-b border-gray-800 py-4 last:border-b-0 sm:grid sm:grid-cols-[10rem_1fr] sm:gap-5">
    <dt className="text-xs font-bold uppercase text-gray-500">{label}</dt>
    <dd className="mt-1 text-sm text-gray-200 sm:mt-0">{value}</dd>
  </div>
);

const CreateReminder = () => {
  const { mode } = useParams();

  if (!modes.some((item) => item.id === mode)) {
    return <Navigate to="/admin/create-reminder/rental" replace />;
  }

  const rentalMode = mode === 'rental';

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Create Reminder</h1>
        <p className="mt-1 text-sm text-gray-400">
          Choose whether the reminder belongs to a machine rental or a separate customer message.
        </p>
      </header>

      <nav
        aria-label="Reminder creation mode"
        className="mb-7 flex w-full rounded border border-gray-700 bg-gray-900 p-1 sm:w-fit"
      >
        {modes.map((item) => (
          <NavLink
            key={item.id}
            to={`/admin/create-reminder/${item.id}`}
            className={modeLinkClass}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <section className="border-y border-gray-700 py-6" aria-labelledby={`${mode}-mode-title`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase text-blue-400">Selected mode</p>
            <h2 id={`${mode}-mode-title`} className="mt-2 text-xl font-semibold text-white">
              {rentalMode ? 'Rental Machine' : 'Custom Message'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              {rentalMode
                ? 'Create or activate a rental using the existing rental workspace. Customer, machine, billing, deposit, and reminder settings stay together in one flow.'
                : 'Schedule one or more bilingual customer reminders without creating a rental or changing product availability.'}
            </p>
          </div>

          {rentalMode ? (
            <Link
              to="/admin/rentals?workspace=create"
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Open rental setup
            </Link>
          ) : (
            <Link
              to="/admin/reminders"
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-200 transition-colors hover:border-gray-500 hover:bg-gray-800"
            >
              View reminder history
            </Link>
          )}
        </div>

        {rentalMode ? <dl className="mt-6 border-t border-gray-800">
            <>
              <ContextItem label="Customer context" value="Selected inside the rental setup with current email and WhatsApp details." />
              <ContextItem label="Machine context" value="Limited to eligible available second-hand rental machines." />
              <ContextItem label="Reminder plan" value="Default or customized return reminders are configured with the rental." />
            </>
        </dl> : <StandaloneReminderForm />}
      </section>
    </div>
  );
};

export default CreateReminder;
