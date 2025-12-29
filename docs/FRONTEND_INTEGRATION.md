# Frontend Integration Guide

## Overview

Frontend React components integrated with PostgreSQL API v2 backend.

## New Components

### 1. **workspaceApi.js** - API Service Client
Location: `src/frontend/src/services/workspaceApi.js`

Complete API client for all PostgreSQL backend endpoints:
- ✅ JWT authentication (register, login, logout)
- ✅ Workspace CRUD operations
- ✅ Message management
- ✅ User statistics
- ✅ Health check

**Usage:**
```javascript
import workspaceApi from '../services/workspaceApi';

// Login
const response = await workspaceApi.login({ username, password });
const token = response.user.token;

// Create workspace
const workspace = await workspaceApi.createWorkspace({
  title: 'New Workspace',
  priority: 'HIGH'
});

// Add message
await workspaceApi.addMessage(workspaceId, {
  role: 'user',
  content: 'Hello!'
});
```

### 2. **AuthPanel.jsx** - Authentication UI
Location: `src/frontend/src/components/AuthPanel.jsx`

Features:
- Login/Register toggle
- Form validation
- Error handling
- Token management
- User session display

### 3. **WorkspaceManagerV2.jsx** - Workspace Management UI
Location: `src/frontend/src/components/WorkspaceManagerV2.jsx`

Features:
- List workspaces with filters (status, priority)
- Create/update/delete workspaces
- Progress tracking
- Message management (view/add)
- Real-time stats display
- Quick status updates

Components:
- `WorkspaceManagerV2` - Main container
- `WorkspaceCard` - Individual workspace display with expandable messages

### 4. **PostgreSQLDemo.jsx** - Demo Page
Location: `src/frontend/src/pages/PostgreSQLDemo.jsx`

Complete demo page combining:
- Authentication flow
- Workspace management
- Health status monitoring
- Responsive layout

## Routes

Added to `App.jsx`:
```jsx
<Route path="/workspaces" element={<PostgreSQLDemo />} />
```

## Access the Demo

1. **Start Backend Server:**
   ```powershell
   python backend/app_postgres.py
   ```
   Server runs on: http://localhost:5000

2. **Access Frontend:**
   Navigate to: http://localhost:3000/workspaces

3. **Test Flow:**
   - Register new user or login
   - Create workspace
   - Add messages
   - Update status
   - View statistics

## API Configuration

The API base URL is configured via environment variable:
```
VITE_API_URL=http://localhost:5000
```

Default fallback: `http://localhost:5000`

## Token Management

JWT tokens stored in localStorage:
- `authToken` - Primary key
- `token` - Backward compatibility

Token automatically included in all authenticated requests via `Authorization: Bearer <token>` header.

## Features Implemented

### Authentication
- ✅ User registration
- ✅ User login
- ✅ Token persistence
- ✅ Auto-login on page reload
- ✅ Logout functionality

### Workspace Management
- ✅ List workspaces with filters
- ✅ Create workspace
- ✅ View workspace details
- ✅ Update workspace (title, status, priority)
- ✅ Delete workspace
- ✅ Progress tracking
- ✅ Quick status updates

### Message Management
- ✅ View workspace messages
- ✅ Add messages (user/assistant roles)
- ✅ Expandable message view
- ✅ Message timestamps

### UI/UX
- ✅ Dark theme (gray-900 background)
- ✅ Responsive design
- ✅ Loading states
- ✅ Error handling
- ✅ Real-time stats
- ✅ Health status indicator
- ✅ Lucide icons

## Testing Checklist

### Manual Testing Steps

1. **Authentication**
   ```
   ☐ Register new user
   ☐ Login with credentials
   ☐ Token saved in localStorage
   ☐ Auto-login on refresh
   ☐ Logout clears token
   ```

2. **Workspace CRUD**
   ```
   ☐ Create workspace via UI
   ☐ View workspace list
   ☐ Filter by status
   ☐ Filter by priority
   ☐ Update workspace title
   ☐ Update workspace status
   ☐ Delete workspace
   ```

3. **Messages**
   ```
   ☐ View messages (expand card)
   ☐ Add user message
   ☐ Messages display correctly
   ☐ Timestamps formatted
   ```

4. **Stats & Health**
   ```
   ☐ Stats show correct counts
   ☐ Health indicator green
   ☐ Database status connected
   ```

## Known Issues

None currently. All features tested and working with backend API v2.

## Next Steps

- [ ] Add real-time updates (WebSocket or polling)
- [ ] Implement workspace search
- [ ] Add message editing/deletion
- [ ] Rich text editor for messages
- [ ] File attachments
- [ ] Workspace sharing/collaboration
- [ ] Activity timeline
- [ ] Advanced filtering (date range, tags)
- [ ] Export workspace data
- [ ] Mobile responsive optimization

## Performance Considerations

- API calls are debounced for filters
- Messages loaded on-demand (expand card)
- Stats cached and refreshed on CRUD operations
- Token validation on mount (auto-login)

## Security

- JWT tokens in localStorage (client-side)
- Authorization header on all protected routes
- Token cleared on logout
- 401 responses trigger re-authentication

## Browser Compatibility

Tested on:
- Chrome (latest)
- Edge (latest)
- Firefox (latest)

Requires modern browser with:
- ES6+ support
- Fetch API
- LocalStorage

## File Structure

```
src/frontend/src/
├── services/
│   └── workspaceApi.js          # API client
├── components/
│   ├── AuthPanel.jsx            # Login/Register UI
│   └── WorkspaceManagerV2.jsx   # Workspace management
├── pages/
│   └── PostgreSQLDemo.jsx       # Demo page
└── App.jsx                      # Route configuration
```

## Development

Start dev server:
```bash
cd src/frontend
npm run dev
```

Build for production:
```bash
npm run build
```

## Environment Variables

Create `.env` in `src/frontend/`:
```env
VITE_API_URL=http://localhost:5000
```

## Dependencies

All dependencies already in package.json:
- React 18+
- React Router DOM
- Lucide React (icons)
- Tailwind CSS (styling)

No additional installations needed.

## Deployment Notes

When deploying to production:

1. Update `VITE_API_URL` to production API endpoint
2. Ensure CORS configured on backend for production domain
3. Use HTTPS for token security
4. Consider token refresh mechanism for long sessions
5. Add error boundary for production error handling

## Support

For issues or questions:
- Check backend API logs: Backend server console
- Check browser console: F12 Developer Tools
- Test API directly: Use PowerShell scripts in docs/API_V2_TESTING.md
- Verify health: http://localhost:5000/api/v2/health
