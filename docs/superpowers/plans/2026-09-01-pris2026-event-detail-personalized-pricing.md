# PRIS 2026 Event Detail Personalized Pricing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/events/[id]` display and pass the same authoritative PRIS 2026 primary ticket selected by the pricing eligibility API instead of choosing Early Bird from generic priority ordering.

**Architecture:** Reuse the existing authenticated `pricingEligibilityApi` introduced for checkout. Event Detail keeps its generic role/sale-window/add-on behavior, but for authenticated users it waits for pricing eligibility; when `applies=true`, `effectiveTicketTypeId` is the only valid primary ticket. When pricing is unresolved or fails, the primary booking card fails closed rather than falling back to Early Bird.

**Tech Stack:** Next.js 16, React 19, TypeScript, TanStack React Query, Vitest.

## Global Constraints

- Do not calculate PRIS cutoff dates, account age, or abstract history in `conference-web`.
- `effectiveTicketTypeId` is authoritative whenever pricing `applies=true`.
- Preserve generic behavior for `applies=false`, student pricing, non-PRIS events, add-ons, quotas, sale windows, SSO return context, and existing-registration handling.
- Do not add dependencies.
- Pricing lookup loading/error for an authenticated user must not expose both Early Bird and Regular or silently pick Early Bird.
- Checkout and backend remain final revalidation boundaries.
- Do not push.

---

### Task 1: Add a Pure Event Primary Ticket Selector

**Files:**
- Create: `src/lib/events/personalizedPrimaryTicket.ts`
- Create: `src/lib/events/personalizedPrimaryTicket.test.ts`

**Interfaces:**
- Consumes: `PricingEligibility` from `src/lib/api/pricingEligibility.ts` and already role/sale-filtered primary `TicketType[]`.
- Produces: `selectPersonalizedPrimaryTicket({ tickets, pricing, personalizationRequired, personalizationReady })` returning `TicketType | null`.

- [ ] **Step 1: Write failing tests**

Cover:
- eligible extension + effective ID `2` returns Early Bird ID `2` even when Regular is also on sale;
- `account_after_cutoff` + effective ID `3` returns Regular ID `3` even when Early Bird sorts first generically;
- `applies=false` preserves existing generic priority selection;
- authenticated personalization unresolved/error (`personalizationRequired=true`, `personalizationReady=false`) returns `null`;
- `applies=true` with missing/null effective ID returns `null`.

- [ ] **Step 2: Run focused test and verify failure**

Run: `npx vitest run src/lib/events/personalizedPrimaryTicket.test.ts`
Expected: FAIL because selector does not exist.

- [ ] **Step 3: Implement the pure selector**

Use existing priority order only for generic `applies=false` / personalization-not-required behavior. For personalized PRIS pricing, match `String(pricing.effectiveTicketTypeId)` exactly against `ticket.id`; do not inspect dates or user facts.

- [ ] **Step 4: Run focused test**

Run: `npx vitest run src/lib/events/personalizedPrimaryTicket.test.ts`
Expected: PASS.

---

### Task 2: Fetch Pricing Eligibility on Event Detail

**Files:**
- Modify: `src/app/events/[id]/page.tsx`

**Interfaces:**
- Consumes: `pricingEligibilityApi.get(eventId, 'THB')`.
- Produces: `pricingEligibility`, `isPricingLoading`, `isPricingError`, `refetchPricing` state used by ticket selection/UI.

- [ ] **Step 1: Add React Query pricing request**

Use the resolved numeric `event.id` (the route itself may be `/events/PRIS-2026`, so `Number(id)` is invalid). Query key: `['pricing-eligibility', event?.id, 'THB', authUser?.id]`, enabled only for authenticated users with a resolved integer `event.id` and user id, `retry: 1`, `staleTime: 30000`.

- [ ] **Step 2: Keep generic event/ticket requests unchanged**

Do not change event fetching, student eligibility, purchases, add-ons, or role filtering.

---

### Task 3: Replace Generic Auto-Selection with Authoritative Selection

**Files:**
- Modify: `src/app/events/[id]/page.tsx`

**Interfaces:**
- Consumes: on-sale, role-allowed primary tickets plus pricing state from Task 2.
- Produces: `autoSelectedTicket` used by Booking Summary and checkout query.

- [ ] **Step 1: Keep role + sale-window filtering**

Build primary candidates exactly as today using `isTicketAllowedForUser` and `isTicketOnSale`.

- [ ] **Step 2: Apply pure selector**

For authenticated users, `personalizationRequired=true`; `personalizationReady` is true only when pricing query completed successfully. For anonymous users, use generic behavior.

- [ ] **Step 3: Ensure checkout URL uses the authoritative ticket**

Keep existing `checkoutParams.set('ticket', String(autoSelectedTicket.id))`; because `autoSelectedTicket` is now authoritative, `/checkout/:eventId?ticket=...` receives ID `3` for an account after cutoff and ID `2` for an eligible extension account.

---

### Task 4: Fail Closed in the Booking Summary

**Files:**
- Modify: `src/app/events/[id]/page.tsx`

**Interfaces:**
- Consumes: pricing loading/error/refetch state.
- Produces: clear retry UI without a misleading primary price.

- [ ] **Step 1: Suppress misleading generic primary ticket while authenticated pricing is unresolved**

Do not render Early Bird/Regular primary pricing from generic priority during loading or error.

- [ ] **Step 2: Render pricing error notice with retry**

Copy: `ไม่สามารถตรวจสอบอัตราค่าลงทะเบียนของบัญชีนี้ได้ กรุณาลองใหม่อีกครั้ง`
Button invokes `refetchPricing()`.

- [ ] **Step 3: Keep add-ons and existing-registration states unchanged**

Do not block existing-registration UI or unrelated add-on data.

---

### Task 5: Verification and Commit

**Files:**
- Test: `src/lib/events/personalizedPrimaryTicket.test.ts`
- Verify changed page and existing pricing tests.

- [ ] **Step 1: Focused tests**

Run:
`npx vitest run src/lib/events/personalizedPrimaryTicket.test.ts src/lib/api/pricingEligibility.test.ts src/lib/checkout/prisPricing.test.ts`
Expected: all pass.

- [ ] **Step 2: Full test suite**

Run: `npm test -- --run`
Expected: pass.

- [ ] **Step 3: Targeted lint**

Run: `npx eslint src/app/events/[id]/page.tsx src/lib/events/personalizedPrimaryTicket.ts src/lib/events/personalizedPrimaryTicket.test.ts`
Expected: 0 errors from changed files.

- [ ] **Step 4: Production build**

Run: `npm run build`
Expected: pass.

- [ ] **Step 5: Review**

Run `git diff --check`, inspect `git diff`, and verify no frontend cutoff/account/abstract-history logic was introduced.

- [ ] **Step 6: Commit locally only**

Commit title:
`fix: personalize PRIS event ticket summary`

Commit body:
- use authoritative pricing eligibility on event detail before showing a primary ticket
- display and forward the API-selected effective ticket instead of generic Early Bird priority
- fail closed with retry when personalized pricing cannot be resolved
- add regression coverage for after-cutoff and Early Bird-eligible accounts

Do not push.
