# 3MT Dashboard

React dashboard for 3MT administrators and employees. Admins manage products and employee submissions; employees can view the catalog and submit new products for approval.

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
