# PRIS 2026 Personalized Checkout Pricing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `conference-web` display and submit only the PRIS 2026 primary ticket rate selected by the authoritative API pricing policy, while leaving all non-PRIS, student, add-on, currency, promo-code, and payment flows unchanged.

**Architecture:** Add a typed API client for the authenticated `/api/tickets/pricing-eligibility` contract. The checkout page continues loading the public event/ticket catalogue, but when the API says PRIS personalized pricing applies, primary package options are restricted to `effectiveTicketTypeId`. Stored/stale package selections are invalidated when they no longer match eligibility. Backend remains authoritative and revalidates preview/create-intent, so frontend never calculates cutoff or abstract history itself.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, TanStack React Query 5, Vitest 4, Testing Library, existing API client and checkout wizard.

## Global Constraints

- Depend on API plan `conference-api/docs/superpowers/plans/2026-08-31-pris2026-round2-pricing-abstract-policy.md`.
- Do not inspect or fetch abstract history from `conference-web`.
- Do not compare account/abstract cutoff dates in frontend.
- Do not calculate whether a user is Early Bird eligible from `user.createdAt`, `registeredFromEvent`, or current time.
- API field `effectiveTicketTypeId` is authoritative when `applies=true`.
- Original Early Bird before Sep 1 and extended Early Bird Sep 1–15 are represented by API; frontend handles both identically.
- During extension, old account + pre-cutoff PRIS abstract may receive Early Bird 1,250; old account without qualifying abstract and new account receive Regular 2,500. Frontend must not derive these cases itself.
- At/after Sep16 Bangkok targeted PRIS users receive Regular 2,500 through API.
- Student Postgraduate/Undergraduate paths remain existing ticket logic; API returns `applies=false` for them.
- USD/non-target/non-PRIS behavior remains current generic logic.
- Add-ons and optional sessions are unchanged.
- Promo code preview remains after primary package resolution and must use selected effective ticket ID.
- If API personalized pricing request fails, do not guess a PRIS price. Fail closed for PRIS primary selection with a retry/error message rather than exposing both Early Bird and Regular to the user.
- Payment API can return `409 TICKET_NOT_ELIGIBLE` if eligibility changes or stale UI bypass occurs; frontend must refresh pricing and make user reselect/review rather than retrying wrong ID.
- No new dependencies.

---

## API Contract Consumed

```http
GET /api/tickets/pricing-eligibility?eventId=<eventId>&currency=<THB|USD>
Authorization: Bearer <user-token>
```

```ts
export interface PricingEligibilityResponse {
  success: true;
  data: {
    eventId: number;
    policyCode: "pris2026_abstract_early_bird" | null;
    applies: boolean;
    phase: "original_early_bird" | "extended_early_bird" | "regular" | "not_applicable";
    qualifiedForExtension: boolean;
    effectivePriority: "early_bird" | "regular" | null;
    effectiveTicketTypeId: number | null;
    offerExpiresAt: string | null;
    reason:
      | "original_window"
      | "eligible_extension"
      | "account_after_cutoff"
      | "no_qualifying_abstract"
      | "offer_expired"
      | "not_applicable";
  };
}
```

Frontend uses `effectiveTicketTypeId` to select/filter. `reason`, `phase`, and expiry are informational/UI diagnostic fields only, not re-evaluated business logic.

---

## File Map

**Create:**
- `src/lib/api/pricingEligibility.ts` — typed authenticated pricing eligibility client.
- `src/lib/api/pricingEligibility.test.ts` — API unwrap/error contract tests.
- `src/lib/checkout/prisPricing.ts` — pure helper that filters package options from an already-resolved API decision.
- `src/lib/checkout/prisPricing.test.ts` — pure option/stale-selection tests.

**Modify:**
- `src/lib/api/index.ts` — export pricing eligibility API/types.
- `src/app/checkout/[id]/page.tsx` — fetch eligibility, filter primary options, handle loading/error/stale selection, refresh on ticket mismatch.
- `src/lib/api/payments.ts` — keep stable error code propagation through existing API client; add tests only if wrapper currently hides code.
- `src/lib/api/payments.test.ts` — verify `TICKET_NOT_ELIGIBLE` behavior if payment wrapper normalizes errors.

**Verify only unless required by test failure:**
- `src/hooks/checkout/useCheckoutWizard.ts` — session-persisted `selectedPackage` makes stale invalidation necessary but storage architecture stays unchanged.
- `src/components/checkout/PackageSelector.tsx` — should render filtered packages without policy logic.

---

### Task 1: Add Typed Pricing Eligibility API Client

**Files:**
- Create: `src/lib/api/pricingEligibility.ts`
- Create: `src/lib/api/pricingEligibility.test.ts`
- Modify: `src/lib/api/index.ts`

**Interfaces:**
- Consumes existing `api.get` authenticated-by-local-token client.
- Produces:

```ts
export type PricingPhase =
  | "original_early_bird"
  | "extended_early_bird"
  | "regular"
  | "not_applicable";

export type PricingEligibilityReason =
  | "original_window"
  | "eligible_extension"
  | "account_after_cutoff"
  | "no_qualifying_abstract"
  | "offer_expired"
  | "not_applicable";

export interface PricingEligibility {
  eventId: number;
  policyCode: "pris2026_abstract_early_bird" | null;
  applies: boolean;
  phase: PricingPhase;
  qualifiedForExtension: boolean;
  effectivePriority: "early_bird" | "regular" | null;
  effectiveTicketTypeId: number | null;
  offerExpiresAt: string | null;
  reason: PricingEligibilityReason;
}

export const pricingEligibilityApi = {
  get: async (eventId: number, currency: "THB" | "USD"): Promise<PricingEligibility> => { /* ... */ },
};
```

- [ ] **Step 1: Write failing API client tests**

Use mocked `fetch` as existing `payments.test.ts` pattern:

```ts
it("unwraps personalized pricing eligibility", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    json: async () => ({
      success: true,
      data: {
        eventId: 2,
        policyCode: "pris2026_abstract_early_bird",
        applies: true,
        phase: "extended_early_bird",
        qualifiedForExtension: true,
        effectivePriority: "early_bird",
        effectiveTicketTypeId: 2,
        offerExpiresAt: "2026-09-15T17:00:00.000Z",
        reason: "eligible_extension",
      },
    }),
  } as Response);

  const result = await pricingEligibilityApi.get(2, "THB");
  expect(result.effectiveTicketTypeId).toBe(2);
  expect(result.effectivePriority).toBe("early_bird");
});
```

Also test `applies=false` payload is preserved unchanged.

- [ ] **Step 2: Run focused test and confirm failure**

```bash
npx vitest run src/lib/api/pricingEligibility.test.ts
```

Expected: FAIL because module/client does not exist.

- [ ] **Step 3: Implement client**

```ts
import { api } from "./client";

interface PricingEligibilityApiResponse {
  success: true;
  data: PricingEligibility;
}

export const pricingEligibilityApi = {
  get: async (eventId: number, currency: "THB" | "USD") => {
    const params = new URLSearchParams({
      eventId: String(eventId),
      currency,
    });
    const response = await api.get<PricingEligibilityApiResponse>(
      `/api/tickets/pricing-eligibility?${params.toString()}`,
    );
    return response.data;
  },
};
```

Existing `apiClient` already sends stored bearer token; do not build another token layer.

- [ ] **Step 4: Export from barrel**

Add `pricingEligibilityApi` and type exports to `src/lib/api/index.ts`.

- [ ] **Step 5: Run focused/full tests**

```bash
npx vitest run src/lib/api/pricingEligibility.test.ts
npm test -- --run
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/api/pricingEligibility.ts src/lib/api/pricingEligibility.test.ts src/lib/api/index.ts
git commit -m "feat: add PRIS pricing eligibility client"
```

---

### Task 2: Add Pure Package Filtering Helper

**Files:**
- Create: `src/lib/checkout/prisPricing.ts`
- Create: `src/lib/checkout/prisPricing.test.ts`

**Interfaces:**
- Consumes already-built `PackageOption[]`, `PricingEligibility | null`, current selection.
- Produces deterministic package list + corrected selection state.

```ts
export interface PersonalizedPackageResult<T extends { id: string }> {
  packages: T[];
  selectedPackage: string;
  selectionWasInvalidated: boolean;
}

export function applyPersonalizedPricing<T extends { id: string }>(input: {
  packages: T[];
  pricing: PricingEligibility | null;
  selectedPackage: string;
}): PersonalizedPackageResult<T>;
```

- [ ] **Step 1: Write failing helper tests**

Required matrix:

```ts
const packages = [
  { id: "2", name: "Early Bird" },
  { id: "3", name: "Regular" },
];
```

Test:
- `applies=false` => both packages unchanged;
- `applies=true`, effective ID 2 => only ID2;
- `applies=true`, effective ID3 => only ID3;
- current selected ID3 + effective ID2 => selection cleared and `selectionWasInvalidated=true`;
- selected effective ID stays selected;
- applies true + `effectiveTicketTypeId=null` => empty package list and stale selection cleared (fail closed).

- [ ] **Step 2: Run test and verify failure**

```bash
npx vitest run src/lib/checkout/prisPricing.test.ts
```

Expected: FAIL because helper missing.

- [ ] **Step 3: Implement minimal helper**

```ts
export function applyPersonalizedPricing<T extends { id: string }>({
  packages,
  pricing,
  selectedPackage,
}: Input<T>): PersonalizedPackageResult<T> {
  if (!pricing?.applies) {
    return { packages, selectedPackage, selectionWasInvalidated: false };
  }

  const effectiveId = pricing.effectiveTicketTypeId;
  const filtered = effectiveId == null
    ? []
    : packages.filter((pkg) => pkg.id === String(effectiveId));

  const selectedStillValid =
    !selectedPackage || filtered.some((pkg) => pkg.id === selectedPackage);

  return {
    packages: filtered,
    selectedPackage: selectedStillValid ? selectedPackage : "",
    selectionWasInvalidated: !selectedStillValid,
  };
}
```

No dates/roles/abstract logic allowed in this file.

- [ ] **Step 4: Run helper tests**

```bash
npx vitest run src/lib/checkout/prisPricing.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/checkout/prisPricing.ts src/lib/checkout/prisPricing.test.ts
git commit -m "feat: filter checkout packages by API pricing"
```

---

### Task 3: Fetch Personalized Pricing in Checkout

**Files:**
- Modify: `src/app/checkout/[id]/page.tsx:1-210`
- Consume: `src/lib/api/pricingEligibility.ts`

**Interfaces:**
- Consumes `eventId`, authenticated state, computed THB/USD currency.
- Produces React Query `pricingEligibility` state.

- [ ] **Step 1: Import client/helper/types**

```ts
import { pricingEligibilityApi } from "@/lib/api/pricingEligibility";
import { applyPersonalizedPricing } from "@/lib/checkout/prisPricing";
```

- [ ] **Step 2: Add authenticated query after currency resolution**

```ts
const {
  data: pricingEligibility,
  isLoading: pricingLoading,
  isError: pricingError,
  refetch: refetchPricing,
} = useQuery({
  queryKey: ["pricing-eligibility", eventId, currency, user?.id],
  queryFn: () => pricingEligibilityApi.get(Number(eventId), currency),
  enabled: isLoggedIn && !!user?.id && Number.isInteger(Number(eventId)),
  retry: 1,
  staleTime: 30_000,
});
```

Do not condition query on hard-coded PRIS event ID/code; API safely returns `applies=false` for other events. This avoids duplicating policy recognition.

- [ ] **Step 3: Treat personalized loading as checkout loading only when authenticated**

Before rendering package step, wait for pricing query so target PRIS users do not briefly see both 1,250 and 2,500.

Do not block anonymous users indefinitely; existing auth redirect handles them.

- [ ] **Step 4: Run tests/build**

```bash
npm test -- --run
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/checkout/[id]/page.tsx
git commit -m "feat: load personalized PRIS checkout pricing"
```

---

### Task 4: Apply Eligibility to Primary Package Options

**Files:**
- Modify: `src/app/checkout/[id]/page.tsx:125-240`
- Consume: `src/lib/checkout/prisPricing.ts`

**Interfaces:**
- Consumes generic role/currency/sale-period-built `pkgs` then authoritative API decision.
- Produces package options visible in `PackageSelector`.

- [ ] **Step 1: Keep current generic catalogue filtering first**

Preserve:
- `ticketAllowsUser` role/student filtering;
- sale window filtering;
- quota calculations;
- THB/USD filtering;
- add-on construction;
- priority sorting.

Do not remove public event ticket logic because it still serves non-PRIS/student/add-on cases.

- [ ] **Step 2: Apply personalized helper after generic primary list is built**

Inside/after current `useMemo`, use:

```ts
const personalized = applyPersonalizedPricing({
  packages: pkgs,
  pricing: pricingEligibility ?? null,
  selectedPackage: checkoutData.selectedPackage,
});

return {
  packageOptions: personalized.packages,
  addonOptions: addons,
  effectiveSelectedPackage: personalized.selectedPackage,
  selectionWasInvalidated: personalized.selectionWasInvalidated,
};
```

If keeping return shape simpler, compute a second `useMemo`; do not duplicate helper logic.

- [ ] **Step 3: Add pricing query dependencies**

Memo must recompute when `pricingEligibility` changes.

- [ ] **Step 4: Verify target cases visually**

During API extension window with seeded accounts:

```text
Eligible -> exactly Early Bird 1,250 primary package
Old account + Round2-only -> exactly Regular 2,500
New account -> exactly Regular 2,500
Student -> existing Postgraduate/Undergraduate option
Non-PRIS -> current generic options
```

- [ ] **Step 5: Run helper/full tests/build**

```bash
npx vitest run src/lib/checkout/prisPricing.test.ts
npm test -- --run
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/checkout/[id]/page.tsx src/lib/checkout/prisPricing.ts
git commit -m "fix: show only effective PRIS ticket rate"
```

---

### Task 5: Clear Stale Stored Package Selection Safely

**Files:**
- Modify: `src/app/checkout/[id]/page.tsx`
- Verify: `src/hooks/checkout/useCheckoutWizard.ts`
- Modify: `src/lib/checkout/prisPricing.test.ts`

**Interfaces:**
- Consumes `selectionWasInvalidated`, `effectiveSelectedPackage`.
- Produces checkout wizard state that cannot retain old Early Bird/Regular ID across cutoff/policy changes.

- [ ] **Step 1: Add regression test for stale selection**

Test helper already clears stale selection. Add explicit case simulating persisted `selectedPackage="2"` while API returns effective ID3.

Expected output: selected package `""`, invalidated true.

- [ ] **Step 2: Add effect to synchronize wizard state**

```ts
useEffect(() => {
  if (!pricingEligibility || !pricingEligibility.applies) return;
  if (!selectionWasInvalidated) return;

  updateCheckoutData({
    selectedPackage: "",
    selectedOptionalSessions: [],
    promoCode: "",
    promoApplied: false,
  });
  setPromoDiscountAmount(0);
  setPromoDiscountText(null);
  setPromoError(null);
}, [
  pricingEligibility,
  selectionWasInvalidated,
  updateCheckoutData,
]);
```

Clear optional sessions because linked sessions may differ by primary ticket. Clear promo preview state because subtotal basis changed.

Do not silently auto-submit or charge a new package.

- [ ] **Step 3: Keep user on package selection step when stale selection invalidates**

If current step is after package step and selection becomes invalid, call:

```ts
goToStep(2);
```

so user reviews the authoritative rate.

- [ ] **Step 4: Verify sessionStorage overwrite**

Existing wizard persistence effect should save cleared selection naturally. Do not manually edit storage from checkout page.

- [ ] **Step 5: Run tests/build**

```bash
npx vitest run src/lib/checkout/prisPricing.test.ts
npm test -- --run
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/checkout/[id]/page.tsx src/lib/checkout/prisPricing.test.ts
git commit -m "fix: clear stale PRIS package selection"
```

---

### Task 6: Fail Closed When Personalized Pricing Cannot Resolve

**Files:**
- Modify: `src/app/checkout/[id]/page.tsx`

**Interfaces:**
- Consumes `pricingLoading`, `pricingError`, `pricingEligibility`.
- Produces safe UX that never guesses target PRIS price.

- [ ] **Step 1: Add pricing error state near package section**

If authenticated pricing query errors, show:

```tsx
<div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
  ไม่สามารถตรวจสอบอัตราค่าลงทะเบียนของบัญชีนี้ได้ กรุณาลองใหม่อีกครั้งก่อนเลือกแพ็กเกจ
  <button type="button" onClick={() => refetchPricing()}>ลองใหม่</button>
</div>
```

- [ ] **Step 2: Disable package progression while eligibility unresolved**

Do not populate both Early Bird/Regular as fallback. `packageOptions` should be empty/hidden until pricing succeeds for authenticated user.

For API `applies=false`, render current generic packages normally.

- [ ] **Step 3: Do not change auth redirect behavior**

Pricing error is not 401-specific logout logic; existing centralized `apiClient` handles 401.

- [ ] **Step 4: Run lint/tests/build**

```bash
npm run lint
npm test -- --run
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/checkout/[id]/page.tsx
git commit -m "fix: fail closed on PRIS pricing lookup error"
```

---

### Task 7: Handle `TICKET_NOT_ELIGIBLE` from Promo Preview

**Files:**
- Modify: `src/app/checkout/[id]/page.tsx:250-330`
- Modify: `src/lib/api/payments.test.ts` only if required to verify error code propagation.

**Interfaces:**
- Consumes existing `ApiError.code` set in `src/lib/api/client.ts`.
- Produces refresh/reselection when backend detects stale rate.

- [ ] **Step 1: Verify existing API error retains backend code**

`apiClient` already sets:

```ts
(error as ApiError).code = errorData.code;
```

Add a focused test only if current `paymentsApi.preview` catches/re-wraps the error. If it passes through directly, no `payments.ts` implementation change needed.

- [ ] **Step 2: Detect mismatch in promo preview catch**

Use typed guard:

```ts
const apiError = err as ApiError;
if (apiError.code === "TICKET_NOT_ELIGIBLE") {
  await refetchPricing();
  updateCheckoutData({
    selectedPackage: "",
    promoCode: "",
    promoApplied: false,
    selectedOptionalSessions: [],
  });
  goToStep(2);
  setPromoError("อัตราค่าลงทะเบียนมีการเปลี่ยนแปลง กรุณาตรวจสอบแพ็กเกจอีกครั้ง");
  return;
}
```

- [ ] **Step 3: Preserve ordinary promo errors**

`Promo code not found` and similar still display current promo-specific messages and must not reset package.

- [ ] **Step 4: Run focused/full tests**

```bash
npx vitest run src/lib/api/payments.test.ts
npm test -- --run
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/checkout/[id]/page.tsx src/lib/api/payments.test.ts
git commit -m "fix: refresh checkout on ticket eligibility change"
```

---

### Task 8: Handle `TICKET_NOT_ELIGIBLE` at Final Payment Submission

**Files:**
- Modify: `src/app/checkout/payment/page.tsx:1-210`
- Test: `src/lib/api/payments.test.ts`

**Interfaces:**
- Consumes backend final enforcement from `/api/payments/create-intent`.
- Produces safe redirect back to package step instead of showing generic payment failure with stale ticket.

- [ ] **Step 1: Add payment API regression test for final eligibility rejection**

In `src/lib/api/payments.test.ts`, mock HTTP 409:

```ts
vi.spyOn(globalThis, "fetch").mockResolvedValue({
  ok: false,
  status: 409,
  json: async () => ({
    success: false,
    code: "TICKET_NOT_ELIGIBLE",
    error: "Selected ticket is not available for your current PRIS 2026 registration rate",
  }),
} as Response);

await expect(paymentsApi.createIntent({
  eventId: 2,
  packageId: "2",
  addOnIds: [],
  currency: "THB",
  paymentMethod: "card",
  needTaxInvoice: false,
})).rejects.toMatchObject({
  code: "TICKET_NOT_ELIGIBLE",
  status: 409,
});
```

Run:

```bash
npx vitest run src/lib/api/payments.test.ts
```

Expected: PASS if existing shared `apiClient` error propagation is already sufficient. If it fails because `paymentsApi.createIntent` re-wraps errors, make the minimal change in `src/lib/api/payments.ts` while preserving the shared `ApiError` fields.

- [ ] **Step 2: Handle backend mismatch explicitly in `src/app/checkout/payment/page.tsx`**

Insert this branch at the top of the existing `catch`, before `STUDENT_ELIGIBILITY_REQUIRED`:

```ts
const apiError = error as ApiError;
if (apiError.code === "TICKET_NOT_ELIGIBLE") {
  const saved = sessionStorage.getItem("checkout-payment-data");
  const data = saved ? (JSON.parse(saved) as CheckoutPaymentData) : null;

  if (data) {
    sessionStorage.setItem(
      "checkout-payment-data",
      JSON.stringify({
        ...data,
        selectedPackage: "",
        selectedOptionalSessions: [],
        promoCode: "",
        promoApplied: false,
      }),
    );
  }

  setErrorCode(apiError.code);
  setErrorMessage(
    "อัตราค่าลงทะเบียนมีการเปลี่ยนแปลง กรุณากลับไปตรวจสอบแพ็กเกจและราคาอีกครั้ง",
  );
  setStatus("error");
  return;
}
```

Do not retry `createIntent`, keep no gateway redirect form from this failed request, and do not create a replacement package automatically.

- [ ] **Step 3: Add dedicated recovery button for the mismatch**

In the current error action area, render this action when `errorCode === "TICKET_NOT_ELIGIBLE"`:

```tsx
<button
  onClick={() => {
    const saved = sessionStorage.getItem("checkout-payment-data");
    const data = saved ? (JSON.parse(saved) as CheckoutPaymentData) : null;
    if (!data?.eventId) {
      router.push("/events");
      return;
    }

    const params = new URLSearchParams();
    if (data.originApp) params.set("originApp", data.originApp);
    if (data.returnTo) params.set("returnTo", data.returnTo);
    const query = params.toString();
    router.push(`/checkout/${data.eventId}${query ? `?${query}` : ""}`);
  }}
  className="px-5 py-2.5 bg-[#8a8a00] text-white font-medium rounded-lg hover:bg-[#456339] transition-colors text-sm"
>
  กลับไปตรวจสอบราคา
</button>
```

For this error, do not make the generic reload-based `ลองใหม่` button the primary action because reload would reuse the same checkout session immediately.

- [ ] **Step 4: Preserve other gateway errors**

KTB/PaySolutions/Stripe/general errors retain current behavior. `STUDENT_ELIGIBILITY_REQUIRED` continues to offer Profile. Existing `router.back()` may remain as secondary navigation.

- [ ] **Step 5: Run tests/build**

```bash
npx vitest run src/lib/api/payments.test.ts
npm test -- --run
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/checkout/payment/page.tsx src/lib/api/payments.test.ts
git commit -m "fix: recover from stale PRIS payment rate"
```

If the Step 1 regression test proves a change in `src/lib/api/payments.ts` is necessary, include that file in the same commit; otherwise leave it untouched.

---

### Task 9: Add UI Contract Regression Tests

**Files:**
- Modify: `src/lib/checkout/prisPricing.test.ts`
- Modify: `src/lib/api/pricingEligibility.test.ts`
- Modify: `src/lib/api/payments.test.ts` as needed.

**Interfaces:**
- Produces final frontend truth-table guard without reimplementing backend rules.

- [ ] **Step 1: Add response-shape tests**

Assert client retains exact `phase`, `qualifiedForExtension`, `effectivePriority`, `effectiveTicketTypeId`, `offerExpiresAt`, `reason` values.

- [ ] **Step 2: Add package-filter tests**

Explicitly cover API decisions labeled:
- `original_window` Early Bird;
- `eligible_extension` Early Bird;
- `no_qualifying_abstract` Regular;
- `account_after_cutoff` Regular;
- `offer_expired` Regular;
- `not_applicable` generic list.

Tests should feed API result objects directly; do not reproduce date logic.

- [ ] **Step 3: Add null-ticket fail-closed case**

`applies=true`, `effectiveTicketTypeId=null` => no primary package exposed.

- [ ] **Step 4: Run complete frontend gates**

```bash
npm run lint
npm test -- --run
npm run build
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/pricingEligibility.test.ts src/lib/checkout/prisPricing.test.ts src/lib/api/payments.test.ts
git commit -m "test: cover personalized PRIS checkout pricing"
```

---

### Task 10: Integrated Checkout Smoke Test

**Files:**
- No expected source changes. Reopen failed task if smoke reveals defect.

**Interfaces:**
- Consumes deployed API + updated DB ticket rows.
- Produces evidence UI and API agree.

- [ ] **Step 1: Eligible extension account**

Use controlled account created before cutoff with PRIS abstract created before cutoff.

Expected during Sep1–15:
- checkout shows one target primary ticket: Early Bird 1,250;
- selected package ID matches API `effectiveTicketTypeId`;
- promo preview subtotal uses 1,250 before promo;
- create-intent accepts same ID.

- [ ] **Step 2: Old account without qualifying abstract**

Expected:
- only Regular 2,500;
- Early Bird not visible;
- direct/stale Early Bird selection cannot remain in session wizard.

- [ ] **Step 3: Account created after cutoff**

Expected only Regular 2,500.

- [ ] **Step 4: Student accounts**

Postgraduate/Undergraduate remain current prices; personalized API returns `applies=false`; no package disappears incorrectly.

- [ ] **Step 5: Non-PRIS event**

Generic package behavior unchanged.

- [ ] **Step 6: Stale browser state**

Seed sessionStorage with Early Bird selected for noneligible user, reload checkout.

Expected selection clears and user returns/reviews package step; no wrong price reaches payment.

- [ ] **Step 7: Backend mismatch race**

Simulate API decision changing between checkout load and preview/create-intent.

Expected 409 `TICKET_NOT_ELIGIBLE` refreshes/returns user to package review; no automatic wrong-price retry.

- [ ] **Step 8: Final repository gate**

```bash
npm run lint
npm test -- --run
npm run build
git status --short
```

Expected: PASS and clean after commits.

---

## Final Acceptance Checklist

- [ ] Frontend never reads abstract history to decide price.
- [ ] Frontend never compares PRIS eligibility cutoff dates.
- [ ] Authenticated pricing endpoint has a typed client.
- [ ] `effectiveTicketTypeId` is authoritative whenever `applies=true`.
- [ ] Eligible user sees only Early Bird 1,250 during API-defined Early Bird phase.
- [ ] Noneligible target user sees only Regular 2,500.
- [ ] Student/non-PRIS/non-target behavior remains generic.
- [ ] Add-ons and optional sessions unchanged.
- [ ] Stale selected package is cleared and linked optional sessions/promo state are reset.
- [ ] Pricing API failure does not expose both PRIS target rates as fallback.
- [ ] `TICKET_NOT_ELIGIBLE` is handled both at preview and final create-intent boundary.
- [ ] Promo calculation remains based on effective base ticket.
- [ ] No new dependency introduced.
- [ ] `npm run lint`, `npm test -- --run`, and `npm run build` pass.
