import { buildRentalReminderSettings, reminderSettingsToForm } from './rentalReminderForm';
import { buildStandaloneReminderPayload } from './standaloneReminderForm';
import { toLocalDateTimeInput } from './rentalForm';

export const MANAGEABLE_REMINDER_STATUSES = ['pending', 'scheduled', 'processing', 'failed'];

export const planContextLabel = (plan) => plan.planType === 'rental'
  ? plan.rental?.machineSnapshot?.name || plan.rental?.rentalCode || 'Rental machine'
  : plan.productContextSnapshot?.name || 'No product context';

export const editablePlanOccurrences = (plan, now = new Date()) => (
  (plan.occurrences || []).filter((occurrence) =>
    occurrence.scheduleVersion === plan.version &&
    MANAGEABLE_REMINDER_STATUSES.includes(occurrence.status) &&
    new Date(occurrence.scheduledAt) > now
  )
);

export const planEditForm = (plan, now = new Date()) => {
  const occurrences = editablePlanOccurrences(plan, now);
  const reminders = occurrences.map((occurrence) => ({
    offsetMinutes: Math.round((new Date(plan.endsAt) - new Date(occurrence.scheduledAt)) / 60_000),
    channels: occurrence.channels,
    content: occurrence.contentSnapshot,
  }));
  return {
    startAt: toLocalDateTimeInput(plan.startsAt),
    endAt: toLocalDateTimeInput(plan.endsAt),
    reminders: reminderSettingsToForm({ mode: 'custom', reminders }).reminders,
  };
};

export const buildPlanUpdatePayload = (plan, editForm, now = new Date()) => {
  const customer = plan.customer || plan.recipientSnapshot;
  if (plan.planType === 'rental') {
    return {
      rentalId: plan.rental?._id || plan.rental,
      reminderMode: 'custom',
      reminders: buildRentalReminderSettings(
        { mode: 'custom', reminders: editForm.reminders },
        {
          customer,
          handoverAt: plan.rental.handoverAt,
          expectedReturnAt: plan.rental.expectedReturnAt,
          now,
        }
      ).reminders,
    };
  }

  return buildStandaloneReminderPayload({
    customerId: plan.customer?._id || plan.customer,
    productId: plan.product?._id || plan.product || '',
    startAt: editForm.startAt,
    endAt: editForm.endAt,
    reminders: editForm.reminders,
    submissionKey: '',
  }, customer, now);
};
