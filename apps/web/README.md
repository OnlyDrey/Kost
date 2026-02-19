# Kost - Web App

A Progressive Web Application (PWA) for managing shared expenses and invoices.

## Features

- **PWA Support**: Installable, works offline
- **Multi-language**: Norwegian (default) and English
- **Dark/Light Theme**: Automatic detection with manual toggle
- **Offline Queue**: Mutations are queued when offline and synced when online
- **Material UI**: Modern, responsive design
- **Flexible Authentication**: Password-based (default), magic links (optional), or passkeys (optional)
- **Real-time Updates**: React Query for efficient server state management

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Material-UI (MUI)** for components
- **React Router** for navigation
- **React Query** for server state management
- **i18next** for internationalization
- **Dexie** for IndexedDB (offline cache)
- **Workbox** for service worker and offline support
- **Axios** for API requests

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your API URL
```

### Development

```bash
# Start development server
npm run dev

# The app will be available at http://localhost:3001
```

### Build

```bash
# Type check
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/        # Reusable components
│   ├── Common/       # Shared components
│   ├── Invoice/      # Invoice-specific components
│   └── Layout/       # Layout components
├── hooks/            # Custom React hooks
├── i18n/             # Internationalization
├── idb/              # IndexedDB (Dexie) setup
├── pages/            # Page components
├── routes/           # React Router configuration
├── services/         # API services
├── stores/           # Context providers
├── sw/               # Service worker
└── utils/            # Utility functions
```

## Key Features

### Invoice Management

- Create invoices with three distribution methods:
  - **Equal Split**: Divide equally among family members
  - **Custom Split**: Manually specify each person's share
  - **Income-Based Split**: Automatically calculate based on income ratios
- View invoice details with allocation explanations
- Filter and search invoices

### Period Management

- Create and manage billing periods
- Close periods (Admin only)
- View period statistics

### Offline Support

- Service worker caches assets and API responses
- Offline queue for mutations (create, update, delete)
- Automatic sync when connection is restored
- IndexedDB cache for data persistence

### Settings

- Toggle between light and dark themes
- Switch between Norwegian and English
- Preferences saved to localStorage

## Environment Variables

```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Kost
```

**Note:** In production, use your external reverse proxy's HTTPS URL (e.g., `https://finance.yourdomain.com/api`).

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with PWA support

## PWA Installation

The app can be installed on desktop and mobile devices:

1. Visit the app in a supported browser
2. Look for the "Install" prompt or add to home screen option
3. Follow the browser-specific installation steps

## Offline Functionality

The app works offline with the following capabilities:

- **Cached Pages**: All visited pages are cached
- **Cached Data**: Recently viewed data is cached in IndexedDB
- **Offline Queue**: Create/update/delete operations are queued when offline
- **Auto Sync**: Queue is automatically processed when online

## Development Notes

### Currency Handling

All amounts are stored in cents (integers) and converted to kr for display:
- Backend: amounts in cents (e.g., 150000 = 1,500.00 kr)
- Frontend: display with `formatCurrency()` utility

### Date Handling

All dates are stored in ISO format (YYYY-MM-DD) and formatted for display using the `formatDate()` utility.

### Authentication

The app supports multiple authentication methods configured on the backend:

**Password Authentication (Default):**
1. User enters email and password
2. Backend verifies credentials
3. JWT token issued and stored in HTTP-only cookie
4. No SMTP configuration required

**Magic Link Authentication (Optional, requires SMTP):**
1. User enters email
2. Backend sends email with magic link
3. User clicks link with token
4. Frontend verifies token and logs in
5. JWT stored in HTTP-only cookie

**Passkey/WebAuthn Authentication (Optional):**
1. User registers a passkey (biometric or hardware key)
2. Future logins use the registered passkey
3. Most secure option with phishing resistance
4. Requires HTTPS in production

At least one authentication method must be enabled on the backend via environment variables (`AUTH_PASSWORD_ENABLED`, `AUTH_MAGIC_LINK_ENABLED`, `AUTH_PASSKEY_ENABLED`).

## Contributing

1. Follow TypeScript best practices
2. Use Material-UI components
3. Maintain i18n support for new features
4. Test offline functionality
5. Keep accessibility in mind

## License

Private - Family use only
