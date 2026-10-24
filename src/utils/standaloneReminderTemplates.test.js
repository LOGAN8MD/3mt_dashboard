import {
  CUSTOM_MESSAGE_TEMPLATE,
  renderStandaloneReminderTemplate,
  standaloneReminderTemplates,
  toSharedMessageFields,
} from './standaloneReminderTemplates';

test('provides all approved custom reminder templates', () => {
  expect(standaloneReminderTemplates.map((template) => template.id)).toEqual([
    CUSTOM_MESSAGE_TEMPLATE,
    'thank-you',
    'service-completed',
    'machine-ready-with-amount',
    'package-ready',
  ]);
});

test('renders editable bilingual content for a standard template', () => {
  const content = renderStandaloneReminderTemplate('service-completed');

  expect(content.subjectEnglish).toMatch(/service is complete/i);
  expect(content.bodyEnglish).toMatch(/3MT Machine Tools shop/);
  expect(content.subjectHindi).toMatch(/सर्विस पूरी/);
  expect(content.bodyHindi).toMatch(/3MT Machine Tools/);
  expect(toSharedMessageFields(content)).toEqual(expect.objectContaining({
    sharedSubjectEnglish: content.subjectEnglish,
    sharedBodyHindi: content.bodyHindi,
  }));
});

test('renders the machine and amount in both languages', () => {
  const content = renderStandaloneReminderTemplate('machine-ready-with-amount', {
    machineName: 'Bosch Drill',
    amount: '1250',
  });

  expect(content.bodyEnglish).toContain('Bosch Drill');
  expect(content.bodyEnglish).toContain('₹1250');
  expect(content.bodyHindi).toContain('Bosch Drill');
  expect(content.bodyHindi).toContain('₹1250');
});

test('custom message starts with blank bilingual fields', () => {
  expect(renderStandaloneReminderTemplate(CUSTOM_MESSAGE_TEMPLATE)).toEqual({
    subjectEnglish: '',
    subjectHindi: '',
    bodyEnglish: '',
    bodyHindi: '',
  });
});
