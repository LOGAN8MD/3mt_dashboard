import React from 'react';
import {
  DEFAULT_REMINDER_OFFSETS,
  calculateReminderTime,
  createReminderRow,
  formatReminderTimeIST,
} from '../utils/rentalReminderForm';
import ReminderRowsEditor from './ReminderRowsEditor';

const scheduleLabel = (expectedReturnAt, offsetMinutes) => {
  const value = calculateReminderTime(expectedReturnAt, offsetMinutes);
  return value ? formatReminderTimeIST(value) : 'Select a valid return time';
};

const RentalReminderEditor = ({ settings, onChange, customer, expectedReturnAt, validationError }) => {
  const custom = settings.mode === 'custom';

  const setMode = (mode) => onChange({
    mode,
    reminders: mode === 'custom' && settings.reminders.length === 0
      ? [createReminderRow()]
      : settings.reminders,
  });

  return (
    <section className="mt-6 border-t border-gray-700 pt-6" aria-labelledby="rental-reminders-heading">
      <div className="mb-4">
        <h3 id="rental-reminders-heading" className="font-medium text-white">Return reminders</h3>
        <p className="mt-1 text-sm text-gray-400">Times are calculated from the expected return time and shown in IST.</p>
      </div>

      <div className="inline-flex w-full rounded border border-gray-700 bg-gray-900 p-1 sm:w-auto" role="tablist" aria-label="Rental reminder type">
        <button type="button" role="tab" aria-selected={!custom} onClick={() => setMode('default')} className={`flex-1 rounded px-4 py-2 text-sm font-semibold sm:flex-none ${!custom ? 'bg-blue-600 text-white' : 'text-gray-300'}`}>Default reminders</button>
        <button type="button" role="tab" aria-selected={custom} onClick={() => setMode('custom')} className={`flex-1 rounded px-4 py-2 text-sm font-semibold sm:flex-none ${custom ? 'bg-blue-600 text-white' : 'text-gray-300'}`}>Custom reminders</button>
      </div>

      {!custom ? (
        <div className="mt-5 divide-y divide-gray-800 border-y border-gray-800">
          {DEFAULT_REMINDER_OFFSETS.map((offset) => (
            <div key={offset} className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr_auto] sm:items-center sm:gap-4">
              <strong className="text-sm text-white">{offset === 720 ? '12 hours before' : '1 hour before'}</strong>
              <span className="text-sm text-gray-300">{scheduleLabel(expectedReturnAt, offset)}</span>
              <span className="text-xs font-semibold uppercase text-blue-300">Email + WhatsApp</span>
            </div>
          ))}
          <p className="py-3 text-xs text-gray-500">Customer: {customer ? `${customer.email || 'No email'} · ${customer.phone || 'No phone'}` : 'Not selected'}</p>
        </div>
      ) : (
        <div className="mt-5">
          <ReminderRowsEditor
            reminders={settings.reminders}
            onChange={(reminders) => onChange({ ...settings, reminders })}
            endAt={expectedReturnAt}
          />
        </div>
      )}

      {validationError && <p role="alert" className="mt-4 border-l-4 border-red-500 bg-red-950/30 p-3 text-sm text-red-200">{validationError}</p>}
    </section>
  );
};

export default RentalReminderEditor;
