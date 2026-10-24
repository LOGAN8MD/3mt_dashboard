import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const destinationWithSearch = (pathname, params) => {
  const search = params.toString();
  return { pathname, search: search ? `?${search}` : '' };
};

export const LegacyRentalsRedirect = () => {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const createMode = params.get('workspace') === 'create';
  params.delete('workspace');

  return <Navigate
    to={destinationWithSearch(
      createMode ? '/admin/create-reminder/rental' : '/admin/manage-reminders/rental',
      params
    )}
    replace
  />;
};

export const LegacyRemindersRedirect = () => {
  const { search } = useLocation();
  return <Navigate to={{ pathname: '/admin/manage-reminders/rental', search }} replace />;
};
