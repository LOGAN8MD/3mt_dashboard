import React from 'react';
import { customReminderTimeError, parseCustomReminderTime } from '../utils/standaloneReminderForm';
import {
  MAX_RENTAL_REMINDERS,
  REMINDER_OFFSET_UNITS,
  calculateReminderTime,
  createReminderRow,
  formatReminderTimeIST,
  reminderOffsetMinutes,
} from '../utils/rentalReminderForm';
import {
  CUSTOM_MESSAGE_TEMPLATE,
  renderStandaloneReminderTemplate,
  standaloneReminderTemplates,
} from '../utils/standaloneReminderTemplates';

const fieldClass = 'w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none';
const labelClass = 'mb-1 block text-xs font-semibold uppercase text-gray-400';

const ReminderRowsEditor = ({ reminders, onChange, endAt, startAt, exactDates = false, productName = '' }) => {
  const updateRow = (id, patch) => onChange(
    reminders.map((row) => row.id === id ? { ...row, ...patch } : row)
  );
  const toggleChannel = (row, channel) => updateRow(row.id, {
    channels: { ...row.channels, [channel]: !row.channels[channel] },
  });
  const addRow = () => {
    if (reminders.length < MAX_RENTAL_REMINDERS) onChange([...reminders, { ...createReminderRow(), ...(exactDates ? { scheduledAt: '' } : {}) }]);
  };
  const removeRow = (id) => onChange(reminders.filter((row) => row.id !== id));
  const applyRowTemplate = (row, templateId, details = {}) => updateRow(row.id, {
    templateId,
    ...renderStandaloneReminderTemplate(templateId, {
      machineName: details.templateMachineName || row.templateMachineName || productName,
      amount: details.templateAmount ?? row.templateAmount,
    }),
  });
  const updateTemplateDetails = (row, patch) => {
    const details = {
      templateMachineName: row.templateMachineName || '',
      templateAmount: row.templateAmount || '',
      ...patch,
    };
    updateRow(row.id, {
      ...details,
      ...renderStandaloneReminderTemplate(row.templateId, {
        machineName: details.templateMachineName || productName,
        amount: details.templateAmount,
      }),
    });
  };

  return (
    <div className="space-y-5">
      {reminders.map((row, index) => {
        let sendTime = 'Enter a valid offset';
        try {
          const scheduledAt = exactDates ? parseCustomReminderTime(row.scheduledAt) : calculateReminderTime(endAt, reminderOffsetMinutes(row));
          sendTime = scheduledAt ? formatReminderTimeIST(scheduledAt) : 'Select a valid end time';
        } catch { /* validation message is shown by the parent form */ }

        const timeError = exactDates && row.scheduledAt ? customReminderTimeError(row.scheduledAt, startAt, endAt) : '';
        return (
          <fieldset key={row.id} className="border-y border-gray-700 py-5">
            <legend className="px-2 text-sm font-semibold text-white">Reminder {index + 1}</legend>
            {exactDates && <div className="mb-4"><label className={labelClass}>Send date and time (IST)</label><input aria-label={`Reminder ${index + 1} date and time`} aria-invalid={Boolean(timeError)} type="datetime-local" min={startAt} max={endAt} value={row.scheduledAt || ''} onChange={(event) => updateRow(row.id, { scheduledAt: event.target.value })} className={fieldClass} />{timeError && <p role="alert" className="mt-2 text-sm text-red-300">{timeError}</p>}</div>}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
              {!exactDates && <>
              <div><label className={labelClass}>Send before end</label><input aria-label={`Reminder ${index + 1} offset`} type="number" min="1" step="1" value={row.offsetValue} onChange={(event) => updateRow(row.id, { offsetValue: event.target.value })} className={fieldClass} /></div>
              <div><label className={labelClass}>Offset unit</label><select aria-label={`Reminder ${index + 1} offset unit`} value={row.offsetUnit} onChange={(event) => updateRow(row.id, { offsetUnit: event.target.value })} className={fieldClass}>{REMINDER_OFFSET_UNITS.map((unit) => <option key={unit.value} value={unit.value}>{unit.label}</option>)}</select></div>
              </>}
              <button type="button" onClick={() => removeRow(row.id)} className="min-h-10 rounded border border-red-500/60 px-3 py-2 text-sm text-red-300 hover:bg-red-950/30">Remove</button>
            </div>
            <p className="mt-3 text-sm text-blue-300">Scheduled: {sendTime} IST</p>

            <div className="mt-4 flex flex-wrap gap-5">
              {['email', 'whatsapp'].map((channel) => <label key={channel} className="flex items-center gap-2 text-sm text-gray-200"><input type="checkbox" checked={row.channels[channel]} onChange={() => toggleChannel(row, channel)} />{channel === 'email' ? 'Email' : 'WhatsApp'}</label>)}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <label className={labelClass}>Message template</label>
                <select aria-label={`Reminder ${index + 1} message template`} value={row.templateId || CUSTOM_MESSAGE_TEMPLATE} onChange={(event) => applyRowTemplate(row, event.target.value)} className={fieldClass}>
                  {standaloneReminderTemplates.map((template) => <option key={template.id} value={template.id}>{template.label}</option>)}
                </select>
              </div>
              {row.templateId === 'machine-ready-with-amount' && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Machine name</label>
                  <input aria-label={`Reminder ${index + 1} machine name`} value={row.templateMachineName || ''} onChange={(event) => updateTemplateDetails(row, { templateMachineName: event.target.value })} placeholder={productName || 'Machine name'} className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}>Amount (₹)</label>
                  <input aria-label={`Reminder ${index + 1} amount`} type="number" min="0" step="0.01" value={row.templateAmount || ''} onChange={(event) => updateTemplateDetails(row, { templateAmount: event.target.value })} placeholder="0.00" className={fieldClass} />
                </div>
              </div>}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div><label className={labelClass}>English subject (optional)</label><input aria-label={`Reminder ${index + 1} English subject`} value={row.subjectEnglish} maxLength="200" onChange={(event) => updateRow(row.id, { subjectEnglish: event.target.value })} className={fieldClass} /></div>
              <div><label className={labelClass}>Hindi subject (optional)</label><input aria-label={`Reminder ${index + 1} Hindi subject`} value={row.subjectHindi} maxLength="200" onChange={(event) => updateRow(row.id, { subjectHindi: event.target.value })} className={fieldClass} /></div>
              <div><label className={labelClass}>English message</label><textarea aria-label={`Reminder ${index + 1} English message`} rows="5" value={row.bodyEnglish} maxLength="5000" onChange={(event) => updateRow(row.id, { bodyEnglish: event.target.value })} className={fieldClass} /></div>
              <div><label className={labelClass}>Hindi message</label><textarea aria-label={`Reminder ${index + 1} Hindi message`} rows="5" value={row.bodyHindi} maxLength="5000" onChange={(event) => updateRow(row.id, { bodyHindi: event.target.value })} className={fieldClass} /></div>
            </div>
          </fieldset>
        );
      })}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={reminders.length >= MAX_RENTAL_REMINDERS} onClick={addRow} className="rounded border border-blue-500 px-4 py-2 text-sm font-semibold text-blue-300 disabled:cursor-not-allowed disabled:opacity-40">Add reminder</button>
        <span className="text-xs text-gray-500">{reminders.length} / {MAX_RENTAL_REMINDERS}</span>
      </div>
    </div>
  );
};

export default ReminderRowsEditor;
