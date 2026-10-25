# 3MT Dashboard

React dashboard for 3MT administrators and employees. Admins manage products and employee submissions; employees can view the catalog and submit new products for approval.

Admin and employee routes share one persistent `AdminLayout` through React Router nested routes. Sidebar/header state and sidebar scroll position remain mounted while only the main `<Outlet />` content changes during dashboard navigation.

The left navigation is organized by workflow instead of one flat list. Admin links are grouped under Overview, Catalog, People, Business, Communication, and Insights; employee links use Overview and Product Requests. The sidebar keeps a compact active state, keyboard focus indicators, independent scrolling, responsive mobile overlay/close controls, and role-specific identity styling without changing existing routes or permissions.

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

Admins can open **Create Reminder** at `/admin/create-reminder/rental` and switch between stable **Rental Machine** and **Custom Message** routes without reloading the dashboard shell. Rental Machine embeds the complete rental form and saved drafts directly, including quote calculation, rental payments, reminder configuration, draft editing/deletion/activation, and rental confirmation. Custom Message keeps the standalone bilingual reminder-plan form.

The canonical **Manage Reminders** routes are `/admin/manage-reminders/rental` and `/admin/manage-reminders/custom`. Rental Machines retains complete rental search, detail, payment, extension, return, notes, and cancellation operations; each selected rental also loads only its attached reminder plan for future-row editing, pause/resume, or reasoned cancellation. Reminder-plan actions never alter rental billing or machine availability. Custom Messages lists only standalone plans with their existing search, pagination, detail, editing, pause/resume, and cancellation controls.

The canonical **Reminder Logs** routes are `/admin/reminder-logs/rental` and `/admin/reminder-logs/custom`. The backend separates these histories before pagination. Rows show customer contacts, machine/rental or optional product/plan context, scheduled India time, bilingual content, and independent email/WhatsApp outcomes. Eligible email retries and manual WhatsApp sharing remain available; WhatsApp is marked sent only after explicit admin confirmation. Plan lifecycle editing stays in Manage Reminders.

Custom Message creates standalone reminder plans without requiring a rental. Admins select an existing customer, optionally attach product or machine context, choose an IST start/end period, and create up to 20 reminders before the end time. Shared English/Hindi content can be applied to all rows and then customized per reminder. Each row retains its own offset, email/WhatsApp channels, bilingual subjects, and bilingual messages. Preview uses the backend plan validator, and final creation uses a stable submission key to prevent duplicate submissions. Optional product context is descriptive only and never changes stock or availability.

The rental creation workspace supports **Default reminders** and **Custom reminders**. Default reminders show the calculated 12-hour and 1-hour send times in IST and use both email and WhatsApp. Custom reminders support up to 20 independently configured offsets in minutes, hours, or days, selected delivery channels, optional bilingual subjects, required English and Hindi messages, and calculated IST send times. The dashboard validates duplicate/past/out-of-period schedules and customer contact availability before saving, while the backend remains authoritative. Reminder settings are retained in editable rental drafts and restored when a draft is reopened.

The sidebar exposes exactly **Create Reminders**, **Manage Reminders**, and **Reminder Logs**. These links stay active for either Rental Machines or Custom Messages and navigate inside the persistent dashboard shell. Legacy `/admin/rentals` bookmarks redirect to rental management, while `/admin/rentals?workspace=create` redirects to rental creation. Legacy `/admin/reminders` redirects to rental management.

Manage Reminders plans can be searched by plan/customer/product/contact details and filtered by lifecycle status. Plan details show customer and optional machine/product context, IST period, current version, all occurrence versions, bilingual messages, independent channel outcomes, and failure details. Active plans can be paused, paused plans resumed, active/paused plans cancelled with a reason, individual unsent occurrences cancelled, and future unsent rows edited. Edits preserve sent history and do not recreate a channel that already succeeded for the same reminder row.

Reminder-plan UI tests cover loading, request errors, empty results, long customer/message content, independent channel outcomes, lifecycle actions, and keyboard dismissal of the responsive detail dialog. The list and detail layouts use single-column mobile fallbacks, bounded scrolling, and explicit word breaking for long identifiers and contact values.

For a due WhatsApp reminder, choose **Share on WhatsApp**, inspect the prepared bilingual message, then choose **Open WhatsApp**. Send it inside WhatsApp and use **Mark as sent** to confirm. Opening WhatsApp never marks it sent automatically. Manual confirmation records the admin and timestamp; it does not verify customer delivery or reading.

Automatic email requires backend automation configuration and the external cron wakeup described in `3mt_Server/README.md`. Email **Sent** means accepted by Brevo. **Needs review** means the delivery result was uncertain and automatic retry is withheld to avoid duplicates. Sale and custom reminder creation screens remain separate staged work.

The production cron, automatic Brevo email, and admin-confirmed manual WhatsApp flow were verified on 24 October 2026. Use `../3mt_Server/RENTAL_REMINDER_VERIFICATION.md` for the full release checklist, including extension replacement, cancellation/return cleanup, overdue settlement, restart recovery, and duplicate protection.

## Reminder Workspace Verification

The Create Reminders, Manage Reminders, and grouped Reminder Logs workspaces pass 81 dashboard tests and the optimized production build. Automated coverage includes both routed modes, rental drafts and confirmation payloads, rental lifecycle operations, standalone plan creation and management, grouped overview search/sort/pagination, exact history navigation, starting/confirmation messages, schedule versions, all retained occurrence statuses, provider attempts, independent channel actions, loading/error/empty states, long content, Escape dismissal, admin/employee navigation, sidebar persistence, and legacy redirects with query preservation.

Before publishing these local changes, deploy the compatible backend first, verify health and authenticated scoped occurrence plus grouped-log responses, then deploy the dashboard. Complete the authenticated desktop/mobile, refresh, back/forward, same-customer separation, legacy fallback, and disposable reminder smoke checks from `../3mt_Server/RENTAL_REMINDER_VERIFICATION.md`. Automated success or a cron HTTP 200 does not prove deployed MongoDB results, inbox receipt, or WhatsApp receipt.

# Rental Creation and Management (Tasks 14-15)

Admins create rentals at `/admin/create-reminder/rental` and manage them at `/admin/manage-reminders/rental`. Rental creation loads customer accounts and eligible available second-hand machines offered for rent, copies the machine's listed rate/period/deposit as editable starting values, accepts India-local handover and return times, and requests the authoritative quote from the backend.

**Save draft** creates an editable rental without reserving the machine or creating reminders. Drafts can be edited, deleted, or activated later. **Confirm rental** and draft activation require explicit confirmation, atomically mark the machine `on_rent`, and create the immediate bilingual confirmation plus default 12-hour and 1-hour reminders.

The default **Manage rentals** tab provides searchable Active, Due Soon, Overdue, Returned, and Cancelled views. Due Soon means an active rental whose expected return is within the next 24 hours. Opening a row shows the saved customer and machine snapshots, dates, charges, deposit settlement, payments, notes, reminder channel history, and audit history.

Rental and reminder pages use reusable workspace components so Create, Manage, and Logs show fixed views without duplicating forms or API behavior. Rental setup data is requested only when creation/drafts are visible. Reminder plan management is scoped to rental or standalone plans, and delivery history uses the matching server scope.

Reminder Logs uses the grouped backend overview rather than listing every delivery occurrence separately. Rental Machines shows one entry per rental booking, while Custom Messages shows one entry per reminder plan. Customer search, created/scheduled sorting, direction, pagination, manual refresh, compact outcome summaries, and loading/error/empty states are server-backed; dates display in Asia/Kolkata. Opening an entry shows the complete chronological group history, including starting/confirmation messages, schedule versions, bilingual snapshots, independent email/WhatsApp outcomes, provider attempts, errors, and existing eligible email retry or manual WhatsApp actions. Returning preserves the overview query state.

Admins can extend active or overdue rentals with a required note, record additional payments, or cancel an eligible rental with a reason. Return recording requires the actual physical return time and supports approved extra charges, deposit application, an optional payment at return, settlement notes, and machine-condition notes. The backend preview is shown before confirmation and remains authoritative for early-return billing, full-day late rounding, refunds, and remaining balances. An overdue rental keeps the machine `on_rent`; only a confirmed return or eligible cancellation releases it.

# Second-Hand Machine Sales (Task 16)

Admins can open **Sales** at `/admin/sales`. The **Create & edit** tab loads customer accounts and eligible available one-unit second-hand machines offered for sale. It accepts an India-local sale time, agreed price, optional initial payment, payment method/reference, and notes. A sale can be kept as an editable draft or completed immediately; completion atomically marks the physical machine `sold`.

The **Manage sales** tab provides searchable Draft, Completed, and Cancelled history. Opening a sale shows customer and machine snapshots, sale price, payments, remaining balance, refunds, notes, and audit history. Drafts can be edited or completed, and draft/completed sales can receive additional payments up to the saved balance. An unpaid draft may be permanently deleted. A paid draft must instead be cancelled with a reason and an explicit confirmation that the received payment was refunded, preserving its financial history. Completed sales may retain a balance for later collection.
