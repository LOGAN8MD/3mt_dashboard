import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

let activeDialog = false;

export const ConfirmationDialog = ({ message, reasonRequired = false, onClose }) => {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const settled = useRef(false);
  const [reason, setReason] = useState('');
  const destructive = /cancel|delete|permanently/i.test(message);
  const finish = (value) => {
    if (settled.current) return;
    settled.current = true;
    onClose(value);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (dialog.showModal) dialog.showModal();
    else dialog.setAttribute('open', '');
    cancelRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  return <dialog ref={dialogRef} aria-labelledby="confirmation-heading" aria-describedby="confirmation-message" aria-modal="true"
    onCancel={(event) => { event.preventDefault(); finish(null); }}
    onKeyDown={(event) => {
      if (event.key === 'Escape') { event.preventDefault(); finish(null); }
      if (event.key !== 'Tab') return;
      const items = [...dialogRef.current.querySelectorAll('button:not(:disabled), textarea')];
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}
    style={{ width: 'calc(100% - 2rem)', maxHeight: '90dvh' }}
    className="fixed inset-0 m-auto max-w-md overflow-y-auto rounded-lg border border-gray-600 bg-gray-900 p-0 text-gray-100 shadow-2xl backdrop:bg-black/70">
    <form onSubmit={(event) => { event.preventDefault(); if (!reasonRequired || reason.trim()) finish(reasonRequired ? reason.trim() : true); }} className="p-6">
      <h2 id="confirmation-heading" className="text-lg font-semibold">{reasonRequired ? 'Cancellation reason' : destructive ? 'Confirm action' : 'Please confirm'}</h2>
      <p id="confirmation-message" className="mt-3 break-words text-sm leading-6 text-gray-300">{message}</p>
      {reasonRequired && <div className="mt-4"><label htmlFor="confirmation-reason" className="mb-2 block text-sm font-medium">Reason</label><textarea id="confirmation-reason" value={reason} onChange={(event) => setReason(event.target.value)} required maxLength={1000} rows={3} className="w-full rounded border border-gray-600 bg-gray-950 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" /></div>}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button ref={cancelRef} type="button" onClick={() => finish(null)} className="rounded border border-gray-500 px-4 py-2 text-sm font-semibold hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400">No, go back</button>
        <button type="submit" disabled={reasonRequired && !reason.trim()} className={`rounded px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 ${destructive ? 'bg-red-700 hover:bg-red-600' : 'bg-blue-700 hover:bg-blue-600'}`}>Yes, confirm</button>
      </div>
    </form>
  </dialog>;
};

const openDialog = (message, reasonRequired) => {
  if (activeDialog) return Promise.resolve(null);
  activeDialog = true;
  return new Promise((resolve) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    root.render(<ConfirmationDialog message={message} reasonRequired={reasonRequired} onClose={(value) => {
      root.unmount();
      container.remove();
      activeDialog = false;
      resolve(value);
    }} />);
  });
};

export const confirmAction = (message) => openDialog(message, false);
export const requestReason = (message) => openDialog(message, true);
