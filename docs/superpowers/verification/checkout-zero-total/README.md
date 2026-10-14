# Zero-total checkout verification — 2026-10-14

Implementation ran in the original chat without subagents. Only the approved checkout slice was changed. Production deployment, real payment submission, and real email delivery were not performed.

## Checkpoints

| Checkpoint | Evidence |
|---|---|
| 0 — Workspace | Both repositories started clean. Existing branches retained; no merge/push. |
| 1 — Isolated DB and RED | Created `checkout-zero-test-20261014`, PostgreSQL 16, one application database `checkout_zero_test`, localhost port 55436, tmpfs data. Old schema default test failed with card instead of undefined; old HTTP positive-total omission returned 200 instead of required 409. |
| 2 — API GREEN | Schema/response/discount/email/PDF tests passed 20/20. HTTP checkout matrix passed; free settlement rollback/concurrency regression passed. API build passed. |
| 3 — Web GREEN | Quote, storage, wizard, summary, processing, and result tests passed. Added explicit malformed storage and non-finite/negative quote coverage. |
| 4 — Browser | Real local API + web + isolated database: earlier steps had no payment action; paid THB required selecting QR/card; applying a full discount hid tax/method selection; reload revalidated the code; removing it restored tax review. |
| 5 — Full local feature gates | Web focused acceptance suite passed 64/64 across 11 files. Web TypeScript, focused ESLint (no errors or warnings), and production build passed. API payment suite passed 12 with 3 integration gates skipped in that generic command; all three gates were then run explicitly and passed. |
| 6 — Cleanup | Local web/API processes stopped. The specifically labeled test container was removed with its tmpfs database after the gates passed. Docker inspection confirmed no test container remained and no listeners on 55436/5302/5303. Existing development/backup containers remained running. |

## Source checkpoints

API branch: `feat(booths)/booth-directory-coupons`

- `95bd0d8` — optional method and positive-total guard, complete preview, free tax suppression.
- `da3a8d2` — isolated HTTP acceptance matrix.
- `94f745c` — API consumer contract and release compatibility notes.

Web branch: `webhub`

- `3992794` — explicit free/paid request serialization and currency normalization.
- `6eb23ab` — current server quote and stale-response protection.
- `ca48894` — final-only action and conditional wizard/tax flow.
- `061b82e` — processing, changed-price/storage recovery, and currency-correct free result.

## Executed verification

Web working directory: `D:/confer/confer/conference/conference-web`

```powershell
npx vitest run src/lib/api/payments.test.ts src/lib/paymentSession.test.ts src/lib/checkout/paymentRequest.test.ts src/lib/checkout/prisPricing.test.ts src/hooks/checkout/useCheckoutQuote.test.tsx src/hooks/checkout/useCheckoutWizard.test.tsx src/components/checkout/OrderSummary.test.tsx src/components/checkout/StepIndicator.test.tsx 'src/app/checkout/[id]/page.test.tsx' src/app/checkout/payment/page.test.tsx src/app/checkout/payment/result/page.test.tsx
npx tsc --noEmit --incremental false
npx eslint 'src/app/checkout/[id]/page.tsx' src/app/checkout/payment/page.tsx src/app/checkout/payment/result/page.tsx src/hooks/checkout/useCheckoutWizard.ts src/hooks/checkout/useCheckoutQuote.ts src/components/checkout/OrderSummary.tsx src/components/checkout/StepIndicator.tsx src/components/checkout/PromoCodeSection.tsx src/lib/api/payments.ts src/lib/checkout/paymentRequest.ts src/lib/paymentSession.ts
npm run build
```

API working directory: `D:/confer/confer/conference/conference-api`

```powershell
npx tsx --test src/schemas/payment.schema.test.ts src/modules/payments/api-contract.test.ts src/utils/promoDiscount.test.ts src/services/emailTemplates.test.ts src/services/receiptPdf.test.ts
npm run test:payments
npm run build
npm run test:checkout-flow:integration
npm run test:payments:integration
npm run test:pris-ticket-authorization:integration
```

Integration commands used the guarded local TEST_DATABASE_URL. The regular DATABASE_URL supplied to the guard named an unused runtime target so isolation checks remained active; the integration harness selected the test connection only after validating it. No shared-database override was enabled. Integration commands ran sequentially. Generic `test:payments` skips were not counted as successful integration execution.

The fresh database used the canonical Drizzle schema. Drizzle's first push encountered composite foreign keys before required unique indexes; the existing schema's unique indexes were applied first and the push completed. No project schema or migration was changed to fix the initialization order. This disposable initialization does not establish production migration readiness. The optional presentation subsystem was not exercised by checkout smoke tests.

## Browser and database results

The local API blocked outbound axios requests. Paid HTTP tests prepared a form pointing to a test URL; no bank/card transaction was sent. Email delivery was deliberately blocked or lacked configured credentials; email/PDF rendering tests passed separately. Existing post-commit email failure behavior did not undo successful registrations.

Real browser confirmations created exactly one THB and one USD order for disposable accounts in the test event. Before deleting the database, a joined order/payment/registration/promo query verified:

| Currency | Orders | Order | Total | Provider / channel | Registration | Tax requested | Promo usage |
|---|---:|---|---:|---|---|---|---|
| THB | 1 | paid | 0 | internal / free | confirmed | false | used |
| USD | 1 | paid | 0 | internal / free | confirmed | false | used |

The USD result visibly retained `$0.00` and a registration code after provider/session cleanup. The existing SSO return navigated to the local event website with `status=registered`, `regCode`, and `orderNumber` parameters. The mobile viewport was 390 × 844; document width was 375 with one confirmation action and no horizontal overflow. The viewport override was reset.

## Screenshots

- [Desktop free USD confirmation](desktop-free-usd.jpg)
- [Mobile free USD confirmation](mobile-free-usd.jpg)
- [Successful free USD result](result-free-usd.jpg)

## Release gates remaining outside this local implementation

- Inventory externally deployed consumers relying on implicit card before releasing the tightened API contract.
- Verify existing target migrations/constraints in staging/production through the normal release process.
- Deploy API before web; roll back web before API. Real provider/email delivery and target-environment smoke testing remain release checks.

## Implementation details adjusted during verification

Session restoration and quote-driven synchronization use cancellable microtasks after hydration, preserving the planned readiness gates while satisfying React effect/immutability lint rules. Query tests wait for observer notifications instead of assuming immediate rendering after a promise resolves. Final serialization uses the validated requested promo directly from the current quote; it does not wait for the persisted promo flag to catch up. Legacy/malformed checkout data offers a review/start-over action without creating an intent. These are within the planned hydration, quote freshness, and recovery behavior; no extra product feature or dependency was introduced.
