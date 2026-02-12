# Quick Start Guide

## Installation

```bash
cd /home/user/PaycheckApp/apps/web

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

## Configuration

Edit `.env` file:

```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Family Finance
```

## Development

```bash
# Start development server
npm run dev

# App runs on http://localhost:3000
# API proxy to http://localhost:3001
```

## First Time Setup

1. Start the API server (see `/home/user/PaycheckApp/apps/api`)
2. Visit http://localhost:3000
3. Enter your email on the login page
4. Check your email for the magic link
5. Click the link to log in

## Key Features to Test

### 1. Dashboard
- View current period status
- See total invoices and amounts
- Check your share of expenses
- View recent invoices

### 2. Create Invoice
- Click "Add Invoice" button
- Fill in invoice details:
  - Description (e.g., "Electricity bill")
  - Amount in kr (e.g., 1500.00)
  - Category (optional)
  - Invoice date
  - Distribution method:
    - **Equal**: Split evenly
    - **Custom**: Specify each person's share
    - **Income-Based**: Calculate based on income ratios

### 3. View Invoice Details
- Click on any invoice from the list
- See allocation explanation
- View individual shares
- See breakdown by user

### 4. Period Management (Admin Only)
- Navigate to Periods
- View all periods
- Create new period
- Close period (locks it from changes)

### 5. Settings
- Toggle between light/dark theme
- Switch language (English/Norwegian)
- Preferences are saved automatically

## Testing Offline Mode

1. Open DevTools (F12)
2. Go to Network tab
3. Check "Offline" checkbox
4. Try creating an invoice
5. Request is queued
6. Uncheck "Offline"
7. Queue automatically syncs

## PWA Installation

### Desktop (Chrome/Edge)
1. Visit http://localhost:3000
2. Look for install icon in address bar
3. Click to install

### Mobile
1. Visit site in mobile browser
2. Tap "Add to Home Screen"
3. App installs like native app

## Development Tips

### Hot Module Replacement
- Changes to React components reload instantly
- No need to refresh browser

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

### Building
```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/      # Reusable UI components
├── hooks/          # Custom React hooks
├── i18n/           # Translations (en, nb)
├── idb/            # IndexedDB (offline cache)
├── pages/          # Route pages
├── routes/         # React Router setup
├── services/       # API services
├── stores/         # Context providers
├── sw/             # Service worker
└── utils/          # Utilities (currency, date)
```

## Common Issues

### API Connection Error
- Ensure API is running on port 3001
- Check VITE_API_URL in .env
- Verify CORS settings in API

### Magic Link Not Working
- Check email service configuration in API
- Verify email is being sent
- Check spam folder

### PWA Not Installing
- Must use HTTPS in production
- Localhost works for development
- Check service worker registration

### Theme Not Persisting
- Check browser localStorage
- Clear cache and reload
- Check console for errors

## Browser DevTools

### React DevTools
- Install React DevTools extension
- View component hierarchy
- Inspect props and state

### Redux DevTools (for React Query)
- Install Redux DevTools extension
- View React Query cache
- Track mutations

### Service Worker
- Chrome DevTools > Application > Service Workers
- View registered service workers
- Force update or unregister

### Cache Storage
- Chrome DevTools > Application > Cache Storage
- View cached resources
- Clear cache if needed

### IndexedDB
- Chrome DevTools > Application > IndexedDB
- View FamilyFinanceDB database
- Inspect cached data and queue

## Environment Variables

Available variables:

```env
# Required
VITE_API_URL=http://localhost:3001/api

# Optional
VITE_APP_NAME=Family Finance
```

## Keyboard Shortcuts

- `Ctrl/Cmd + K`: Quick search (future feature)
- `Ctrl/Cmd + /`: Toggle sidebar (mobile)
- `Esc`: Close modals/dialogs

## Currency Format

All amounts are in Norwegian kroner (kr):
- Input: 1500.00
- Display: 1 500,00 kr
- Storage: 150000 (cents)

## Date Format

All dates are in ISO format:
- Input: 2024-01-15
- Display: 15. jan. 2024 (Norwegian)
- Display: Jan 15, 2024 (English)

## Support

For issues or questions:
1. Check README.md
2. Check IMPLEMENTATION_SUMMARY.md
3. Review error logs in browser console
4. Check network tab for API errors

## Next Steps

After setup:
1. Create your first period
2. Add some invoices
3. Invite family members (from API)
4. Test offline functionality
5. Install as PWA
6. Explore all features

Happy budgeting!
