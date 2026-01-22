# 🚀 Quick Start Guide - Phase 2 Workspace UI

## 📋 What's New

You now have a complete workspace management system with:
- ✅ Create new workspaces (OQTF, Asile, etc.)
- ✅ Edit existing workspaces
- ✅ Delete/Archive workspaces
- ✅ Real-time collaboration (multiple users)
- ✅ WebSocket updates

---

## 🎯 User Guide

### Creating a New Workspace

1. **Navigate to Workspaces**
   ```
   http://localhost:3000/workspaces
   ```

2. **Click "+ Nouveau Dossier"** (top-right button)

3. **Fill the Form:**
   - **Title** (required): Ex: "OQTF - M. DUPONT"
   - **Procedure Type** (required): Select from dropdown (OQTF, Asile, etc.)
   - **Client ID** (required): Enter client UUID
   - **Description** (optional): Details about the case
   - **Urgency Level**: faible/moyen/eleve/critique
   - **Status**: active/pending/closed/archived
   - **Notification Date** (optional): When client was notified
   - **Deadline Date** (optional): Action deadline

4. **Click "Créer le dossier"**

5. **Automatic Redirect** to detail view

---

### Editing a Workspace

1. **Open Workspace Detail**
   - Click on any WorkspaceCard in the list
   - Or navigate to `/workspaces/[id]`

2. **Click "Modifier"** button (top-right)

3. **Update Fields** in the modal

4. **Click "Mettre à jour"**

5. **Modal Closes** - Changes appear immediately
   - Other users see updates in real-time via WebSocket

---

### Archiving a Workspace

1. **Open Workspace Detail**

2. **Click "Archiver"** button (red, top-right)

3. **Confirm** the action

4. **Automatic Redirect** to list page

5. **Workspace Status** changes to "archived"
   - Data preserved (soft delete)
   - Still accessible for audit trail

---

### Quick Status Update

1. **Open Workspace Detail**

2. **Scroll to Sidebar** (right side)

3. **Click Status Dropdown** in "Informations" section

4. **Select New Status**:
   - Actif
   - En attente
   - Clôturé
   - Archivé

5. **Auto-saves** on change

---

## 🔄 Real-Time Collaboration

### How It Works

- **WebSocket Connection** established when viewing workspace details
- **Automatic Updates** when other users make changes
- **No Refresh Needed** - data updates live

### Testing Real-Time

1. **Open Same Workspace** in 2 browser tabs
2. **Edit in Tab 1** - Click "Modifier", change title, save
3. **Watch Tab 2** - Updates automatically within 1-2 seconds

---

## 🎨 UI Features

### WorkspaceCard (List View)
- **Procedure Color Border** - Visual identification (OQTF=red, Asile=blue, etc.)
- **Urgency Badge** - Color-coded urgency level
- **Stats Grid** - Checklist progress, document count, alert count
- **Deadline Timer** - Time remaining until deadline

### WorkspaceDetails (Detail View)
- **Tabs** - Overview, Documents, Timeline, Notes
- **Breadcrumb** - "Dossiers CESDA > [Title]"
- **Action Buttons** - Modifier, Partager, Archiver
- **Deadline Status** - Color-coded urgency (red/orange/yellow/green)
- **Stats Sidebar** - Quick metrics and metadata
- **Status Dropdown** - Quick status changes

---

## 🐛 Troubleshooting

### "Client non trouvé" Error
**Problem:** Client ID doesn't exist or belongs to different tenant
**Solution:** 
1. Verify client exists: `/api/clients`
2. Check you're using correct tenant
3. Create client first if needed

### WebSocket Not Connecting
**Problem:** `/api/socket` endpoint not available
**Solution:**
1. Ensure dev server running: `npm run dev`
2. Check port 3000 not blocked
3. Check browser console for errors
4. Verify Socket.io installed: `npm list socket.io-client`

### Form Validation Errors
**Problem:** "Champs requis manquants"
**Solution:**
- **Title** must be filled
- **Procedure Type** must be selected
- **Client ID** must be valid UUID

### Changes Not Appearing
**Problem:** Edits don't show immediately
**Solution:**
1. Check network tab for API errors
2. Verify session still valid (not logged out)
3. Hard refresh: Ctrl+Shift+R (Windows)
4. Check browser console for errors

---

## 💡 Pro Tips

### Keyboard Shortcuts
- **Esc** - Close modal (WorkspaceForm)
- **Ctrl+Click** on WorkspaceCard - Open in new tab

### Best Practices
1. **Always Fill Deadline Date** for OQTF cases (critical urgency)
2. **Use Descriptive Titles** - Include client name and procedure type
3. **Update Status Regularly** - Keeps workspace list accurate
4. **Archive Old Cases** - Keeps list clean without deleting data

### Performance Tips
- **Filter by Procedure Type** when list gets large
- **Archive Completed Cases** to reduce query load
- **Use Quick Status Dropdown** instead of edit modal for simple updates

---

## 📊 Understanding Urgency Levels

### Deadline Color Coding
- **🔴 Red** - Less than 48 hours (CRITICAL)
- **🟠 Orange** - 2-7 days (URGENT)
- **🟡 Yellow** - 7-14 days (WARNING)
- **🟢 Green** - 14+ days (NORMAL)

### Urgency Level Options
- **Critique** - Immediate action required (OQTF sans délai)
- **Élevé** - High priority (short deadline)
- **Moyen** - Normal priority
- **Faible** - Low priority (long deadline)

---

## 🔒 Security Notes

### Tenant Isolation
- ✅ You can ONLY see workspaces in your tenant
- ✅ API blocks cross-tenant access automatically
- ✅ Client verification ensures data integrity

### Audit Trail
- ✅ All actions logged with userId and timestamp
- ✅ Soft delete preserves history
- ✅ Changes tracked in audit log

---

## 🧪 Testing Your Setup

### Quick Health Check
```bash
# 1. Start dev server
npm run dev

# 2. Open browser
http://localhost:3000/workspaces

# 3. Check console (F12)
# Should see: "WebSocket connected" when viewing workspace detail

# 4. Create test workspace
# Click "+ Nouveau Dossier"
# Fill required fields
# Submit

# 5. Verify creation
# Should redirect to detail view
# Check database: npx prisma studio
```

### Database Verification
```bash
# Open Prisma Studio
npm run db:studio

# Navigate to Workspace table
# Verify your new workspace appears
# Check tenantId matches your session
```

---

## 📞 Get Help

### Common Issues
- **403 Forbidden** → Not logged in or wrong role
- **404 Not Found** → Workspace doesn't exist or wrong tenant
- **500 Server Error** → Check server logs in terminal

### Debug Mode
```javascript
// In browser console
localStorage.setItem('debug', 'socket.io-client:*')
// Refresh page - see WebSocket debug logs
```

### Logs
- **Server Logs** - Check terminal running `npm run dev`
- **Browser Logs** - Press F12, check Console tab
- **Network Logs** - F12, Network tab, filter by `api/`

---

**Ready to Use! 🎉**

The workspace management system is now fully functional and ready for production use. Start creating, editing, and collaborating on workspaces with real-time updates!

