# Technical Readiness Document

## Executive Summary
QuickBihar platform is beta/staging ready. Server API and deployable web builds are production-capable. Mobile native builds need verification, frontend lint/type cleanup remains.

## Current Status

### Ready ✅
- Server API: TypeScript + Bun production build passes, delivery tests pass
- Redis: Internal Docker network only configuration hardened
- Next.js dashboard: Build-ready (requires Google Fonts network)
- Expo Web storefront: Build-ready with --max-workers 2
- CI/CD: GitHub Actions builds/pushes Docker images and deploys on VPS

### Needs Work ⚠️
- Android/iOS app: Not verified with EAS and production env vars
- Frontend type/lint: Type errors in web, mobile React compiler/hook issues
- Production ops: SSL, CORS, live Razorpay keys, Firebase config
- Native app verification needed with EAS
- Frontend debt cleanup before serious production launch

## Critical Technical Issues

### High Priority
1. **CORS_ORIGIN**: Must include `https://quickbihar.in,https://www.quickbihar.in`
2. **Razorpay**: Live keys only after smoke tests pass on staging
3. **Firebase**: APNs/FCM credentials for Android/iOS bundle ID
4. **MongoDB**: VPS public IP allowlisted (not wide-open network)
5. **SSL**: Certbot/Let’s Encrypt required before public launch

### Medium Priority  
1. **Frontend lint/type errors**: Build passes but debt exists
2. **Mobile type verification**: Hugeicons/Lottie type errors
3. **Onboarding tests**: Redis not running locally, old test payloads no match
4. **Revenue**: Payment verification tests failing due to schema mismatches

## Deployment Preparation

### Required Production Environment (.env)
```env
NODE_ENV=production
PORT=8000
MONGODB_URI=... (allowed from VPS)
REDIS_URL=redis://redis:6379
CORS_ORIGIN=https://quickbihar.in,https://www.quickbihar.in
ACCESS_TOKEN_SECRET=...
REFRESH_TOKEN_SECRET=...
IMAGEKIT_PUBLIC_KEY=...
IMAGEKIT_PRIVATE_KEY=...
IMAGEKIT_URL_ENDPOINT=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
RESEND_API_KEY=...
```

### Recommended Launch Path

1. **Staging**: Oracle VPS private deployment first
2. **Nginx**: Use `deploy/nginx/quickbihar.path-based.conf`
3. **CORS**: Include production domains
4. **Expo Web**: `npx expo export --platform web --max-workers 2 --clear`
5. **Docker**: Copy `mobile/dist` to Nginx root
6. **Smoke Test**:
   - Open `/admin/login`, `/seller/login`, `/delivery/login`
   - Call `/api/v1/app-config` and login as admin  
   - Create quote from checkout
   - Verify Socket.IO connections
   - Run Razorpay test payment
7. **Go Live**: Switch Razorpay to live, publish mobile app

## Blocking Items

1. Production CORS not correctly configured
2. Real Razorpay keys required before production launch  
3. Android/iOS EAS verification with `EXPO_PUBLIC_*` URLs
4. Frontend lint/type debt accumulation
5. Mobile platform verification incomplete
6. SSL not installed on Nginx
7. Firebase push credentials configured
8. Local secrets need rotation

## Risk Assessment

### Low Risk ✅
- Server and web builds work
- Docker Compose syntax ready
- CI/CD pipeline functional
- API design validated through delivery tests

### Medium Risk ⚠️
- Frontend lint/type debt
- Mobile platform reliability
- Production environment configuration
- Mobile type verification

### High Risk ❌
- Revenue-critical payment integration
- Native mobile app readiness
- Onboarding process reliability

## Developer Entry Points

| Area | Command |
|------|---------|
| Customer API | `server/src/modules/*`, `mobile/src/features/*/api` |
| Admin dashboard | `web/src/features/dashboard` |
| Seller dashboard | `web/src/features/seller` |
| Rider feature | `server/src/modules/delivery`, `mobile/src/features/Delivery` |
| Checkout logic | `server/src/modules/order`, `mobile/src/features/Clothings/order` |
| Serviceability | `server/src/modules/store/serviceability.service.ts` |
| Payment | `server/src/utils/razorpay.util.ts` |
| Deployment | `docker-compose.yml`, `deploy/nginx/quickbihar.path-based.conf` |

## Next Steps

**Immediate (staging ready)**:
- Deploy staging with production CORS values
- Configure Nginx
- Run smoke tests

**Pre-production (blockers)**:  
- Fix frontend lint/type errors
- Verify Android/iOS builds with EAS
- Configure SSL
- Rotate all production secrets

**Post-launch**: Continue frontend debt cleanup, monitor mobile app stability