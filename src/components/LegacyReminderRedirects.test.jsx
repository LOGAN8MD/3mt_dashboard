import React from 'react';
import { render, screen } from '@testing-library/react';
import { LegacyRemindersRedirect, LegacyRentalsRedirect } from './LegacyReminderRedirects';

let mockSearch = '';

jest.mock('react-router-dom', () => ({
  Navigate: ({ to, replace }) => <span data-testid="redirect" data-replace={String(replace)}>{typeof to === 'string' ? to : `${to.pathname}${to.search || ''}`}</span>,
  useLocation: () => ({ search: mockSearch }),
}), { virtual: true });

test('legacy rental management URL redirects to the canonical rental management workspace', () => {
  mockSearch = '?rental=abc123';
  render(<LegacyRentalsRedirect />);

  expect(screen.getByTestId('redirect')).toHaveTextContent('/admin/manage-reminders/rental?rental=abc123');
  expect(screen.getByTestId('redirect')).toHaveAttribute('data-replace', 'true');
});

test('legacy rental creation URL redirects to creation and preserves other identifiers', () => {
  mockSearch = '?workspace=create&draft=draft-1';
  render(<LegacyRentalsRedirect />);

  expect(screen.getByTestId('redirect')).toHaveTextContent('/admin/create-reminder/rental?draft=draft-1');
});

test('legacy reminders URL redirects to rental management and preserves its query', () => {
  mockSearch = '?plan=plan-1';
  render(<LegacyRemindersRedirect />);

  expect(screen.getByTestId('redirect')).toHaveTextContent('/admin/manage-reminders/rental?plan=plan-1');
});
