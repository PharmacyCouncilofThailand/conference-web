# Checkout final action and zero-total confirmation

Date: 2026-10-14
Status: Implemented and locally verified on 2026-10-14 following authorization in the same chat. Production deployment remains a separate release step.

## Approved requirements

1. Keep the submit button at the bottom of the right-hand order summary. Render it only at the final checkout step.
2. Keep the existing final step (logical step ID 4). For a server-confirmed zero total, replace payment selection with registration confirmation.
3. The zero-total action reads `ยืนยันการลงทะเบียน`.
4. Hide and skip the tax-invoice step for a server-confirmed zero total.
5. Apply the free flow to all server-confirmed zero totals: percentage promos, fixed-value promos, and intrinsically free tickets.
6. Apply the behavior to every event using this checkout, including add-on-only purchases and THB/USD.
7. Keep the promo-code field in the order summary from package selection onward.
8. Update both conference-web and the existing payment API contract.

## Scope and existing behavior to preserve

Use `/api/payments/preview` for quotes and `/api/payments/create-intent` for authoritative submission. Reuse `completeFreeCheckout` for atomic settlement, registration/session creation, promo consumption, and existing booth entitlements. Preserve paid gateway routing, pricing eligibility, session ownership checks, login requirements, event/SSO return context, and current receipt/email behavior.

No new endpoint, gateway, dependency, database table, or migration is required for this change. Existing meal-coupon rules remain unchanged: a fixed discount resulting in zero does not gain the separate booth benefit currently restricted to a 100% percentage promo.

## Authoritative quote

The checkout page owns one current quote containing server subtotal, discount, net amount, fee, total, and currency. OrderSummary displays this quote; wizard validation uses the same total. Initial/loading/failed quotes are not free orders.

Quote identity includes the authenticated account, event, package, add-ons, currency, and applied promo code. Recalculate when these inputs change and on restored checkout entry. Immediately invalidate the previous quote when its identity changes. Ignore responses from an older identity. A code is applied only when the response validates that same code against that same cart.

Submitting is disabled while applying a promo, fetching a quote, showing a quote failure, or creating a payment intent. An empty or unresolved cart never qualifies as free simply because a display fallback is zero. Removing a code refreshes the quote without the code. Promo errors are visible and do not reuse an old discount.

## Navigation and tax invoice

Logical wizard IDs stay 1 (personal), 2 (selection), 3 (tax), 4 (final). A confirmed positive quote uses 1 -> 2 -> 3 -> 4. A confirmed zero quote uses 1 -> 2 -> 4, and Back from 4 returns to 2. Hide step 3 from the indicator while free; visible step numbers remain consecutive even though the final logical ID remains 4. The final label is `ยืนยันการลงทะเบียน` for zero and `วิธีชำระเงิน` for positive totals.

A zero-total quote clears `needTaxInvoice` and tax fields from active checkout/payment submission. Tax information does not block zero-total confirmation and is not requested or issued through the checkout tax-invoice option. Existing generic zero-total receipt/email behavior is retained.

If a quote changes to a positive total, restore the tax step and payment selection. Do not restore a previous tax request or payment choice automatically. If the user was on the free final step, move them to step 3 to review the restored tax choice before returning to the paid final step. During quote uncertainty, no final action is enabled.

Validate personal and cart information in both paths; only free orders skip tax/payment-method requirements. Keep add-on and session-specific requirements and server validation intact.

## Final action and processing

OrderSummary has separate visibility and enabled conditions: final step controls rendering, complete current data and quote control whether the action is enabled. No submit button is rendered on earlier steps.

Positive total: require the supported selected payment method and display the current quote amount in the payment action. Zero total: hide QR/card options, show `ยอดสุทธิ 0 บาท ไม่ต้องชำระเงิน` (with currency-correct zero formatting for USD), and display `ยืนยันการลงทะเบียน`. Applying a promo never automatically submits registration.

Reuse checkout-payment-data and `/checkout/payment`. Free requests omit paymentMethod and submit needTaxInvoice=false with no tax fields. Paid requests include the selected method. Processing copy distinguishes registration confirmation from gateway redirection. Preserve existing free result routing, clear provider session references, and preserve originApp/returnTo/event website context. Free result currency comes from the checkout/API context rather than a hardcoded THB value.

## API contract

Change paymentMethod to optional qr/card without defaulting to card. Clients omit it for free requests; null and unsupported values continue to be invalid. Preview can price without a payment method, since this API currently passes through no processing fee.

Create-intent recalculates prices and promo eligibility from server data. When its calculated total is zero, use the existing free transaction and return the existing free:true/gateway:null/total:0/regCode response. When its total is positive and paymentMethod is absent, return HTTP 409 with code `PAYMENT_METHOD_REQUIRED` and an actionable message before creating a paid order, reserving promo usage, or calling a gateway.

The frontend handles PAYMENT_METHOD_REQUIRED, FREE_TOTAL_CHANGED, PROMO_CHECKOUT_CHANGED, and promo invalid/limit errors by returning to the checkout with fresh pricing and an explanation. It never silently selects a method or drops an invalid promo and starts paid checkout. Already-confirmed registration remains authoritative if a response is lost; this change does not introduce a general checkout idempotency protocol.

This intentionally tightens requests for positive totals: a client previously relying on omitted paymentMethod defaulting to card must now send card explicitly. Repository callers must be audited and updated; externally deployed consumers require release verification. Existing explicit-method clients and the free response remain compatible.

## Files and responsibilities

- conference-web/src/app/checkout/[id]/page.tsx: current quote orchestration, promo errors, checkout navigation/context, final action visibility.
- conference-web/src/hooks/checkout/useCheckoutWizard.ts: conditional tax navigation, free/paid validation, restored data behavior.
- conference-web/src/components/checkout/OrderSummary.tsx: server quote presentation and conditional final action.
- conference-web/src/components/checkout/StepIndicator.tsx: omitted tax step and consecutive visible numbering.
- conference-web/src/lib/api/payments.ts: optional request payment method and existing response normalization.
- conference-web/src/app/checkout/payment/page.tsx: omit method/tax for free, contextual processing text, recoverable API errors.
- conference-web/src/app/checkout/payment/result/page.tsx: currency-correct free result with existing return behavior.
- conference-api/src/schemas/payment.schema.ts: remove implicit card default.
- conference-api/src/routes/payments/index.ts: missing-method positive-total guard before paid order insertion.
- Focused frontend and API tests: quote freshness, conditional navigation/actions, request contract, and paid-flow regression.

## Acceptance and validation

1. Steps 1-3 have no payment/confirmation action; the final step has one action in the order summary.
2. A paid order cannot submit without QR/card and retains the existing selected-method request/gateway behavior.
3. Percentage/fixed/free-ticket zero totals submit without a payment method and return successful registration without gateway redirection.
4. Free navigation skips tax in both directions, omits tax requests, and still validates personal/cart/session information.
5. Removing a full discount, changing a package/add-on, or a promo becoming invalid restores the paid requirements and current quote.
6. Refresh and out-of-order preview responses cannot incorrectly retain an old zero quote or discount.
7. Quote loading/failure/empty cart cannot enable free confirmation.
8. Positive server total without a method returns PAYMENT_METHOD_REQUIRED before paid writes/gateway calls.
9. Existing API promo concurrency/free transaction tests and receipt/email contracts remain valid.
10. THB/USD, add-on-only, and external event/SSO return contexts remain correct.

Run focused Vitest checkout/API/session tests, frontend lint/type/build checks, API schema/contract/discount tests and API build. Exercise database-backed integration cases only against the repository's isolated test database; do not create transactions in a production target as part of local validation. A deployed browser smoke test is a separate release check.

## Specification self-review

All eight approved answers are represented. Quote unknown/zero/positive states, tax restoration, request omission versus null, API guard order, and compatibility behavior are explicit. No business-policy change outside checkout was introduced. No unresolved implementation placeholder is required for the approved design.
