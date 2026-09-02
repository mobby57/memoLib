# Setup Uptime Monitoring — MemoLib

**Objective** : Monitor that memolib.space is up 24/7  
**Tool** : Uptime Robot (free tier)  
**Estimated time** : 15 minutes

---

## Step 1: Create Uptime Robot Account

1. Go to https://uptimerobot.com
2. Click "Sign Up"
3. Use email: monitoring@memolib.space (or your team email)
4. Create account

---

## Step 2: Add Monitor

### Monitor 1: Main API Health

```
Monitor Type: HTTPS (Ping)
URL: https://memolib.space/api/health

Check Interval: 5 minutes (default)
Timeout: 30 seconds

Alert Contact:
  ✅ Email: devops@memolib.space
  ✅ Slack (if premium) or use IFTTT
```

### Monitor 2: Database Health (Optional)

```
Monitor Type: Keyword (HTTP Response Contains)
URL: https://memolib.space/api/admin/health
Keyword to check: "database": "ok"

Check Interval: 15 minutes
```

### Monitor 3: Frontend

```
Monitor Type: HTTPS
URL: https://memolib.space

Check Interval: 10 minutes
```

---

## Step 3: Enable Slack Notifications

### Option A: Uptime Robot Premium
If you upgrade to premium, Uptime Robot has native Slack integration.

### Option B: Free Alternative (IFTTT)

1. Go to https://ifttt.com
2. Create applet:
   - **If**: Uptime Robot (any monitor goes down)
   - **Then**: Slack (send message to #alerts-production)

3. Template message:
```
🔴 ALERT: {{MonitorFriendlyName}} is DOWN
Status: {{MonitorStatus}}
Duration: {{MonitorTotalDowntimes}}
Time: {{EventTime}}
```

---

## Step 4: Verify Setup

1. Check Uptime Robot dashboard
2. All 3 monitors should show "Up"
3. Test alert by temporarily stopping the app (or manually trigger)

---

## Expected Behavior

- ✅ If API down > 5 min → Email alert sent
- ✅ If API down > 10 min → Slack notification
- ✅ Status page: https://uptimerobot.com/statuspage

---

## Dashboard

- **Public status page** (share with pilots): `https://uptimerobot.com/statuspage`
- **Private dashboard** : https://uptimerobot.com/dashboard

---

## Cost

- **Free tier** : 50 monitors, 5-minute checks, email alerts
- **Sufficient for pilot** ✅

---

## Alternative: Better Stack (recommended if you want more features)

https://betterstack.com

- Better Slack integration
- Nicer dashboards
- Free tier: 10 monitors
- $10/month for 50+ monitors

---

**Status** : ✅ Setup takes 15 minutes, no code required.

