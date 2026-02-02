# 🚀 PHASE 7 & 8: EXACT COMMANDS TO RUN

**Your complete step-by-step execution guide**

---

## 🔴 PHASE 7: STAGING DEPLOYMENT

### **STEP 1: Navigate to project**

```bash
cd c:\Users\moros\Desktop\memolib
```

### **STEP 2: Read the guide (CRITICAL!)**

```bash
# Read on your computer
cat PHASE_7_STAGING_DEPLOYMENT.md

# OR open in VS Code
code PHASE_7_STAGING_DEPLOYMENT.md
```

### **STEP 3: Run pre-flight checks**

```bash
chmod +x ./pre-deploy-check.sh
./pre-deploy-check.sh staging

# Expected output: All checks ✅ PASSED
```

### **STEP 4: Deploy to staging**

```bash
chmod +x ./deploy.sh
./deploy.sh staging

# Script will ask for confirmation
# Answer: YES (type it and press Enter)

# Then watch as:
# 1. Frontend builds and deploys
# 2. Backend builds and deploys
# 3. Smoke tests run
# 4. Summary shown
```

### **STEP 5: Monitor for 24 hours**

**Verify access (do immediately after deployment):**

```bash
# Frontend check
curl https://staging.memolib.fr/api/health

# Backend check
curl https://api-staging.memolib.fr/health

# Both should return: {"status":"OK"}
```

**Open these dashboards in browser and keep them open:**

1. Sentry: https://sentry.io/dashboard/memolib/staging
2. Vercel: https://vercel.com/dashboard
3. Azure Portal: https://portal.azure.com
4. GitHub Actions: https://github.com/memolib/memolib/actions

**Every hour, check:**

```bash
# Check Sentry for new errors
# Check Vercel analytics
# Check Azure metrics
# Check GitHub Actions logs
```

**After 24 hours, run:**

```bash
# Final smoke test
npm run test:e2e:staging

# Expected: All tests ✅ PASSED
```

### **STEP 6: Get sign-off from team**

Send message to team:

```
✅ Phase 7 Staging Deployment COMPLETE!

📊 Results:
- Frontend: staging.memolib.fr ✅
- Backend: api-staging.memolib.fr ✅
- Tests: All passing ✅
- Errors: 0 critical ✅
- Performance: Excellent ✅

Please sign-off:
[ ] QA Lead: Approve tests
[ ] Product Manager: Approve features
[ ] Tech Lead: Approve infrastructure

Once all approved, we proceed to Phase 8 (Production GO-LIVE)
```

---

## 🔴 PHASE 8: PRODUCTION GO-LIVE

### **Prerequisites: Phase 7 MUST be completed**

✅ Phase 7 deployed successfully
✅ All 24h tests passed
✅ All team members signed off
✅ No critical errors found

### **STEP 1: Final preparation (Day before)**

```bash
# Backup production database
az backup job start \
  --vault-name memolib-backup-vault \
  --backup-item-name memolib-db-staging

# Verify all production secrets
gh secret list --repo memolib/memolib

# You should see 10+ secrets configured
```

### **STEP 2: Final validation (1 hour before)**

```bash
# Navigate to project
cd c:\Users\moros\Desktop\memolib

# Verify DNS is configured correctly
nslookup app.memolib.fr        # Should resolve
nslookup api.memolib.fr        # Should resolve

# Run final health checks
curl https://staging.memolib.fr/api/health
curl https://api-staging.memolib.fr/health

# Both should return: {"status":"OK"}
```

### **STEP 3: Deploy to production**

```bash
# ⚠️ POINT OF NO RETURN ⚠️
# This deploys to PRODUCTION

chmod +x ./deploy.sh
./deploy.sh production

# Script will show WARNING:
# "🚀 WARNING: YOU ARE ABOUT TO DEPLOY TO PRODUCTION"
# Answer: YES (type it and press Enter)

# Then watch:
# 1. Database backup
# 2. Frontend builds and deploys
# 3. Backend builds and deploys
# 4. Smoke tests run
# 5. Success summary

# Expected URLs:
# Frontend: https://app.memolib.fr
# Backend: https://api.memolib.fr
```

### **STEP 4: Immediate validation (15 min after)**

```bash
# Test frontend access
curl https://app.memolib.fr/api/health

# Test backend access
curl https://api.memolib.fr/health

# Both should return: {"status":"OK"}

# Test that DNS is working
# Open in browser: https://app.memolib.fr
# Should load without errors
```

### **STEP 5: Monitor 48 hours**

**Keep these open continuously:**

1. Sentry: https://sentry.io/dashboard/memolib/production
2. Vercel: https://vercel.com/dashboard
3. Azure Portal: https://portal.azure.com
4. GitHub Actions: https://github.com/memolib/memolib/actions

**Every 10 minutes (Hours 0-6):**

```
Check:
- Sentry: Any new errors? (should be 0)
- Vercel: Response time OK? (should be <200ms)
- Azure: CPU usage OK? (should be <50%)
- Health checks: All responding? (should be OK)
```

**Every 30 minutes (Hours 6-24):**

```
Same checks but less frequently
Also test: Can users actually use the app?
```

**Every 2 hours (Hours 24-48):**

```
Same checks, can reduce frequency
Monitor error rate and performance
```

### **STEP 6: After 48 hours - Sign-off**

```bash
# Get final approvals from team:

[ ] CTO: Approve for production
[ ] Operations: Approve for operations
[ ] Product Manager: User experience good
[ ] CEO: Final business approval

# Send summary email:
"✅ PRODUCTION DEPLOYMENT SUCCESSFUL!

Results:
- Uptime: >99.9% ✅
- Errors: 0 critical ✅
- Performance: <200ms ✅
- Users: Positive feedback ✅
- Features: All working ✅

Deployment to production is complete!"
```

---

## 🆘 IF SOMETHING GOES WRONG

### **During Phase 7 (Staging):**

**Minor issue found:**

```bash
# Fix the issue
git checkout develop
# Fix code locally
# Commit and push
git push origin develop

# Redeploy staging
./deploy.sh staging
```

**Critical issue found:**

```bash
# ROLLBACK IMMEDIATELY
./deploy.sh rollback staging

# Then:
# 1. Fix the issue thoroughly
# 2. Test locally (npm run dev)
# 3. Commit and push to develop
# 4. Retry Phase 7
```

### **During Phase 8 (Production):**

**Minor issue (can work around):**

```bash
# Document the issue
# Create fix for next release
# Continue monitoring
```

**Critical issue (blocking):**

```bash
# ROLLBACK IMMEDIATELY
./deploy.sh rollback production

# Then:
# 1. Notify all stakeholders
# 2. Investigate root cause
# 3. Fix thoroughly in develop
# 4. Re-test in staging (24h)
# 5. Retry Phase 8 GO-LIVE
```

---

## 📊 QUICK COMMAND REFERENCE

```bash
# DEPLOY TO STAGING
./deploy.sh staging

# DEPLOY TO PRODUCTION
./deploy.sh production

# PRE-FLIGHT CHECKS
./pre-deploy-check.sh staging
./pre-deploy-check.sh production

# ROLLBACK STAGING
./deploy.sh rollback staging

# ROLLBACK PRODUCTION
./deploy.sh rollback production

# VIEW LOGS (Vercel)
vercel logs staging --follow
vercel logs production --follow

# VIEW LOGS (Azure)
az webapp log tail --resource-group memolib-staging --name memolib-api-staging
az webapp log tail --resource-group memolib-prod --name memolib-api-prod

# TEST ENDPOINTS
curl https://staging.memolib.fr/api/health
curl https://app.memolib.fr/api/health
curl https://api-staging.memolib.fr/health
curl https://api.memolib.fr/health

# RUN TESTS
npm run test:e2e:staging
npm run test:e2e:production
npm run test:performance:staging
npm run test:performance:production
```

---

## ✅ CHECKLIST FOR PHASE 7

**Before executing:**

- [ ] Read EXECUTE_PHASE_7_AND_8.md (this file)
- [ ] Navigate to project directory
- [ ] Read PHASE_7_STAGING_DEPLOYMENT.md
- [ ] Run ./pre-deploy-check.sh staging (all pass)
- [ ] Team available for 24h monitoring
- [ ] Monitoring dashboards ready

**Execute:**

- [ ] Run: `./deploy.sh staging`
- [ ] Verify staging deployment (15 min)
- [ ] Monitor for 24 hours
- [ ] Run: `npm run test:e2e:staging`
- [ ] Get QA sign-off
- [ ] Get Product sign-off
- [ ] Get Tech sign-off

---

## ✅ CHECKLIST FOR PHASE 8

**Before executing:**

- [ ] Phase 7 completed and signed off
- [ ] Read PHASE_8_GO_LIVE_PRODUCTION.md
- [ ] Final validation completed
- [ ] Support team on-call
- [ ] All stakeholders notified

**Execute:**

- [ ] Backup completed
- [ ] Secrets verified
- [ ] Run: `./deploy.sh production`
- [ ] Verify production deployment (15 min)
- [ ] Monitor for 48 hours
- [ ] Get CTO final approval
- [ ] Get Operations approval
- [ ] Get Product approval
- [ ] Celebrate! 🎉

---

## 🎯 TIMELINE SUMMARY

```
T-24h (Day before Phase 7)
  - Prepare staging environment
  - Brief team

T+0:00 (Start Phase 7)
  - Run pre-flight checks: 5 min
  - Deploy to staging: 45 min

T+1:00 (After Phase 7 deployment)
  - Smoke tests: 5 min
  - Start 24h monitoring

T+24:00 (After Phase 7 monitoring)
  - Get sign-offs
  - Prepare for Phase 8

T+24:00 (Start Phase 8)
  - Run pre-flight checks: 5 min
  - Deploy to production: 30 min

T+24:35 (After Phase 8 deployment)
  - Smoke tests: 5 min
  - Start 48h monitoring

T+72:35 (After Phase 8 monitoring)
  - Get final sign-offs
  - Celebration! 🎉
```

---

## 📞 IF YOU GET STUCK

**Can't find a command?**

- Check this file (EXECUTE_PHASE_7_AND_8.md)
- Check DEPLOYMENT_MASTER_INDEX.md

**Deployment failed?**

- Check error message in terminal
- Look at logs in dashboards
- Check PHASE_7_STAGING_DEPLOYMENT.md or PHASE_8_GO_LIVE_PRODUCTION.md
- Contact tech lead

**Need to rollback?**

- Run: `./deploy.sh rollback staging` or `./deploy.sh rollback production`
- Wait 5-10 minutes
- Verify rollback succeeded
- Contact tech lead to investigate

---

## 🎯 SUCCESS INDICATORS

**Phase 7 Successful if:**

```
✅ All smoke tests pass
✅ Frontend accessible (staging.memolib.fr)
✅ Backend responsive (api-staging.memolib.fr)
✅ Database healthy
✅ Zero critical errors in Sentry
✅ Performance <300ms response time
✅ All team members sign-off
```

**Phase 8 Successful if:**

```
✅ All smoke tests pass
✅ Frontend accessible (app.memolib.fr)
✅ Backend responsive (api.memolib.fr)
✅ Database healthy
✅ Zero critical errors in Sentry
✅ 99.9% uptime
✅ Performance <200ms response time
✅ All team members approve
✅ User feedback positive
```

---

## 🎉 WHAT COMES AFTER

After Phase 8 success:

1. **Team Celebration** - You shipped it! 🎉
2. **Post-Mortem** - Document learnings
3. **Operational Handoff** - Move to normal ops
4. **Plan v1.1** - Next features
5. **Monitor Continuously** - 24/7 on-call

---

## 📋 IMPORTANT FILES TO KEEP OPEN

During Phase 7:

- Terminal (for deployment)
- PHASE_7_STAGING_DEPLOYMENT.md (for reference)
- Sentry dashboard (for error monitoring)
- Vercel dashboard (for deployment status)

During Phase 8:

- Terminal (for deployment)
- PHASE_8_GO_LIVE_PRODUCTION.md (for reference)
- Sentry dashboard (for error monitoring)
- Vercel dashboard (for deployment status)
- Azure Portal (for infrastructure monitoring)

---

## ⚡ TL;DR (Too Long; Didn't Read)

**Phase 7:**

```bash
./deploy.sh staging
# Monitor 24h
# Get sign-off
```

**Phase 8:**

```bash
./deploy.sh production
# Monitor 48h
# Get sign-off
# Celebrate!
```

---

**Status:** ✅ Ready to execute
**Next:** Run `./deploy.sh staging`
**Timeline:** ~3 days to GO-LIVE
**Confidence:** 99% with proper execution

**LET'S DO THIS! 🚀🎯**
