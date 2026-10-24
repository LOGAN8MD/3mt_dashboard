import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ConfirmationDialog, confirmAction, requestReason } from './confirmationDialog';

test('confirmation focuses cancel, traps keyboard focus and accepts only once', () => {
  const onClose = jest.fn();
  render(<ConfirmationDialog message="Confirm this rental?" onClose={onClose} />);
  const cancel = screen.getByRole('button', { name: 'No, go back' });
  const confirm = screen.getByRole('button', { name: 'Yes, confirm' });
  expect(cancel).toHaveFocus();
  fireEvent.keyDown(cancel, { key: 'Tab', shiftKey: true });
  expect(confirm).toHaveFocus();
  fireEvent.keyDown(confirm, { key: 'Tab' });
  expect(cancel).toHaveFocus();
  fireEvent.click(confirm);
  fireEvent.click(confirm);
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledWith(true);
});

test('reason dialog rejects whitespace and returns trimmed text', () => {
  const onClose = jest.fn();
  render(<ConfirmationDialog message="Why are you cancelling?" reasonRequired onClose={onClose} />);
  const confirm = screen.getByRole('button', { name: 'Yes, confirm' });
  expect(confirm).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Reason'), { target: { value: '   ' } });
  expect(confirm).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Reason'), { target: { value: ' Customer request ' } });
  fireEvent.click(confirm);
  expect(onClose).toHaveBeenCalledWith('Customer request');
});

test('promise dialog cancels with Escape, restores focus and blocks simultaneous dialogs', async () => {
  render(<button>Open</button>);
  const trigger = screen.getByRole('button', { name: 'Open' });
  trigger.focus();
  let result;
  act(() => { result = confirmAction('Save this draft?'); });
  await expect(confirmAction('Duplicate')).resolves.toBeNull();
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  await expect(result).resolves.toBeNull();
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(trigger).toHaveFocus();
  act(() => { result = requestReason('Cancel this plan?'); });
  fireEvent.click(screen.getByRole('button', { name: 'No, go back' }));
  await expect(result).resolves.toBeNull();
});
