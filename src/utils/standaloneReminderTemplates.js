export const CUSTOM_MESSAGE_TEMPLATE = 'custom';

export const standaloneReminderTemplates = [
  { id: CUSTOM_MESSAGE_TEMPLATE, label: 'Custom message' },
  { id: 'thank-you', label: 'Thank you for visiting' },
  { id: 'service-completed', label: 'Machine service completed' },
  { id: 'machine-ready-with-amount', label: 'Machine ready with amount', requiresDetails: true },
  { id: 'package-ready', label: 'Order / package ready' },
];

const clean = (value) => String(value || '').trim();

const templateContent = {
  'thank-you': () => ({
    subjectEnglish: 'Thank you for visiting 3MT Machine Tools',
    subjectHindi: '3MT Machine Tools आने के लिए धन्यवाद',
    bodyEnglish: 'Thank you for visiting 3MT Machine Tools and choosing our services. We look forward to serving you again.',
    bodyHindi: '3MT Machine Tools आने और हमारी सेवाएं चुनने के लिए धन्यवाद। हमें दोबारा आपकी सेवा करने का अवसर मिलने की आशा है।',
  }),
  'service-completed': () => ({
    subjectEnglish: 'Your machine service is complete',
    subjectHindi: 'आपकी मशीन की सर्विस पूरी हो गई है',
    bodyEnglish: 'Your machine service has been completed. Please collect your machine from the 3MT Machine Tools shop.',
    bodyHindi: 'आपकी मशीन की सर्विस पूरी हो गई है। कृपया अपनी मशीन 3MT Machine Tools की दुकान से प्राप्त करें।',
  }),
  'machine-ready-with-amount': ({ machineName, amount }) => {
    const machine = clean(machineName) || 'Your machine';
    const hindiMachine = clean(machineName) || 'आपकी मशीन';
    const payableAmount = clean(amount) ? `₹${clean(amount)}` : '[amount]';
    const hindiAmount = clean(amount) ? `₹${clean(amount)}` : '[राशि]';

    return {
      subjectEnglish: `${machine} is ready for collection`,
      subjectHindi: `${hindiMachine} प्राप्त करने के लिए तैयार है`,
      bodyEnglish: `${machine} is ready. The payable amount is ${payableAmount}. Please collect it from the 3MT Machine Tools shop.`,
      bodyHindi: `${hindiMachine} तैयार है। देय राशि ${hindiAmount} है। कृपया इसे 3MT Machine Tools की दुकान से प्राप्त करें।`,
    };
  },
  'package-ready': () => ({
    subjectEnglish: 'Your order is ready for collection',
    subjectHindi: 'आपका ऑर्डर प्राप्त करने के लिए तैयार है',
    bodyEnglish: 'Your order or package is ready. Please collect it from the 3MT Machine Tools shop.',
    bodyHindi: 'आपका ऑर्डर या पैकेज तैयार है। कृपया इसे 3MT Machine Tools की दुकान से प्राप्त करें।',
  }),
};

export const renderStandaloneReminderTemplate = (templateId, details = {}) => {
  if (templateId === CUSTOM_MESSAGE_TEMPLATE) {
    return {
      subjectEnglish: '',
      subjectHindi: '',
      bodyEnglish: '',
      bodyHindi: '',
    };
  }

  const render = templateContent[templateId];
  if (!render) throw new Error('Unknown custom message template');
  return render(details);
};

export const toSharedMessageFields = (content) => ({
  sharedSubjectEnglish: content.subjectEnglish,
  sharedSubjectHindi: content.subjectHindi,
  sharedBodyEnglish: content.bodyEnglish,
  sharedBodyHindi: content.bodyHindi,
});
