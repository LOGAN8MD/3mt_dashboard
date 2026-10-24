import { fireEvent, render, screen } from '@testing-library/react';
import ReminderRowsEditor from './ReminderRowsEditor';
import { createReminderRow } from '../utils/rentalReminderForm';

test('validates exact times again when the plan end changes and adds date rows', () => {
  const onChange = jest.fn();
  const props = { reminders: [{ ...createReminderRow('one'), scheduledAt: '2099-10-26T12:00' }], onChange, exactDates: true, startAt: '2099-10-25T00:00', endAt: '2099-10-27T00:00' };
  const { rerender } = render(<ReminderRowsEditor {...props} />);
  expect(screen.queryByLabelText('Reminder 1 offset')).not.toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  rerender(<ReminderRowsEditor {...props} endAt="2099-10-26T00:00" />);
  expect(screen.getByRole('alert')).toHaveTextContent('before the plan end');
  fireEvent.click(screen.getByRole('button', { name: 'Add reminder' }));
  expect(onChange.mock.calls[0][0][1].scheduledAt).toBe('');
});

test('applies a bilingual template to one scheduled reminder row', () => {
  const onChange = jest.fn();
  const reminder = createReminderRow('row-1');

  render(
    <ReminderRowsEditor
      reminders={[reminder]}
      onChange={onChange}
      endAt="2026-11-16T10:00"
      productName="Bosch Drill"
    />
  );

  fireEvent.change(screen.getByLabelText('Reminder 1 message template'), {
    target: { value: 'service-completed' },
  });

  const updatedRow = onChange.mock.calls[0][0][0];
  expect(updatedRow.templateId).toBe('service-completed');
  expect(updatedRow.subjectEnglish).toMatch(/service is complete/i);
  expect(updatedRow.subjectHindi).toMatch(/सर्विस पूरी/);
  expect(updatedRow.bodyEnglish).toMatch(/3MT Machine Tools shop/);
  expect(updatedRow.bodyHindi).toMatch(/3MT Machine Tools/);
});

test('renders machine and amount fields for the dynamic row template', () => {
  const onChange = jest.fn();
  const reminder = {
    ...createReminderRow('row-1'),
    templateId: 'machine-ready-with-amount',
  };

  const { rerender } = render(
    <ReminderRowsEditor
      reminders={[reminder]}
      onChange={onChange}
      endAt="2026-11-16T10:00"
      productName="Bosch Drill"
    />
  );

  fireEvent.change(screen.getByLabelText('Reminder 1 amount'), {
    target: { value: '1250' },
  });

  const amountRow = onChange.mock.calls[0][0][0];
  expect(amountRow.bodyEnglish).toContain('Bosch Drill');
  expect(amountRow.bodyEnglish).toContain('₹1250');
  expect(amountRow.bodyHindi).toContain('₹1250');

  rerender(
    <ReminderRowsEditor
      reminders={[amountRow]}
      onChange={onChange}
      endAt="2026-11-16T10:00"
      productName="Bosch Drill"
    />
  );
  expect(screen.getByLabelText('Reminder 1 amount')).toHaveValue(1250);
});
