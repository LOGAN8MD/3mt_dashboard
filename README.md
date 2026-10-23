# 3MT Dashboard

React dashboard for 3MT administrators and employees. Admins manage products and employee submissions; employees can view the catalog and submit new products for approval.

Admin and employee routes share one persistent `AdminLayout` through React Router nested routes. Sidebar/header state and sidebar scroll position remain mounted while only the main `<Outlet />` content changes during dashboard navigation.

## Requirements

- Node.js 18 or newer
- npm
- Running 3MT backend API

## API Environment

The dashboard selects its backend automatically through Create React App environment files:

- `npm start` uses `.env.development` and connects to `http://localhost:8080`.
- `npm run build` uses `.env.production` and connects to `https://threemt-server.onrender.com`.
- `.env.example` documents the required `REACT_APP_API_BASE_URL` variable.

Set `REACT_APP_API_BASE_URL` in a local environment override or deployment provider when a different backend is required. Use the API origin without a trailing slash. Restart the development server after changing environment variables.

## Commands

```bash
npm install
npm start
npm test
npm run test:ci
npm run build
npm run verify
```

- `npm start` starts the local dashboard.
- `npm test` starts the interactive test runner.
- `npm run test:ci` runs all dashboard tests once.
- `npm run build` creates the production build.
- `npm run verify` runs the dashboard tests once and then creates the production build.

## Second-Hand Product Flow

Admins and employees can select **New Machine** or **Second-Hand Machine** while adding a machine. Second-hand machines support sale, rent, or both, with conditional price and rental fields. They also support live availability states: available, on rent, unavailable, and sold.

Employee submissions go to the admin Pending Products page and do not enter the main product collection immediately. An admin can review and edit the submission, replace its images, then approve or reject it. Approval creates the final product through the backend workflow.

The admin Manage Products page can update existing listing and availability information. Admin and employee dashboards display condition, offer type, relevant sale/rental pricing, and live availability. Products created before these fields existed display as New, For Sale, and Available.

The dashboard tests cover second-hand sale/rental display and legacy product display defaults. Backend tests cover validation, employee submission, admin approval, schemas, and persistence payload preparation.
# Reminder Delivery

Admins can open **Reminders** at `/admin/reminders` to view scheduled messages, customer contact details, India-time dates, and independent email/WhatsApp results. The list refreshes every 30 seconds while visible and includes pagination, status filters, message preview, and eligible email retries.

For a due WhatsApp reminder, choose **Share on WhatsApp**, inspect the prepared bilingual message, then choose **Open WhatsApp**. Send it inside WhatsApp and use **Mark as sent** to confirm. Opening WhatsApp never marks it sent automatically. Manual confirmation records the admin and timestamp; it does not verify customer delivery or reading.

Automatic email requires backend automation configuration and the external cron wakeup described in `3mt_Server/README.md`. Email **Sent** means accepted by Brevo. **Needs review** means the delivery result was uncertain and automatic retry is withheld to avoid duplicates. Sale and custom reminder creation screens remain separate staged work.

# Rental Creation and Management (Tasks 14-15)

Admins can open **Rentals** at `/admin/rentals`. The page loads customer accounts and eligible available second-hand machines offered for rent, copies the machine's listed rate/period/deposit as editable starting values, accepts India-local handover and return times, and requests the authoritative quote from the backend.

**Save draft** creates an editable rental without reserving the machine or creating reminders. Drafts can be edited, deleted, or activated later. **Confirm rental** and draft activation require explicit confirmation, atomically mark the machine `on_rent`, and create the immediate bilingual confirmation plus default 12-hour and 1-hour reminders.

The default **Manage rentals** tab provides searchable Active, Due Soon, Overdue, Returned, and Cancelled views. Due Soon means an active rental whose expected return is within the next 24 hours. Opening a row shows the saved customer and machine snapshots, dates, charges, deposit settlement, payments, notes, reminder channel history, and audit history.

Admins can extend active or overdue rentals with a required note, record additional payments, or cancel an eligible rental with a reason. Return recording requires the actual physical return time and supports approved extra charges, deposit application, an optional payment at return, settlement notes, and machine-condition notes. The backend preview is shown before confirmation and remains authoritative for early-return billing, full-day late rounding, refunds, and remaining balances. An overdue rental keeps the machine `on_rent`; only a confirmed return or eligible cancellation releases it.

# Second-Hand Machine Sales (Task 16)

Admins can open **Sales** at `/admin/sales`. The **Create & edit** tab loads customer accounts and eligible available one-unit second-hand machines offered for sale. It accepts an India-local sale time, agreed price, optional initial payment, payment method/reference, and notes. A sale can be kept as an editable draft or completed immediately; completion atomically marks the physical machine `sold`.

The **Manage sales** tab provides searchable Draft, Completed, and Cancelled history. Opening a sale shows customer and machine snapshots, sale price, payments, remaining balance, refunds, notes, and audit history. Drafts can be edited or completed, and draft/completed sales can receive additional payments up to the saved balance. An unpaid draft may be permanently deleted. A paid draft must instead be cancelled with a reason and an explicit confirmation that the received payment was refunded, preserving its financial history. Completed sales may retain a balance for later collection.
