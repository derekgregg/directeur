# Garmin Connect Developer Program Agreement

Source: Not publicly available
Status: 2026-03-16

---

The Garmin Connect Developer Program Agreement is **not published publicly** on the Garmin developer website. It is provided to developers during the application and approval process.

To obtain the agreement:
1. Apply at [developer.garmin.com/gc-developer-program](https://developer.garmin.com/gc-developer-program/overview/)
2. Click "Request Now" to submit a business application
3. Garmin reviews applications (~2 business days)
4. The agreement (referenced as "FRM-0952 Rev. B" in documentation) is provided during onboarding

## Key Terms (from API documentation and brand guidelines)

Based on the publicly available API documentation and brand guidelines (v6.30.2025):

### Attribution
- Must display "Garmin [device model]" attribution on every data display
- Attribution must be above the fold
- Must follow Garmin brand guidelines for logo usage

### Data Use
- Activity data can be retained while user has an active account with your application
- Must delete user data upon deregistration (Garmin sends a push notification)
- No explicit prohibition on AI/ML training (requires attribution for derived data)

### Privacy
- Must comply with GDPR/CCPA
- Must have a privacy policy
- Must obtain user consent via OAuth

### Technical
- OAuth 2.0 PKCE required (OAuth 1.0a retiring 12/31/2026)
- Push-based webhook architecture
- Activity Details (per-second data including power) is a premium data type requiring special access request

When we receive the actual agreement during the application process, this file should be updated with the full text.
