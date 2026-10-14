# Checkout Zero-Total Confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** แสดงปุ่มท้ายกล่องสรุปรายการเฉพาะขั้นสุดท้าย และให้รายการที่ API ยืนยันยอด 0 ข้ามใบกำกับภาษีและวิธีชำระเงิน ก่อนกดยืนยันการลงทะเบียนด้วยตนเอง

**Architecture:** ใช้ preview เป็นแหล่งยอดเดียวสำหรับ frontend และใช้ create-intent เป็นผู้ตัดสินราคาสุดท้ายฝั่ง server ต่อไป เพิ่มเงื่อนไขป้องกันยอดบวกที่ไม่มีวิธีชำระก่อนสร้าง order และใช้ free transaction เดิม ปรับ wizard ตามสถานะ quote โดยคง logical step 4 เป็นขั้นสุดท้าย

**Tech Stack:** Next.js 16, React 19, TypeScript, TanStack Query 5, Vitest/Testing Library; Fastify 5, Zod 3, Drizzle/PostgreSQL, tsx/node:test

## Global Constraints

- Keep the submit button at the bottom of the right-hand order summary. Render it only at the final checkout step.
- Keep the existing final step (logical step ID 4). For a server-confirmed zero total, replace payment selection with registration confirmation.
- The zero-total action reads `ยืนยันการลงทะเบียน`.
- Hide and skip the tax-invoice step for a server-confirmed zero total.
- Apply the free flow to all server-confirmed zero totals: percentage promos, fixed-value promos, and intrinsically free tickets.
- Apply the behavior to every event using this checkout, including add-on-only purchases and THB/USD.
- Keep the promo-code field in the order summary from package selection onward.
- Update both conference-web and the existing payment API contract.
- No new endpoint, gateway, dependency, database table, or migration is required for this change.
- Preserve paid gateway routing, pricing eligibility, session ownership checks, login requirements, event/SSO return context, and current receipt/email behavior.
- Existing meal-coupon rules remain unchanged.
- Clients omit paymentMethod for free requests; null and unsupported values continue to be invalid.
- การเขียนแผนครั้งนี้ไม่อนุญาตให้ลงมือแก้ source, รันทดสอบที่สร้าง transaction, deploy หรือเริ่ม worker ใด ๆ; ทุก checkbox คือสิ่งที่ต้องทำในรอบ implementation ภายหลัง

---

## 0. Context, approval, and repository boundaries

แบบอ้างอิง: `D:/confer/confer/conference/conference-web/docs/superpowers/specs/2026-10-14-checkout-zero-total-confirmation-design.md` ผู้ใช้เลือกคำตอบครบ 8 ข้อและสั่งให้เขียน implementation plan เมื่อ 2026-10-14 การสั่งเขียนแผนอนุญาตขั้น planning; ไม่ใช่การอนุญาต implementation

workspace root ไม่ใช่ Git repository ที่ใช้งานได้ แต่มีสอง repository แยกกัน:

| Repository | Absolute working directory | Baseline inspected |
|---|---|---|
| Web | `D:/confer/confer/conference/conference-web` | `8e12562` |
| API | `D:/confer/confer/conference/conference-api` | `f4fb1be` |

ใช้คำสั่ง Git จาก repository ที่ถูกต้อง ไม่ stage ทั้ง workspace และไม่ commit การเปลี่ยนแปลงของผู้ใช้ที่ไม่เกี่ยวข้อง เวอร์ชันข้างต้นเป็น baseline ที่อ่านเพื่อวางแผน ไม่ใช่คำสั่ง reset checkout

การวิเคราะห์รอบก่อนรัน existing frontend tests ผ่าน 6 tests และ API discount/contract/email/PDF tests ผ่าน 15 tests นี่เป็นหลักฐาน baseline เท่านั้น ไม่ใช่ผลทดสอบ implementation ใหม่ ยังไม่มีหลักฐาน production migration state หรือ deployed checkout behavior ในแผนนี้

## 1. File ownership and dependency order

ทุก path ในตารางต่อไปนี้ต่อท้าย absolute working directory ของ repository ที่ระบุ

| Repo | Create / Modify | File | Responsibility |
|---|---|---|---|
| API | Modify | `src/schemas/payment.schema.ts` | optional method without implicit card |
| API | Create | `src/schemas/payment.schema.test.ts` | omitted/null/unsupported/explicit method contract |
| API | Modify | `src/modules/payments/api-contract.ts` | stable missing-method conflict response |
| API | Modify | `src/modules/payments/api-contract.test.ts` | exact error response regression |
| API | Modify | `src/routes/payments/index.ts` | guard before paid writes, complete preview, free tax suppression |
| API | Create | `src/modules/payments/checkout-flow.integration.test.ts` | real HTTP route + isolated database acceptance |
| API | Modify | `package.json` | explicit isolated route-integration command |
| API | Create | `docs/api/checkout-zero-total-contract.md` | consumer contract, examples, compatibility notice |
| Web | Modify | `src/lib/api/payments.ts` | optional method and free currency normalization |
| Web | Modify | `src/lib/api/payments.test.ts` | actual request JSON + HTTP error contract |
| Web | Modify | `src/lib/paymentSession.ts` | validated free-result currency before cleanup |
| Web | Modify | `src/lib/paymentSession.test.ts` | currency resolver and preserved provider cleanup |
| Web | Create | `src/hooks/checkout/useCheckoutQuote.ts` | current server quote and validity |
| Web | Create | `src/hooks/checkout/useCheckoutQuote.test.tsx` | stale response, restore, invalid promo, quote failures |
| Web | Modify | `src/hooks/checkout/useCheckoutWizard.ts` | hydration and conditional navigation/validation |
| Web | Create | `src/hooks/checkout/useCheckoutWizard.test.tsx` | paid/free/unknown navigation and storage |
| Web | Modify | `src/components/checkout/StepIndicator.tsx` | consecutive display numbers for IDs 1,2,4 |
| Web | Create | `src/components/checkout/StepIndicator.test.tsx` | logical ID versus visible number |
| Web | Modify | `src/components/checkout/OrderSummary.tsx` | server totals and final-only action |
| Web | Create | `src/components/checkout/OrderSummary.test.tsx` | invisible earlier action, blocked unknown quote |
| Web | Modify | `src/components/checkout/PromoCodeSection.tsx` | shared busy state and visible revalidation errors |
| Web | Modify | `src/app/checkout/[id]/page.tsx` | connect quote, wizard, promo, tax, action, recovery |
| Web | Create | `src/app/checkout/[id]/page.test.tsx` | integrated checkout behavior using mocked API |
| Web | Create | `src/lib/checkout/paymentRequest.ts` | shared stored payload type and exact request builder |
| Web | Create | `src/lib/checkout/paymentRequest.test.ts` | omission, preserved sessions, tax, currency, recovery |
| Web | Modify | `src/app/checkout/payment/page.tsx` | serialized request, processing copy, recovery |
| Web | Create | `src/app/checkout/payment/page.test.tsx` | free success, errors, no silent paid fallback |
| Web | Modify | `src/app/checkout/payment/result/page.tsx` | capture free currency before session cleanup |
| Web | Create | `src/app/checkout/payment/result/page.test.tsx` | USD/THB free results and preserved SSO context |

ลำดับ deliverable: T1 API contract -> T2 HTTP proof -> T3 web API/payload -> T4 quote -> T5 wizard -> T6 UI wiring -> T7 processing/result/recovery -> T8 regression/rollout documentation

ลำดับ RED/GREEN สำหรับ route: ทำ T1 Steps 1-2 และสร้าง T2 Step 1 ก่อนแก้ route ใน T1 Steps 3-5; รัน HTTP tests ให้เห็น RED บนโค้ดเดิม จากนั้นทำ T1 ให้ GREEN และขยาย matrix/ตรวจ GREEN ใน T2 ไม่ต้องแก้ย้อนกลับ source เพื่อพิสูจน์ failure ภายหลัง

ไม่แก้ `completeFreeCheckout`, promo locking, booth coupon policy, settlement schema หรือ gateway provider configuration เพื่อทำ UX นี้

## 2. Contract decisions from api-design-principles

คง endpoint และ envelope ที่มีอยู่ ไม่เปลี่ยนชื่อ endpoint เป็น resource URL ในงานนี้ เพราะจะเพิ่ม migration ที่ไม่จำเป็น preview แม้ใช้ POST ต้องคง read-only; create-intent ยังคงเป็น mutation

| Request | Server net total | HTTP / behavior |
|---|---:|---|
| preview, method omitted | any valid amount | 200 quote; no order/payment/promo reservation |
| create-intent, method omitted | 0 | 200 existing free response |
| create-intent, explicit qr/card | 0 | 200 free response; selected method does not change free provider |
| create-intent, method omitted | >0 | 409 PAYMENT_METHOD_REQUIRED; no paid side effects |
| create-intent, explicit qr/card | >0 | existing paid response / provider behavior |
| method null or unsupported | any | 400 existing validation envelope |
| unknown Add-on in preview | any | 400 EVENT_TICKET_MISMATCH; no partial quote |
| addon-only preview with no Add-on | any | 400 EMPTY_CHECKOUT; no zero quote |
| invalid promo | preview | 200 with promoValid=false; client treats requested promo as blocking |
| invalid promo | create-intent | existing 400 INVALID_PROMO |
| locked promo changed/used up | create-intent | existing 409 structured promo conflict |

ใช้ 409 สำหรับ missing method หลังคำนวณ เพราะ omission ถูกต้องสำหรับ free checkout แต่ขัดกับสถานะยอดปัจจุบัน ใช้ 400 ต่อสำหรับ invalid enum ตาม convention เดิม ไม่เพิ่ม 422 หรือ error envelope อีกแบบ

ตัวอย่าง free request ไม่มี `total`, `free`, `paymentMethod` หรือ tax fields ที่ client อ้างเป็นราคาจริง:

```json
{
  "eventId": 2,
  "packageId": "7",
  "addOnIds": [],
  "currency": "THB",
  "promoCode": "FREE100",
  "needTaxInvoice": false
}
```

Positive-total conflict:

```json
{
  "success": false,
  "code": "PAYMENT_METHOD_REQUIRED",
  "error": "Checkout total requires payment; refresh pricing and choose a payment method"
}
```

การเอา default card ออกเป็น behavioral breaking change สำหรับ positive requests ที่เคย omit method แม้ URL/envelope เหมือนเดิม ห้ามเรียกว่า fully backward-compatible Repository caller ที่พบส่งวิธีชำระชัดเจนอยู่แล้ว แต่ production caller ภายนอกต้อง inventory ก่อน release ถ้าพบ caller ที่ยัง omit ให้แก้ caller เป็น card/qr ก่อน release API; ถ้าแก้ไม่ได้ให้หยุด rollout contract นี้และออกแบบ compatibility แยก ไม่แอบคืน default card ให้รายการฟรี

## Task 1: Tighten API method contract and reject incomplete previews

**Files:**
- Modify: `D:/confer/confer/conference/conference-api/src/schemas/payment.schema.ts:8`
- Create: `D:/confer/confer/conference/conference-api/src/schemas/payment.schema.test.ts`
- Modify: `D:/confer/confer/conference/conference-api/src/modules/payments/api-contract.ts`
- Modify: `D:/confer/confer/conference/conference-api/src/modules/payments/api-contract.test.ts`
- Modify: `D:/confer/confer/conference/conference-api/src/routes/payments/index.ts` (preview resolution; free tax/email; immediately before current paid order insertion around line 2411)

**Interfaces:**
- `createPaymentIntentSchema` keeps existing fields; inferred `paymentMethod` becomes `'qr' | 'card' | undefined`.
- Produce `paymentMethodRequiredResponse(): { statusCode: 409; body: { success: false; code: 'PAYMENT_METHOD_REQUIRED'; error: string } }`.
- Preserve existing `freeCheckoutResponse` unchanged.

- [ ] **Step 1: Add failing schema and response tests**

Create this schema test file:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { createPaymentIntentSchema } from './payment.schema.js';

const body = {
  eventId: 2, packageId: '7', addOnIds: [], currency: 'THB',
  needTaxInvoice: false,
};

test('omitting paymentMethod does not invent a card selection', () => {
  const parsed = createPaymentIntentSchema.parse(body);
  assert.equal(parsed.paymentMethod, undefined);
});

test('explicit supported methods remain valid', () => {
  for (const paymentMethod of ['qr', 'card']) {
    assert.equal(createPaymentIntentSchema.parse({ ...body, paymentMethod }).paymentMethod, paymentMethod);
  }
});

test('null and free are not user-selectable payment methods', () => {
  for (const paymentMethod of [null, 'free', 'cash']) {
    assert.equal(createPaymentIntentSchema.safeParse({ ...body, paymentMethod }).success, false);
  }
});

test('paid tax validation remains mandatory when requested', () => {
  assert.equal(createPaymentIntentSchema.safeParse({
    ...body, paymentMethod: 'card', needTaxInvoice: true,
  }).success, false);
});
```

Append to api-contract.test.ts, including the new symbol in its import:

```ts
test('missing method conflict preserves the existing error envelope', () => {
  assert.deepEqual(paymentMethodRequiredResponse(), {
    statusCode: 409,
    body: {
      success: false,
      code: 'PAYMENT_METHOD_REQUIRED',
      error: 'Checkout total requires payment; refresh pricing and choose a payment method',
    },
  });
});
```

- [ ] **Step 2: Verify RED**

Working directory API:

```powershell
npx tsx --test src/schemas/payment.schema.test.ts src/modules/payments/api-contract.test.ts
```

Expected: omission test fails because card is defaulted; new response symbol does not exist. Record actual failure before editing implementation.

- [ ] **Step 3: Remove default and add the response helper**

Replace only the schema method field:

```ts
paymentMethod: z.enum(['qr', 'card']).optional(),
```

Append in api-contract.ts:

```ts
export function paymentMethodRequiredResponse() {
  return {
    statusCode: 409 as const,
    body: {
      success: false as const,
      code: 'PAYMENT_METHOD_REQUIRED' as const,
      error: 'Checkout total requires payment; refresh pricing and choose a payment method',
    },
  };
}
```

Include helper in the route's existing api-contract import. Insert after the first zero-total branch returns and before `generateOrderNumber()`/paid order insert:

```ts
if (!paymentMethod) {
  const conflict = paymentMethodRequiredResponse();
  return reply.status(conflict.statusCode).send(conflict.body);
}
```

This narrows paymentMethod for the following paid code. Do not set a later `paymentMethod || 'card'`. The route currently has a second legacy zero-total block after paid order creation; leave unrelated cleanup out of this task. The new guard follows the authoritative first branch.

- [ ] **Step 4: Prevent a partial/empty preview from looking free**

In preview, after deriving `isAddonOnly` and before DB reads:

```ts
if (isAddonOnly && addOnIds.length === 0) {
  return reply.status(400).send({
    success: false,
    code: 'EMPTY_CHECKOUT',
    error: 'Please select a package or at least one add-on.',
  });
}
```

Replace preview's add-on loop (which currently ignores a missing add-on):

```ts
for (const addOnId of addOnIds) {
  const addon = await resolveTicketId(addOnId, eventId, currency, 'addon');
  if (!addon) {
    return reply.status(400).send({
      success: false,
      code: 'EVENT_TICKET_MISMATCH',
      error: `Add-on "${addOnId}" is not available for event ${eventId}`,
    });
  }
  subtotal += Number(addon.price);
  resolvedAddOns.push(addon);
}
```

No new reservation/side effect is added to preview. Quote still does not guarantee a seat or reserve a promo; create-intent retains full validation.

- [ ] **Step 5: Suppress tax requests on the successful free branch**

Replace the `taxInvoice` argument passed to `completeFreeCheckout` in the first zero-total branch:

```ts
taxInvoice: {
  needTaxInvoice: false,
  taxName: null,
  taxId: null,
  taxAddress: null,
  taxSubDistrict: null,
  taxDistrict: null,
  taxProvince: null,
  taxPostalCode: null,
  taxFullAddress: null,
},
```

In that branch's `sendPaymentReceiptEmail` call replace the conditional tax-info argument with `undefined`; keep every other argument, promotion metadata and best-effort post-commit delivery. The paid tax path remains unchanged. Malformed tax fields can still fail schema validation; normal new free clients strip them in T3. Do not weaken paid tax field validation to accommodate stale storage.

- [ ] **Step 6: Verify GREEN and build**

```powershell
npx tsx --test src/schemas/payment.schema.test.ts src/modules/payments/api-contract.test.ts src/utils/promoDiscount.test.ts src/services/emailTemplates.test.ts src/services/receiptPdf.test.ts
npm run build
```

Expected: focused tests pass and tsc accepts optional method because paid code is narrowed after the free branch. Route ordering is proven by T2 rather than a source-text assertion.

- [ ] **Step 7: Commit scoped API files**

```powershell
git add -- src/schemas/payment.schema.ts src/schemas/payment.schema.test.ts src/modules/payments/api-contract.ts src/modules/payments/api-contract.test.ts src/routes/payments/index.ts
git commit -m "fix(checkout): require a selected method only for positive totals"
```

## Task 2: Prove HTTP behavior and absence of paid side effects

**Files:**
- Create: `D:/confer/confer/conference/conference-api/src/modules/payments/checkout-flow.integration.test.ts`
- Modify: `D:/confer/confer/conference/conference-api/package.json`
- Existing regression: `D:/confer/confer/conference/conference-api/src/modules/payments/free-checkout.integration.test.ts`

**Interfaces:**
- Consume actual `paymentRoutes` default export and existing `validatePaymentsTestDatabaseUrl`/`openPaymentsTestDatabase`.
- Produce explicit npm command `test:checkout-flow:integration` (isolated DB required).
- Do not replace a missing test database with DATABASE_URL. No production credentials, email or gateway requests are used.

- [ ] **Step 1: Add an HTTP integration test before accepting T1**

Use this complete initial fixture/test file. It calls real route handlers with test-only authentication and blocks outbound axios calls. Extend the case table in Step 3 in the same file.

```ts
import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { randomUUID } from 'node:crypto';
import Fastify, { type FastifyRequest } from 'fastify';
import axios from 'axios';
import { openPaymentsTestDatabase, validatePaymentsTestDatabaseUrl } from './test-database.js';

const run = process.env.npm_lifecycle_event === 'test:checkout-flow:integration';

test('checkout HTTP contract uses an isolated DB', { skip: !run }, async () => {
  const testUrl = validatePaymentsTestDatabaseUrl();
  const sql = await openPaymentsTestDatabase();
  const savedEnv = {
    DATABASE_URL: process.env.DATABASE_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    PAY_SOLUTIONS_MERCHANT_ID: process.env.PAY_SOLUTIONS_MERCHANT_ID,
    PAY_SOLUTIONS_PAYMENT_FORM_ACTION_URL: process.env.PAY_SOLUTIONS_PAYMENT_FORM_ACTION_URL,
    NODE_ENV: process.env.NODE_ENV,
  };
  process.env.DATABASE_URL = testUrl;
  process.env.STRIPE_SECRET_KEY = 'sk_test_checkout_contract';
  process.env.JWT_SECRET = 'checkout-contract-test-secret';
  process.env.PAY_SOLUTIONS_MERCHANT_ID = '99999';
  process.env.PAY_SOLUTIONS_PAYMENT_FORM_ACTION_URL = 'https://gateway.example.test/payment';
  process.env.NODE_ENV = 'test';
  let outboundCalls = 0;
  mock.method(axios, 'post', async () => {
    outboundCalls++;
    throw new Error('Outbound HTTP is disabled in checkout integration tests');
  });
  mock.method(axios, 'get', async () => {
    outboundCalls++;
    throw new Error('Outbound HTTP is disabled in checkout integration tests');
  });

  const app = Fastify({ logger: false });
  let eventId: number | undefined;
  const userIds: number[] = [];
  let closeDatabase: (() => Promise<void>) | undefined;
  const suffix = randomUUID().slice(0, 8);
  try {
    const paymentRoutes = (await import('../../routes/payments/index.js')).default;
    closeDatabase = (await import('../../database/index.js')).closeDatabase;
    app.decorate('authenticate', async (request: FastifyRequest) => {
      request.user = {
        id: Number(request.headers['x-test-user-id']),
        email: 'checkout@example.test', role: 'general',
      };
    });
    await app.register(paymentRoutes, { prefix: '/api/payments' });
    const [event] = await sql<Array<{ id: number }>>`
      INSERT INTO events (event_code, event_name, event_type, start_date, end_date, status)
      VALUES (${`__checkout_flow_${suffix}`}, 'Checkout Flow Test', 'single_room', now(), now() + interval '1 day', 'published')
      RETURNING id
    `;
    eventId = event.id;
    const [ticket] = await sql<Array<{ id: number }>>`
      INSERT INTO ticket_types (event_id, category, priority, name, price, currency, quota, sold_count, is_active, allowed_roles)
      VALUES (${eventId}, 'primary', 'regular', 'Checkout Ticket', 500, 'THB', 100, 0, true, 'general') RETURNING id
    `;
    const [promo] = await sql<Array<{ id: number }>>`
      INSERT INTO promo_codes (event_id, code, discount_type, discount_value, min_purchase, max_uses, max_uses_per_user, used_count, is_active)
      VALUES (${eventId}, ${`FREE-${suffix}`}, 'percentage', 100, 0, 20, 1, 0, true) RETURNING id
    `;
    const newUser = async () => {
      const [user] = await sql<Array<{ id: number }>>`
        INSERT INTO users (email, password_hash, role, first_name, last_name, status)
        VALUES (${`checkout-${randomUUID()}@example.test`}, 'test-hash', 'general', 'Test', 'User', 'active') RETURNING id
      `;
      userIds.push(user.id);
      return user.id;
    };
    const inject = (userId: number, endpoint: string, payload: Record<string, unknown>) => app.inject({
      method: 'POST', url: `/api/payments/${endpoint}`,
      headers: { 'x-test-user-id': String(userId) }, payload,
    });
    const body = { eventId, packageId: String(ticket.id), addOnIds: [], currency: 'THB', needTaxInvoice: false };
    const counts = async () => (await sql`
      SELECT
        (SELECT count(*)::int FROM orders WHERE event_id=${eventId}) AS orders,
        (SELECT count(*)::int FROM payments p JOIN orders o ON o.id=p.order_id WHERE o.event_id=${eventId}) AS payments,
        (SELECT count(*)::int FROM promo_code_usages WHERE promo_code_id=${promo.id}) AS usages,
        (SELECT count(*)::int FROM registrations WHERE event_id=${eventId}) AS registrations,
        (SELECT sold_count FROM ticket_types WHERE id=${ticket.id}) AS sold
    `)[0];

    const before = await counts();
    const preview = await inject(await newUser(), 'preview', { ...body, promoCode: `FREE-${suffix}` });
    assert.equal(preview.statusCode, 200);
    assert.equal(preview.json().data.total, 0);
    assert.deepEqual(await counts(), before);
    const missing = await inject(await newUser(), 'create-intent', body);
    assert.equal(missing.statusCode, 409);
    assert.equal(missing.json().code, 'PAYMENT_METHOD_REQUIRED');
    assert.deepEqual(await counts(), before);
    const invalidAddon = await inject(await newUser(), 'preview', { ...body, addOnIds: ['missing-addon'] });
    assert.equal(invalidAddon.statusCode, 400);
    assert.equal(invalidAddon.json().code, 'EVENT_TICKET_MISMATCH');
    const empty = await inject(await newUser(), 'preview', { ...body, packageId: '' });
    assert.equal(empty.statusCode, 400);
    assert.equal(empty.json().code, 'EMPTY_CHECKOUT');
    assert.deepEqual(await counts(), before);

    // Valid legacy tax input must not persist a tax request on a free order.
    const free = await inject(await newUser(), 'create-intent', {
      ...body, promoCode: `FREE-${suffix}`, needTaxInvoice: true,
      taxName: 'Test User', taxId: '1234567890123', taxAddress: '1 Test Road',
      taxSubDistrict: 'Test', taxDistrict: 'Test', taxProvince: 'Test', taxPostalCode: '10100',
    });
    assert.equal(free.statusCode, 200);
    const result = free.json().data;
    assert.equal(result.free, true);
    assert.equal(result.gateway, null);
    assert.equal(result.redirectForm, null);
    assert.equal(result.total, 0);
    assert.ok(result.regCode);
    const [stored] = await sql`
      SELECT o.status, o.need_tax_invoice, o.tax_id, p.payment_provider, p.payment_channel, r.status AS registration_status
      FROM orders o JOIN payments p ON p.order_id=o.id JOIN registrations r ON r.order_id=o.id
      WHERE o.id=${result.orderId}
    `;
    assert.equal(stored.status, 'paid');
    assert.equal(stored.need_tax_invoice, false);
    assert.equal(stored.tax_id, null);
    assert.equal(stored.payment_provider, 'internal');
    assert.equal(stored.payment_channel, 'free');
    assert.equal(stored.registration_status, 'confirmed');

    // Email is best-effort; any attempt is blocked by axios mocks.
    const callsBeforeMissing = outboundCalls;
    const conflict = await inject(await newUser(), 'create-intent', body);
    assert.equal(conflict.statusCode, 409);
    assert.equal(outboundCalls, callsBeforeMissing);
  } finally {
    await app.close();
    if (eventId !== undefined) {
      await sql`DELETE FROM registration_sessions WHERE registration_id IN (SELECT id FROM registrations WHERE event_id=${eventId})`;
      await sql`DELETE FROM promo_code_usages WHERE promo_code_id IN (SELECT id FROM promo_codes WHERE event_id=${eventId})`;
      await sql`DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE event_id=${eventId})`;
      await sql`DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE event_id=${eventId})`;
      await sql`DELETE FROM registrations WHERE event_id=${eventId}`;
      await sql`DELETE FROM orders WHERE event_id=${eventId}`;
      await sql`DELETE FROM promo_codes WHERE event_id=${eventId}`;
      await sql`DELETE FROM ticket_sessions WHERE ticket_type_id IN (SELECT id FROM ticket_types WHERE event_id=${eventId})`;
      await sql`DELETE FROM ticket_types WHERE event_id=${eventId}`;
      await sql`DELETE FROM sessions WHERE event_id=${eventId}`;
      await sql`DELETE FROM events WHERE id=${eventId}`;
    }
    if (userIds.length) await sql`DELETE FROM users WHERE id=ANY(${userIds})`;
    await closeDatabase?.();
    await sql.end({ timeout: 1 });
    mock.restoreAll();
    for (const [key, value] of Object.entries(savedEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
```

Register this script in package.json without changing existing payments scripts:

```json
"test:checkout-flow:integration": "tsx --test --test-concurrency=1 src/modules/payments/checkout-flow.integration.test.ts"
```

- [ ] **Step 2: Demonstrate RED against the old route, then GREEN against T1**

Run this test after T1 schema/response RED and before applying T1 route snippets, following the ordering above. Do not revert user files in place. Expected old failures: positive omission produces a paid attempt; missing Add-on yields a partial quote; free legacy tax input is stored.

```powershell
npm run test:checkout-flow:integration
```

Only run with a configured, migrated, isolated TEST_DATABASE_URL. Missing configuration is a blocked integration gate, not a passing test. Never set PAYMENTS_ALLOW_SHARED_TEST_DATABASE to bypass isolation.

- [ ] **Step 3: Extend the route matrix with actual requests**

Insert before the initial test file's finally block; use fresh users per successful primary checkout. These statements use variables/functions already defined above:

```ts
for (const currency of ['THB', 'USD']) {
  const [freeTicket] = await sql<Array<{ id: number }>>`
    INSERT INTO ticket_types (event_id, category, priority, name, price, currency, quota, sold_count, is_active, allowed_roles)
    VALUES (${eventId}, 'primary', 'regular', ${`Free ${currency}`}, 0, ${currency}, 100, 0, true, 'general') RETURNING id
  `;
  const response = await inject(await newUser(), 'create-intent', {
    ...body, packageId: String(freeTicket.id), currency,
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().data.total, 0);
  assert.equal(response.json().data.currency, currency);
  assert.equal(response.json().data.gateway, null);
}
await sql`UPDATE promo_codes SET discount_type='fixed', discount_value=500 WHERE id=${promo.id}`;
const fixed = await inject(await newUser(), 'create-intent', { ...body, promoCode: `FREE-${suffix}` });
assert.equal(fixed.statusCode, 200);
assert.equal(fixed.json().data.discountType, 'fixed');
assert.equal(fixed.json().data.total, 0);
await sql`UPDATE promo_codes SET discount_type='percentage', discount_value=100, max_discount=100 WHERE id=${promo.id}`;
const cappedBefore = await counts();
const capped = await inject(await newUser(), 'create-intent', { ...body, promoCode: `FREE-${suffix}` });
assert.equal(capped.statusCode, 409);
assert.equal(capped.json().code, 'PAYMENT_METHOD_REQUIRED');
assert.deepEqual(await counts(), cappedBefore);
for (const paymentMethod of [null, 'free', 'cash']) {
  const invalid = await inject(await newUser(), 'create-intent', { ...body, paymentMethod });
  assert.equal(invalid.statusCode, 400);
}
for (const paymentMethod of ['qr', 'card']) {
  const paid = await inject(await newUser(), 'create-intent', { ...body, paymentMethod });
  assert.equal(paid.statusCode, 200);
  assert.equal(paid.json().data.free, false);
  assert.ok(paid.json().data.redirectForm);
  assert.equal(paid.json().data.redirectForm.actionUrl, 'https://gateway.example.test/payment');
}
```

Also add add-on-only proof with an actual linked session, so entitlement is verifiable:

```ts
const owner = await newUser();
await sql`UPDATE ticket_types SET price=0 WHERE id=${ticket.id}`;
const primary = await inject(owner, 'create-intent', body);
assert.equal(primary.statusCode, 200);
const [addon] = await sql<Array<{ id: number }>>`
  INSERT INTO ticket_types (event_id, category, priority, group_name, name, price, currency, quota, sold_count, is_active)
  VALUES (${eventId}, 'addon', 'regular', 'gala', 'Gala Test', 0, 'THB', 100, 0, true) RETURNING id
`;
const [session] = await sql<Array<{ id: number }>>`
  INSERT INTO sessions (event_id, session_code, session_name, session_type, start_time, end_time, requires_opt_in, is_active)
  VALUES (${eventId}, ${`GALA-${suffix}`}, 'Gala Session', 'other', now(), now() + interval '1 hour', false, true) RETURNING id
`;
await sql`INSERT INTO ticket_sessions (ticket_type_id, session_id) VALUES (${addon.id}, ${session.id})`;
const extra = await inject(owner, 'create-intent', { ...body, packageId: '', addOnIds: ['gala'] });
assert.equal(extra.statusCode, 200);
assert.equal(extra.json().data.free, true);
assert.equal(extra.json().data.regCode, primary.json().data.regCode);
const [entitlement] = await sql`
  SELECT count(*)::int AS count FROM registration_sessions rs
  JOIN registrations r ON r.id=rs.registration_id
  WHERE r.user_id=${owner} AND r.event_id=${eventId} AND rs.session_id=${session.id}
`;
assert.equal(entitlement.count, 1);
```

The current active route uses Pay Solutions; KTB code is disabled in that route. Preserve KTB utilities and existing tests, but do not claim this HTTP script exercised a live KTB path. For free email proof inspect existing template tests separately: blocked outbound email is intentionally not proof of deliverability.

- [ ] **Step 4: Run existing atomicity/concurrency regression in the same isolated target**

```powershell
npm run test:payments:integration
npm run test:checkout-flow:integration
npm run build
```

Expected: free settlement rollback/concurrency and new HTTP cases pass. Record fixture cleanup, no live outbound request, and exact counts. Do not run both integration processes in parallel against one target.

- [ ] **Step 5: Commit HTTP proof**

```powershell
git add -- src/modules/payments/checkout-flow.integration.test.ts package.json
git commit -m "test(checkout): prove method-free registration and paid guards"
```

## Task 3: Define web request types and strip stale free tax/method data

**Files:**
- Modify: `D:/confer/confer/conference/conference-web/src/lib/api/payments.ts`
- Modify: `D:/confer/confer/conference/conference-web/src/lib/api/payments.test.ts`
- Create: `D:/confer/confer/conference/conference-web/src/lib/checkout/paymentRequest.ts`
- Create: `D:/confer/confer/conference/conference-web/src/lib/checkout/paymentRequest.test.ts`

**Interfaces:**
- `CreateIntentRequest.paymentMethod?: 'qr' | 'card'`; `PreviewRequest.paymentMethod?: 'qr' | 'card'`.
- Add optional `currency?: 'THB' | 'USD' | null` to CreateIntentApiResponse.data and CreateIntentResponse; normalize from existing backend response.
- Produce `CheckoutPaymentData extends CheckoutData` with eventId, quotedTotal, currency and return context. quotedTotal is advisory session data only and is never sent as an amount to create-intent.
- Produce `buildCreateIntentRequest(data: CheckoutPaymentData): CreateIntentRequest` and `isCheckoutRecoveryError(code?: string): boolean`.

- [ ] **Step 1: Add serialization and payload tests before the builder exists**

Append this test inside paymentsApi.createIntent's existing describe:

```ts
it('sends no method for free checkout and preserves the server currency', async () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, data: {
      free: true, gateway: null, redirectForm: null, refno: null, orderRef: null,
      orderNumber: 'CONF-FREE-USD', regCode: 'REG-FREE-USD', total: 0, currency: 'USD',
    } }),
  } as Response);
  const result = await paymentsApi.createIntent({
    eventId: 2, packageId: '7', addOnIds: [], currency: 'USD', needTaxInvoice: false,
  });
  const body = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));
  expect(body).not.toHaveProperty('paymentMethod');
  expect(result.currency).toBe('USD');
  expect(result.gateway).toBeNull();
});
```

Create paymentRequest.test.ts with a full stored-data fixture:

```ts
import { describe, expect, it } from 'vitest';
import { buildCreateIntentRequest, isCheckoutRecoveryError, type CheckoutPaymentData } from './paymentRequest';

const data: CheckoutPaymentData = {
  eventId: '2', quotedTotal: 0, currency: 'USD',
  originApp: 'pris2026', returnTo: 'https://event.example.test', websiteUrl: 'https://event.example.test',
  firstName: 'Test', lastName: 'User', email: 'test@example.test', phone: '0800000000', country: 'US',
  selectedPackage: '7', selectedAddOns: ['workshop'], selectedWorkshopTopic: '11',
  selectedOptionalSessions: ['12'], ownedSessionIds: [], isAddonOnly: false, purchasedAddOns: [],
  dietaryRequirement: 'other', dietaryOtherText: 'Vegetarian',
  paymentMethod: 'card', promoCode: 'FREE100', promoApplied: true,
  needTaxInvoice: true, taxName: 'Old Tax', taxId: '1234567890123', taxAddress: 'Old Address',
  taxSubDistrict: 'Old', taxDistrict: 'Old', taxProvince: 'Old', taxPostalCode: '10100',
};

describe('checkout request boundary', () => {
  it('omits method, tax fields, quoted amount and return context for a free request', () => {
    expect(buildCreateIntentRequest(data)).toEqual({
      eventId: 2, packageId: '7', addOnIds: ['workshop'], currency: 'USD',
      promoCode: 'FREE100', workshopSessionId: 11, optionalSessionIds: [12],
      dietaryRequirement: 'Vegetarian', needTaxInvoice: false,
    });
  });
  it('requires an explicit method for a positive quoted total', () => {
    expect(() => buildCreateIntentRequest({ ...data, quotedTotal: 500, paymentMethod: null })).toThrow(/payment method/i);
  });
  it('preserves paid tax fields and a selected QR method', () => {
    const request = buildCreateIntentRequest({ ...data, quotedTotal: 500, currency: 'THB', paymentMethod: 'qr' });
    expect(request.paymentMethod).toBe('qr');
    expect(request.needTaxInvoice).toBe(true);
    expect(request.taxId).toBe(data.taxId);
  });
  it('supports addon-only and sends only applied codes', () => {
    const request = buildCreateIntentRequest({ ...data, isAddonOnly: true, promoApplied: false });
    expect(request.packageId).toBe('');
    expect(request).not.toHaveProperty('promoCode');
  });
  it('rejects unresolved legacy or malformed stored quotes', () => {
    for (const quotedTotal of [undefined, null, -1, NaN, Infinity]) {
      expect(() => buildCreateIntentRequest({ ...data, quotedTotal } as CheckoutPaymentData)).toThrow(/quote/i);
    }
    expect(() => buildCreateIntentRequest({ ...data, eventId: 'invalid' })).toThrow(/event/i);
  });
  it('recognizes pricing and promo recovery without treating network failures as retry-safe', () => {
    for (const code of ['PAYMENT_METHOD_REQUIRED', 'FREE_TOTAL_CHANGED', 'PROMO_CHECKOUT_CHANGED', 'INVALID_PROMO', 'PROMO_USER_LIMIT_REACHED', 'PROMO_USAGE_LIMIT_REACHED']) {
      expect(isCheckoutRecoveryError(code)).toBe(true);
    }
    expect(isCheckoutRecoveryError(undefined)).toBe(false);
  });
});
```

- [ ] **Step 2: Verify RED**

Working directory Web:

```powershell
npx vitest run src/lib/api/payments.test.ts src/lib/checkout/paymentRequest.test.ts
```

Expected: new builder import missing / currency not normalized. Type checking should also reject method omission until types change.

- [ ] **Step 3: Update API types and normalization**

Change method fields to optional in both request interfaces. Add the optional currency property to the raw/normalized create response interfaces. Add this property to the return object in paymentsApi.createIntent:

```ts
currency: payload?.currency === 'THB' || payload?.currency === 'USD' ? payload.currency : null,
```

Keep all existing free/gateway/order/ref normalizers and error propagation. The existing generic api.post uses JSON.stringify, so undefined properties are omitted; no new transport wrapper is needed.

- [ ] **Step 4: Add the exact request builder**

Create paymentRequest.ts:

```ts
import type { CheckoutData } from '@/hooks/checkout/useCheckoutWizard';
import type { CreateIntentRequest } from '@/lib/api/payments';

export interface CheckoutPaymentData extends CheckoutData {
  eventId: string;
  quotedTotal: number;
  currency: 'THB' | 'USD';
  originApp?: string | null;
  returnTo?: string | null;
  websiteUrl?: string | null;
}

export function buildCreateIntentRequest(data: CheckoutPaymentData): CreateIntentRequest {
  const eventId = Number(data.eventId);
  if (!Number.isInteger(eventId) || eventId <= 0) throw new Error('Invalid event context for checkout');
  if (typeof data.quotedTotal !== 'number' || !Number.isFinite(data.quotedTotal) || data.quotedTotal < 0) {
    throw new Error('Checkout quote must be refreshed');
  }
  if (data.currency !== 'THB' && data.currency !== 'USD') throw new Error('Invalid checkout currency');
  const isFree = data.quotedTotal === 0;
  if (!isFree && data.paymentMethod !== 'qr' && data.paymentMethod !== 'card') {
    throw new Error('Please select a payment method');
  }
  const workshopSessionId = Number(data.selectedWorkshopTopic);
  const optionalSessionIds = data.selectedOptionalSessions
    .map(Number).filter((id) => Number.isInteger(id) && id > 0);
  const needTaxInvoice = !isFree && data.needTaxInvoice;
  return {
    eventId,
    packageId: data.isAddonOnly ? '' : data.selectedPackage,
    addOnIds: data.selectedAddOns,
    currency: data.currency,
    ...(!isFree ? { paymentMethod: data.paymentMethod as 'qr' | 'card' } : {}),
    ...(data.promoApplied && data.promoCode.trim() ? { promoCode: data.promoCode.trim() } : {}),
    ...(Number.isInteger(workshopSessionId) && workshopSessionId > 0 ? { workshopSessionId } : {}),
    ...(optionalSessionIds.length ? { optionalSessionIds } : {}),
    ...(data.dietaryRequirement ? {
      dietaryRequirement: data.dietaryRequirement === 'other' ? data.dietaryOtherText : data.dietaryRequirement,
    } : {}),
    needTaxInvoice,
    ...(needTaxInvoice ? {
      taxName: data.taxName, taxId: data.taxId, taxAddress: data.taxAddress,
      taxSubDistrict: data.taxSubDistrict, taxDistrict: data.taxDistrict,
      taxProvince: data.taxProvince, taxPostalCode: data.taxPostalCode,
    } : {}),
  };
}

export function isCheckoutRecoveryError(code?: string): boolean {
  return code === 'PAYMENT_METHOD_REQUIRED'
    || code === 'FREE_TOTAL_CHANGED'
    || code === 'PROMO_CHECKOUT_CHANGED'
    || code === 'INVALID_PROMO'
    || Boolean(code?.startsWith('PROMO_'));
}
```

quotedTotal is not trusted by the backend: modifying storage from free to positive or vice versa cannot change the actual charge; server recalculation and missing-method guard decide it. Malformed storage is a client-side recovery case; T7 directs users back to checkout instead of guessing a quote.

- [ ] **Step 5: Verify GREEN and commit**

```powershell
npx vitest run src/lib/api/payments.test.ts src/lib/checkout/paymentRequest.test.ts
npx tsc --noEmit --incremental false
git add -- src/lib/api/payments.ts src/lib/api/payments.test.ts src/lib/checkout/paymentRequest.ts src/lib/checkout/paymentRequest.test.ts
git commit -m "refactor(checkout): serialize free and paid requests explicitly"
```

## Task 4: Introduce a current server quote with stale-response protection

**Files:**
- Create: `D:/confer/confer/conference/conference-web/src/hooks/checkout/useCheckoutQuote.ts`
- Create: `D:/confer/confer/conference/conference-web/src/hooks/checkout/useCheckoutQuote.test.tsx`

**Interfaces:**
- Produce `CheckoutQuoteState` union (idle/loading/ready/error), ready quote = existing PreviewResponse.
- Produce `CheckoutQuoteInput { accountId: string; request: PreviewRequest }`.
- Produce `useCheckoutQuote(input: CheckoutQuoteInput | null): { state: CheckoutQuoteState; retry: () => Promise<unknown> }`.
- No cached quote or local fallback may qualify as ready while fetching the current quote.

- [ ] **Step 1: Write observable hook tests**

Create the test file using a QueryClient per test and controlled promises:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { paymentsApi, type PreviewResponse } from '@/lib/api/payments';
import { useCheckoutQuote, type CheckoutQuoteInput } from './useCheckoutQuote';

const quote = (total: number, promoValid = false): PreviewResponse => ({
  success: true, subtotal: 500, discountAmount: 500 - total,
  discountType: total < 500 ? 'percentage' : null, discountValue: total < 500 ? 100 : null,
  netAmount: total, fee: 0, total, currency: 'THB', feeMethod: null, promoValid, promoError: null,
});
const input: CheckoutQuoteInput = {
  accountId: '1', request: { eventId: 2, packageId: '7', addOnIds: [], currency: 'THB', promoCode: 'FREE100' },
};
const clients: QueryClient[] = [];
const wrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  clients.push(client);
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
};
afterEach(() => { clients.splice(0).forEach((client) => client.clear()); vi.restoreAllMocks(); });

describe('server-authoritative checkout quote', () => {
  it('does not classify unresolved or empty checkout as free', () => {
    const preview = vi.spyOn(paymentsApi, 'preview');
    const { result } = renderHook(() => useCheckoutQuote(null), { wrapper: wrapper() });
    expect(result.current.state.status).toBe('idle');
    expect(preview).not.toHaveBeenCalled();
  });
  it('blocks invalid promos even when preview returns a positive total', async () => {
    vi.spyOn(paymentsApi, 'preview').mockResolvedValue({ ...quote(500), promoError: 'Code expired' });
    const { result } = renderHook(() => useCheckoutQuote(input), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.state.status).toBe('error'));
    expect(result.current.state).not.toHaveProperty('quote');
  });
  it('ignores a delayed zero result after the cart identity changes', async () => {
    let resolveOld!: (value: PreviewResponse) => void;
    const oldRequest = new Promise<PreviewResponse>((resolve) => { resolveOld = resolve; });
    vi.spyOn(paymentsApi, 'preview').mockReturnValueOnce(oldRequest).mockResolvedValueOnce(quote(500));
    const { result, rerender } = renderHook(({ value }) => useCheckoutQuote(value), {
      initialProps: { value: input }, wrapper: wrapper(),
    });
    rerender({ value: { ...input, request: { ...input.request, packageId: '8', promoCode: undefined } } });
    expect(result.current.state.status).toBe('loading');
    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    await act(async () => resolveOld(quote(0, true)));
    const state = result.current.state;
    expect(state.status === 'ready' && state.quote.total).toBe(500);
  });
  it('does not expose cached zero as ready during a refresh', async () => {
    let resolveRefresh!: (value: PreviewResponse) => void;
    vi.spyOn(paymentsApi, 'preview').mockResolvedValueOnce(quote(0, true))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveRefresh = resolve; }));
    const { result } = renderHook(() => useCheckoutQuote(input), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    let refresh!: Promise<unknown>;
    act(() => { refresh = result.current.retry(); });
    await waitFor(() => expect(result.current.state.status).toBe('loading'));
    await act(async () => { resolveRefresh(quote(0, true)); await refresh; });
    expect(result.current.state.status).toBe('ready');
  });
  it('blocks malformed pricing and currency mismatches', async () => {
    vi.spyOn(paymentsApi, 'preview').mockResolvedValue({ ...quote(0, true), currency: 'USD' });
    const { result } = renderHook(() => useCheckoutQuote(input), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.state.status).toBe('error'));
  });
});
```

Append these account/currency/retry tests to the same describe block:

```tsx
it('changes account identity without retaining a ready quote', async () => {
  let resolveNext!: (value: PreviewResponse) => void;
  const preview = vi.spyOn(paymentsApi, 'preview').mockResolvedValueOnce(quote(0, true))
    .mockImplementationOnce(() => new Promise((resolve) => { resolveNext = resolve; }));
  const { result, rerender } = renderHook(({ value }) => useCheckoutQuote(value), {
    initialProps: { value: input }, wrapper: wrapper(),
  });
  await waitFor(() => expect(result.current.state.status).toBe('ready'));
  rerender({ value: { ...input, accountId: '2' } });
  expect(result.current.state.status).toBe('loading');
  await waitFor(() => expect(preview).toHaveBeenCalledTimes(2));
  await act(async () => resolveNext(quote(0, true)));
  await waitFor(() => expect(result.current.state.status).toBe('ready'));
});

it('revalidates currency rather than displaying the previous zero quote', async () => {
  let resolveNext!: (value: PreviewResponse) => void;
  const preview = vi.spyOn(paymentsApi, 'preview').mockResolvedValueOnce(quote(0, true))
    .mockImplementationOnce(() => new Promise((resolve) => { resolveNext = resolve; }));
  const { result, rerender } = renderHook(({ value }) => useCheckoutQuote(value), {
    initialProps: { value: input }, wrapper: wrapper(),
  });
  await waitFor(() => expect(result.current.state.status).toBe('ready'));
  rerender({ value: { ...input, request: { ...input.request, currency: 'USD' } } });
  expect(result.current.state.status).toBe('loading');
  await waitFor(() => expect(preview).toHaveBeenCalledWith(expect.objectContaining({ currency: 'USD' })));
  await act(async () => resolveNext({ ...quote(0, true), currency: 'USD' }));
  await waitFor(() => expect(result.current.state.status).toBe('ready'));
});

it('recovers a failed preview only after a successful explicit retry', async () => {
  vi.spyOn(paymentsApi, 'preview').mockRejectedValueOnce(new Error('Network unavailable')).mockResolvedValueOnce(quote(0, true));
  const { result } = renderHook(() => useCheckoutQuote(input), { wrapper: wrapper() });
  await waitFor(() => expect(result.current.state.status).toBe('error'));
  await act(async () => { await result.current.retry(); });
  expect(result.current.state.status).toBe('ready');
});
```

- [ ] **Step 2: Verify RED**

```powershell
npx vitest run src/hooks/checkout/useCheckoutQuote.test.tsx
```

Expected: missing hook import. Do not install a different query library to implement it.

- [ ] **Step 3: Implement the hook**

```ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { paymentsApi, type PreviewRequest, type PreviewResponse } from '@/lib/api/payments';
import type { ApiError } from '@/lib/api/client';

export type CheckoutQuoteState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; quote: PreviewResponse }
  | { status: 'error'; error: ApiError };

export interface CheckoutQuoteInput {
  accountId: string;
  request: PreviewRequest;
}

export function useCheckoutQuote(input: CheckoutQuoteInput | null) {
  const request = input ? {
    eventId: input.request.eventId,
    packageId: input.request.packageId,
    addOnIds: [...input.request.addOnIds].sort(),
    currency: input.request.currency,
    ...(input.request.promoCode?.trim() ? { promoCode: input.request.promoCode.trim().toUpperCase() } : {}),
  } : null;
  const query = useQuery<PreviewResponse, ApiError>({
    queryKey: ['checkout-quote', input?.accountId ?? null, request],
    enabled: request !== null,
    staleTime: 0,
    refetchOnMount: 'always',
    retry: false,
    queryFn: async () => {
      if (!request) throw new Error('Checkout items are unresolved');
      const quote = await paymentsApi.preview(request);
      if (request.promoCode && !quote.promoValid) {
        const error = new Error(quote.promoError || 'โค้ดส่วนลดไม่ถูกต้อง') as ApiError;
        error.code = 'INVALID_PROMO';
        throw error;
      }
      const amounts = [quote.subtotal, quote.discountAmount, quote.netAmount, quote.fee, quote.total];
      if (!quote.success || quote.currency !== request.currency || amounts.some((amount) => !Number.isFinite(amount) || amount < 0)
        || Math.abs(quote.subtotal - quote.discountAmount - quote.netAmount) > 0.01
        || Math.abs(quote.netAmount + quote.fee - quote.total) > 0.01) {
        throw new Error('Invalid checkout pricing response');
      }
      return quote;
    },
  });
  let state: CheckoutQuoteState;
  if (!input) state = { status: 'idle' };
  else if (query.isFetching || query.isPending) state = { status: 'loading' };
  else if (query.isError) state = { status: 'error', error: query.error };
  else if (query.data) state = { status: 'ready', quote: query.data };
  else state = { status: 'idle' };
  return { state, retry: query.refetch };
}
```

Important: do not add placeholderData/keepPreviousData or staleTime that enables an old zero quote while revalidating. The query key contains normalized requested promo, not draft text or paymentMethod; existing backend fee=0 means selecting a method does not change this quote. Old requests may finish in their own cache, but cannot update the current observer.

- [ ] **Step 4: Verify GREEN and commit**

```powershell
npx vitest run src/hooks/checkout/useCheckoutQuote.test.tsx
npx tsc --noEmit --incremental false
git add -- src/hooks/checkout/useCheckoutQuote.ts src/hooks/checkout/useCheckoutQuote.test.tsx
git commit -m "feat(checkout): use a current server quote for payment decisions"
```

## Task 5: Make wizard navigation and validation depend on a confirmed quote

**Files:**
- Modify: `D:/confer/confer/conference/conference-web/src/hooks/checkout/useCheckoutWizard.ts`
- Create: `D:/confer/confer/conference/conference-web/src/hooks/checkout/useCheckoutWizard.test.tsx`
- Modify: `D:/confer/confer/conference/conference-web/src/components/checkout/StepIndicator.tsx`
- Create: `D:/confer/confer/conference/conference-web/src/components/checkout/StepIndicator.test.tsx`

**Interfaces:**
- Produce `CheckoutFlow { quoteReady: boolean; isFree: boolean }`.
- Export `FREE_CHECKOUT_DATA` for clearing tax fields/paymentMethod only, not package/session/promo fields.
- Add `requestedPromoCode?: string` to CheckoutData and `requestedPromoCode: ''` to INITIAL_CHECKOUT_DATA so an explicitly requested code remains requested across reload even when revalidation fails. Existing storage without this field falls back to promoApplied/promoCode.
- Wizard returns `isRestored`, `getSteps(flow)`, and existing navigation/validation callbacks with a CheckoutFlow argument. `goToStep(step, flow)` retains logical IDs.
- Initial/loading/failed quote: quoteReady=false and isFree=false; no submission is valid.

- [ ] **Step 1: Add failing navigation/validation tests**

Create useCheckoutWizard.test.tsx:

```tsx
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useCheckoutWizard, type CheckoutFlow } from './useCheckoutWizard';

const free: CheckoutFlow = { quoteReady: true, isFree: true };
const paid: CheckoutFlow = { quoteReady: true, isFree: false };
const unknown: CheckoutFlow = { quoteReady: false, isFree: false };
beforeEach(() => sessionStorage.clear());

describe('conditional checkout steps', () => {
  it('skips tax in both directions and permits free confirmation without a method', async () => {
    const { result } = renderHook(() => useCheckoutWizard('2'));
    await waitFor(() => expect(result.current.isRestored).toBe(true));
    act(() => result.current.updateCheckoutData({
      firstName: 'Test', lastName: 'User', email: 'test@example.test', phone: '0800000000', selectedPackage: '7',
    }));
    act(() => result.current.nextStep(free));
    expect(result.current.currentStep).toBe(2);
    act(() => result.current.nextStep(free));
    expect(result.current.currentStep).toBe(4);
    expect(result.current.getSteps(free).map((step) => step.id)).toEqual([1, 2, 4]);
    expect(result.current.canProceedToPayment(free)).toBe(true);
    act(() => result.current.prevStep(free));
    expect(result.current.currentStep).toBe(2);
  });
  it('requires a method for paid checkout and blocks unknown quotes', async () => {
    const { result } = renderHook(() => useCheckoutWizard('2'));
    await waitFor(() => expect(result.current.isRestored).toBe(true));
    act(() => result.current.updateCheckoutData({
      firstName: 'Test', lastName: 'User', email: 'test@example.test', phone: '0800000000', selectedPackage: '7',
    }));
    act(() => result.current.goToStep(2, paid));
    act(() => result.current.nextStep(unknown));
    expect(result.current.currentStep).toBe(2);
    act(() => result.current.nextStep(paid));
    expect(result.current.currentStep).toBe(3);
    act(() => result.current.nextStep(paid));
    expect(result.current.currentStep).toBe(4);
    expect(result.current.canProceedToPayment(paid)).toBe(false);
    act(() => result.current.updateCheckoutData({ paymentMethod: 'qr' }));
    expect(result.current.canProceedToPayment(paid)).toBe(true);
    expect(result.current.canProceedToPayment(unknown)).toBe(false);
  });
  it('keeps paid tax validation while free confirmation ignores tax requirements', async () => {
    const { result } = renderHook(() => useCheckoutWizard('2'));
    await waitFor(() => expect(result.current.isRestored).toBe(true));
    act(() => result.current.updateCheckoutData({
      firstName: 'Test', lastName: 'User', email: 'test@example.test', phone: '0800000000',
      selectedPackage: '7', paymentMethod: 'card', needTaxInvoice: true, taxId: '',
    }));
    expect(result.current.canProceedToPayment(paid)).toBe(false);
    expect(result.current.canProceedToPayment(free)).toBe(true);
  });
  it('restores data without trusting its free flag or persisting owned entitlements', async () => {
    sessionStorage.setItem('checkout-wizard-2', JSON.stringify({ currentStep: 4, checkoutData: {
      firstName: 'Saved', selectedPackage: '7', promoApplied: true, promoCode: 'FREE100', ownedSessionIds: [99],
    } }));
    const { result } = renderHook(() => useCheckoutWizard('2'));
    await waitFor(() => expect(result.current.isRestored).toBe(true));
    expect(result.current.checkoutData.firstName).toBe('Saved');
    expect(result.current.checkoutData.ownedSessionIds).toEqual([]);
    expect(result.current.canProceedToPayment(unknown)).toBe(false);
    const stored = JSON.parse(sessionStorage.getItem('checkout-wizard-2')!);
    expect(stored.checkoutData).not.toHaveProperty('ownedSessionIds');
  });
});
```

Create StepIndicator.test.tsx:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { StepIndicator } from './StepIndicator';

it('displays consecutive numbers while retaining logical step IDs', () => {
  const onStepClick = vi.fn();
  render(<StepIndicator steps={[
    { id: 1, label: 'ข้อมูลส่วนตัว' }, { id: 2, label: 'เลือกแพ็กเกจ' }, { id: 4, label: 'ยืนยันการลงทะเบียน' },
  ]} currentStep={4} onStepClick={onStepClick} />);
  expect(screen.getByText('3')).toBeInTheDocument();
  expect(screen.queryByText('4')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /เลือกแพ็กเกจ/ }));
  expect(onStepClick).toHaveBeenCalledWith(2);
});
```

- [ ] **Step 2: Verify RED**

```powershell
npx vitest run src/hooks/checkout/useCheckoutWizard.test.tsx src/components/checkout/StepIndicator.test.tsx
```

Expected: new flow interface/getSteps/isRestored missing; logical 4 still renders as 4.

- [ ] **Step 3: Add shared flow/clear-data declarations**

Keep existing CheckoutData/INITIAL_CHECKOUT_DATA fields; add the requestedPromoCode field/default described above and append before the hook:

```ts
export interface CheckoutFlow {
  quoteReady: boolean;
  isFree: boolean;
}

export const FREE_CHECKOUT_DATA = {
  needTaxInvoice: false,
  taxName: '', taxId: '', taxAddress: '', taxSubDistrict: '', taxDistrict: '', taxProvince: '', taxPostalCode: '',
  paymentMethod: null,
} satisfies Partial<CheckoutData>;
```

- [ ] **Step 4: Replace only the hook implementation with the following complete body**

```ts
export function useCheckoutWizard(eventId: string) {
  const storageKey = `checkout-wizard-${eventId}`;
  const [currentStep, setCurrentStep] = useState(1);
  const [checkoutData, setCheckoutData] = useState<CheckoutData>(INITIAL_CHECKOUT_DATA);
  const [restoredStorageKey, setRestoredStorageKey] = useState<string | null>(null);
  const isRestored = restoredStorageKey === storageKey;

  useEffect(() => {
    let data = INITIAL_CHECKOUT_DATA;
    let step = 1;
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.checkoutData) data = { ...INITIAL_CHECKOUT_DATA, ...parsed.checkoutData, ownedSessionIds: [] };
        if (Number.isInteger(parsed.currentStep) && parsed.currentStep >= 1 && parsed.currentStep <= 4) step = parsed.currentStep;
      }
    } catch {
      data = INITIAL_CHECKOUT_DATA;
    }
    setCheckoutData(data);
    setCurrentStep(step);
    setRestoredStorageKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (!isRestored) return;
    try {
      const persisted = Object.fromEntries(Object.entries(checkoutData).filter(([key]) => key !== 'ownedSessionIds'));
      sessionStorage.setItem(storageKey, JSON.stringify({ checkoutData: persisted, currentStep }));
    } catch {
      // The payment submission path reports storage errors before navigation.
    }
  }, [checkoutData, currentStep, isRestored, storageKey]);

  const updateCheckoutData = useCallback((updates: Partial<CheckoutData>) => {
    setCheckoutData((prev) => ({ ...prev, ...updates }));
  }, []);
  const isStep1Valid = useCallback(() => {
    const { firstName, lastName, email, phone } = checkoutData;
    return Boolean(firstName.trim() && lastName.trim() && email.trim() && phone.trim());
  }, [checkoutData]);
  const isStep2Valid = useCallback(() => checkoutData.isAddonOnly
    ? checkoutData.selectedAddOns.length > 0 : Boolean(checkoutData.selectedPackage), [checkoutData]);
  const isStep3Valid = useCallback((flow: CheckoutFlow) => {
    if (flow.isFree || !checkoutData.needTaxInvoice) return true;
    const { taxName, taxId, taxAddress, taxSubDistrict, taxDistrict, taxProvince, taxPostalCode } = checkoutData;
    return Boolean(taxName.trim() && /^\d{13}$/.test(taxId) && taxAddress.trim()
      && taxSubDistrict.trim() && taxDistrict.trim() && taxProvince.trim() && /^\d{5}$/.test(taxPostalCode));
  }, [checkoutData]);
  const isStep4Valid = useCallback((flow: CheckoutFlow) => flow.quoteReady
    && (flow.isFree || checkoutData.paymentMethod === 'qr' || checkoutData.paymentMethod === 'card'), [checkoutData.paymentMethod]);
  const isCurrentStepValid = useCallback((flow: CheckoutFlow) => {
    if (!isRestored) return false;
    switch (currentStep) {
      case 1: return isStep1Valid();
      case 2: return flow.quoteReady && isStep2Valid();
      case 3: return flow.quoteReady && isStep3Valid(flow);
      case 4: return isStep4Valid(flow);
      default: return false;
    }
  }, [currentStep, isRestored, isStep1Valid, isStep2Valid, isStep3Valid, isStep4Valid]);
  const canProceedToPayment = useCallback((flow: CheckoutFlow) => isRestored && flow.quoteReady
    && isStep1Valid() && isStep2Valid() && isStep3Valid(flow) && isStep4Valid(flow),
  [isRestored, isStep1Valid, isStep2Valid, isStep3Valid, isStep4Valid]);
  const getSteps = useCallback((flow: CheckoutFlow) => STEPS.filter((step) => !flow.isFree || step.id !== 3)
    .map((step) => ({ id: step.id, label: step.id === 4 && flow.isFree ? 'ยืนยันการลงทะเบียน' : step.label })), []);

  const nextStep = useCallback((flow: CheckoutFlow) => {
    if (!isCurrentStepValid(flow)) return;
    const next = currentStep === 2 && flow.isFree ? 4 : Math.min(currentStep + 1, 4);
    if (next === 4 && currentStep !== 4) setCheckoutData((prev) => ({ ...prev, paymentMethod: null }));
    setCurrentStep(next);
  }, [currentStep, isCurrentStepValid]);
  const prevStep = useCallback((flow: CheckoutFlow) => {
    setCurrentStep((prev) => prev === 4 && (flow.isFree || !flow.quoteReady) ? 2 : Math.max(prev - 1, 1));
  }, []);
  const goToStep = useCallback((step: number, flow: CheckoutFlow) => {
    if (step >= 1 && step <= 4 && (!flow.isFree || step !== 3)) setCurrentStep(step);
  }, []);
  const resetWizard = useCallback(() => {
    setCheckoutData(INITIAL_CHECKOUT_DATA);
    setCurrentStep(1);
    sessionStorage.removeItem(storageKey);
  }, [storageKey]);

  return {
    currentStep, checkoutData, isRestored, getSteps, updateCheckoutData, nextStep, prevStep, goToStep, resetWizard,
    isCurrentStepValid, canProceedToPayment, isStep1Valid, isStep2Valid, isStep3Valid, isStep4Valid,
  };
}
```

Tax numeric validation mirrors existing API boundaries and avoids a button enabled for a known-invalid tax ID/postal code. It does not add a tax checksum or alter accounting policy. Session/workshop constraints still belong to existing selectors and create-intent checks; do not remove those checks while refactoring this hook.

Account prefill is a separate page effect. After adding hydration gating, make that effect wait for `isRestored` and include it in dependencies so profile fields are applied after restored data, not overwritten by restoration.

Replace the page's existing profile-prefill effect with this complete version; compare fields so updating data does not cause a loop:

```ts
useEffect(() => {
  if (!isRestored || !user || !isLoggedIn) return;
  const updates = {
    firstName: user.firstName || checkoutData.firstName,
    lastName: user.lastName || checkoutData.lastName,
    email: user.email || checkoutData.email,
    phone: user.phone || checkoutData.phone,
    country: user.country || checkoutData.country,
  };
  if (updates.firstName !== checkoutData.firstName || updates.lastName !== checkoutData.lastName
    || updates.email !== checkoutData.email || updates.phone !== checkoutData.phone || updates.country !== checkoutData.country) {
    updateCheckoutData(updates);
  }
}, [isRestored, user, isLoggedIn, checkoutData.firstName, checkoutData.lastName,
  checkoutData.email, checkoutData.phone, checkoutData.country, updateCheckoutData]);
```

- [ ] **Step 5: Use consecutive visible step numbers**

In StepIndicator's existing circle replace its non-completed text expression:

```tsx
{isCompleted ? <Check className="w-4 h-4" /> : index + 1}
```

Keep key=step.id, comparisons with currentStep, and callback argument step.id. Do not renumber persisted logical IDs.

- [ ] **Step 6: Verify GREEN and update dependent calls in T6 before build**

```powershell
npx vitest run src/hooks/checkout/useCheckoutWizard.test.tsx src/components/checkout/StepIndicator.test.tsx
```

Expected focused tests pass. Full web tsc is intentionally gated on T6 updating the one existing page caller; do not declare the overall web build complete at this intermediate point.

Commit T5 together with the page wiring in T6 so the committed application does not have incompatible hook callers.

## Task 6: Connect the quote, promo, conditional steps, and final-only summary action

**Files:**
- Modify: `D:/confer/confer/conference/conference-web/src/components/checkout/OrderSummary.tsx`
- Create: `D:/confer/confer/conference/conference-web/src/components/checkout/OrderSummary.test.tsx`
- Modify: `D:/confer/confer/conference/conference-web/src/components/checkout/PromoCodeSection.tsx`
- Modify: `D:/confer/confer/conference/conference-web/src/app/checkout/[id]/page.tsx`
- Create: `D:/confer/confer/conference/conference-web/src/app/checkout/[id]/page.test.tsx`

**Interfaces:**
- OrderSummary receives `quoteState: CheckoutQuoteState`, `showSubmit: boolean`, existing canSubmit/isSubmitting/actions. Remove unused paymentMethod and local promoDiscountAmount props.
- PromoCodeSection adds `isChecking?: boolean`, `disabled?: boolean`; default both false.
- Page computes `flow` from the current quote and initializes a requested promo from restored wizard state once per account/event.
- Page writes `CheckoutPaymentData.quotedTotal` only from a ready quote.

- [ ] **Step 1: Add final-action tests**

Create OrderSummary.test.tsx:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OrderSummary } from './OrderSummary';
import type { CheckoutQuoteState } from '@/hooks/checkout/useCheckoutQuote';

const quoteState: CheckoutQuoteState = { status: 'ready', quote: {
  success: true, subtotal: 500, discountAmount: 500, discountType: 'percentage', discountValue: 100,
  netAmount: 0, fee: 0, total: 0, currency: 'THB', feeMethod: null, promoValid: true, promoError: null,
} };
const props = {
  eventName: 'Test Event', selectedPackage: '7', selectedAddOns: [], currency: 'THB' as const,
  packages: [{ id: '7', groupName: 'Main', name: 'Main Ticket', price: 500, currency: 'THB', quota: 100, soldCount: 0, available: 100, isActive: true }],
  addons: [], promoCode: 'FREE100', promoApplied: true,
  onPromoCodeChange: vi.fn(), onApplyPromo: vi.fn().mockResolvedValue(undefined), onRemovePromo: vi.fn(),
  onSubmit: vi.fn(), isSubmitting: false, canSubmit: true, showSubmit: false, quoteState,
};

describe('checkout final action', () => {
  it('does not render a submit button before the final step', () => {
    render(<OrderSummary {...props} />);
    expect(screen.queryByRole('button', { name: /ชำระเงิน|ยืนยันการลงทะเบียน/ })).not.toBeInTheDocument();
  });
  it('confirms a free registration only when clicked', () => {
    render(<OrderSummary {...props} showSubmit />);
    expect(props.onSubmit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'ยืนยันการลงทะเบียน' }));
    expect(props.onSubmit).toHaveBeenCalledOnce();
  });
  it('keeps loading or failed quotes disabled even if canSubmit was incorrectly supplied', () => {
    const { rerender } = render(<OrderSummary {...props} showSubmit quoteState={{ status: 'loading' }} />);
    expect(screen.getByRole('button', { name: /กำลังตรวจสอบราคา/ })).toBeDisabled();
    rerender(<OrderSummary {...props} showSubmit quoteState={{ status: 'error', error: new Error('Quote unavailable') }} />);
    expect(screen.getByRole('button', { name: /ตรวจสอบราคา/ })).toBeDisabled();
  });
  it('uses server totals instead of a local package-price fallback', () => {
    const paidState: CheckoutQuoteState = { status: 'ready', quote: {
      ...quoteState.quote, discountAmount: 0, discountType: null, discountValue: null,
      subtotal: 450, netAmount: 450, total: 450, promoValid: false,
    } };
    render(<OrderSummary {...props} promoApplied={false} showSubmit quoteState={paidState} />);
    expect(screen.getByRole('button', { name: 'ชำระเงิน ฿450.00' })).toBeEnabled();
  });
});
```

Add `beforeEach(() => vi.clearAllMocks())` to the test import/setup to isolate callback assertions.

- [ ] **Step 2: Verify RED**

```powershell
npx vitest run src/components/checkout/OrderSummary.test.tsx
```

Expected old component always renders the payment button and cannot use quote props.

- [ ] **Step 3: Replace local total computation and final action in OrderSummary**

Remove useMemo subtotal/netAmount calculation and its import. Keep item names and line prices, filtering selectedAddonItems by both selected group and currency to avoid including both THB/USD variants. Use these variables:

```ts
const quote = quoteState.status === 'ready' ? quoteState.quote : null;
const isFree = quote?.total === 0;
const isChecking = quoteState.status === 'loading';
const actionLabel = isSubmitting ? 'กำลังดำเนินการ...'
  : !quote ? (isChecking ? 'กำลังตรวจสอบราคา...' : 'กรุณาตรวจสอบราคา')
  : isFree ? 'ยืนยันการลงทะเบียน' : `ชำระเงิน ${formatPrice(quote.total)}`;
```

Replace the price breakdown block (keep its outer styling) with this actual-content JSX:

```tsx
{hasItems && (
  <div className="space-y-2 pt-2 border-t border-gray-100" aria-live="polite">
    {quote ? (
      <>
        <div className="flex justify-between text-sm text-gray-500">
          <span>ราคาตั๋วและบริการ</span><span>{formatPrice(quote.subtotal)}</span>
        </div>
        {quote.discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>ส่วนลด</span><span>-{formatPrice(quote.discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-lg font-bold text-[#8a8a00] pt-3 border-t border-[#8a8a00]/20">
          <span>ยอดชำระสุทธิ</span><span>{formatPrice(quote.total)}</span>
        </div>
      </>
    ) : (
      <p className="text-sm text-gray-500">
        {isChecking ? 'กำลังตรวจสอบราคา...' : 'กรุณาตรวจสอบรายการและราคาอีกครั้ง'}
      </p>
    )}
  </div>
)}
```

Replace the submit wrapper with:

```tsx
{showSubmit && (
  <div className="p-5 pt-0">
    <button type="button" onClick={onSubmit}
      disabled={!canSubmit || isSubmitting || !quote || !hasItems}
      className="w-full h-12 bg-[#8a8a00] hover:bg-[#456339] text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
      {(isSubmitting || isChecking) && <Loader2 className="w-5 h-5 animate-spin" />}
      {actionLabel}
    </button>
  </div>
)}
```

Keep the button at the existing right-summary position. No second final action is added to the left or a sticky mobile footer. Preserve existing responsive grid/sticky behavior.

- [ ] **Step 4: Synchronize promo busy state and errors**

Add props to PromoCodeSection, destructure with defaults, and compute:

```ts
const busy = isApplying || isChecking;
```

Update handleApply's early return to `if (!promoCode.trim() || busy || disabled) return;`. Disable the apply button on `!promoCode.trim() || busy || disabled`; show Loader2 when busy. Set input and remove button disabled only on `disabled` so a user can edit/remove while a quote is fetching and invalidate its identity. Render `error` after either applied/unapplied body; it must not disappear solely because a previously applied code is now invalid. Add aria-label `ลบโค้ดส่วนลด` to the remove icon button.

Pass from OrderSummary:

```tsx
isChecking={isChecking}
disabled={isSubmitting}
```

This is a local component extension; the only caller is OrderSummary. Do not trigger registration from promo apply.

- [ ] **Step 5: Wire restored promo identity and quote inputs in CheckoutPage**

Add useRef to the React import, import useCheckoutQuote, CheckoutFlow/FREE_CHECKOUT_DATA, and CheckoutPaymentData. Change wizard destructuring to use `getSteps` and `isRestored`; remove local promoDiscountAmount/promoDiscountText state and all their setters. Keep eligibility/session-specific invalidation logic.

Initialize requested promo after restoration with a state pair rather than trusting persisted discount values:

```ts
const promoIdentity = `${user?.id ?? ''}:${eventId}`;
const [requestedPromo, setRequestedPromo] = useState({ identity: '', code: '' });
useEffect(() => {
  if (!isRestored || requestedPromo.identity === promoIdentity) return;
  setRequestedPromo({
    identity: promoIdentity,
    code: (checkoutData.requestedPromoCode || (checkoutData.promoApplied ? checkoutData.promoCode : '')).trim().toUpperCase(),
  });
}, [isRestored, requestedPromo.identity, promoIdentity, checkoutData.requestedPromoCode, checkoutData.promoApplied, checkoutData.promoCode]);
```

Immediately after packageOptions/addonOptions are computed and before the existing selectionWasInvalidated recovery effect, construct the quote. This hook must be called unconditionally before loading/error returns. Move any earlier recovery effect referencing flow below its declaration to avoid a temporal-dead-zone error.

```ts
const selectionResolved = checkoutData.isAddonOnly
  ? checkoutData.selectedAddOns.length > 0
  : packageOptions.some((pkg) => pkg.id === checkoutData.selectedPackage);
const addonsResolved = checkoutData.selectedAddOns.every((group) => addonOptions.some((addon) => addon.groupName === group && addon.currency === currency));
const quoteEnabled = isLoggedIn && Boolean(user?.id) && isRestored
  && requestedPromo.identity === promoIdentity && selectionResolved && addonsResolved
  && !pricingLoading && !pricingError && Boolean(pricingEligibility) && studentEligibilityReady;
const { state: quoteState, retry: retryQuote } = useCheckoutQuote(quoteEnabled ? {
  accountId: String(user!.id),
  request: {
    eventId: Number(eventId), packageId: checkoutData.isAddonOnly ? '' : checkoutData.selectedPackage,
    addOnIds: checkoutData.selectedAddOns, currency,
    ...(requestedPromo.code ? { promoCode: requestedPromo.code } : {}),
  },
} : null);
const flow: CheckoutFlow = {
  quoteReady: quoteState.status === 'ready',
  isFree: quoteState.status === 'ready' && quoteState.quote.total === 0,
};
const steps = getSteps(flow);
```

Preserve currency filtering and personalized eligibility. Do not enable a quote for a selected ID absent from the current allowed package list. For add-on-only mode this still requires pricing context to finish; it does not remove existing primary-ownership checks in create-intent.

- [ ] **Step 6: Replace apply/remove handlers and reconcile confirmed amount changes**

```ts
const handleApplyPromo = useCallback(async () => {
  const code = checkoutData.promoCode.trim().toUpperCase();
  if (!code || isSubmitting) return;
  setPromoError(null);
  updateCheckoutData({ promoApplied: false, requestedPromoCode: code });
  if (requestedPromo.code === code) await retryQuote();
  else setRequestedPromo({ identity: promoIdentity, code });
}, [checkoutData.promoCode, isSubmitting, requestedPromo.code, retryQuote, updateCheckoutData, promoIdentity]);

const handleRemovePromo = useCallback(() => {
  setRequestedPromo({ identity: promoIdentity, code: '' });
  updateCheckoutData({ promoCode: '', promoApplied: false, requestedPromoCode: '' });
  setPromoError(null);
}, [promoIdentity, updateCheckoutData]);

const lastConfirmedFree = useRef<boolean | null>(null);
useEffect(() => {
  if (quoteState.status !== 'ready') return;
  const isFree = quoteState.quote.total === 0;
  if (isFree) {
    const hasTaxOrMethod = checkoutData.needTaxInvoice || checkoutData.paymentMethod !== null
      || Boolean(checkoutData.taxName || checkoutData.taxId || checkoutData.taxAddress || checkoutData.taxSubDistrict
        || checkoutData.taxDistrict || checkoutData.taxProvince || checkoutData.taxPostalCode);
    if (hasTaxOrMethod) updateCheckoutData(FREE_CHECKOUT_DATA);
    if (currentStep === 3) goToStep(4, { quoteReady: true, isFree: true });
  } else if (lastConfirmedFree.current === true) {
    updateCheckoutData(FREE_CHECKOUT_DATA);
    if (currentStep === 4) goToStep(3, { quoteReady: true, isFree: false });
  } else if (lastConfirmedFree.current === null && currentStep === 4 && checkoutData.paymentMethod === null) {
    // A restored final step without a method must review the paid tax choice.
    goToStep(3, { quoteReady: true, isFree: false });
  }
  lastConfirmedFree.current = isFree;
  if (requestedPromo.code && !checkoutData.promoApplied) updateCheckoutData({ promoApplied: true });
  setPromoError(null);
}, [quoteState, checkoutData, currentStep, requestedPromo.code, updateCheckoutData, goToStep]);
```

When account/event identity changes reset lastConfirmedFree.current to null in the restoration effect. The effect runs only for ready quotes; loading does not falsely constitute a free-to-paid change. Its guarded setters must not create a render/refetch loop.

On quote error, set promoApplied=false only if it was true, and display quoteState.error.message. Keep requestedPromo.code so the app cannot silently continue without the invalid code. For TICKET_NOT_ELIGIBLE reuse existing pricing/student refetch and package/session reset. Use this effect; do not perform network refetches on every render:

```ts
const lastHandledQuoteError = useRef<ApiError | null>(null);
useEffect(() => {
  if (quoteState.status !== 'error') { lastHandledQuoteError.current = null; return; }
  if (lastHandledQuoteError.current === quoteState.error) return;
  lastHandledQuoteError.current = quoteState.error;
  if (checkoutData.promoApplied) updateCheckoutData({ promoApplied: false });
  setPromoError(quoteState.error.message);
  if (quoteState.error.code === 'TICKET_NOT_ELIGIBLE') {
    void Promise.all([
      refetchPricing(),
      ...(requiresStudentEligibilityContext ? [refetchStudentEligibility()] : []),
    ]);
    updateCheckoutData({ selectedPackage: '', selectedOptionalSessions: [], promoCode: '', promoApplied: false, requestedPromoCode: '' });
    setRequestedPromo({ identity: promoIdentity, code: '' });
    goToStep(2, { quoteReady: false, isFree: false });
    setPromoError('อัตราค่าลงทะเบียนมีการเปลี่ยนแปลง กรุณาตรวจสอบแพ็กเกจอีกครั้ง');
  }
}, [quoteState, checkoutData.promoApplied, updateCheckoutData, refetchPricing,
  requiresStudentEligibilityContext, refetchStudentEligibility, promoIdentity, goToStep]);
```

All existing package-eligibility reset handlers must clear requestedPromo and requestedPromoCode as well as stored promo fields. Quote key changes automatically on package/Add-on/currency changes; typing a draft code clears requestedPromo, requestedPromoCode and promoApplied until the user presses Apply again. A failed explicitly requested code retains requestedPromoCode across reload; it is not silently dropped from the next preview.

- [ ] **Step 7: Wire exact UI changes and submit serialization**

Replace callbacks with `() => nextStep(flow)`, `() => prevStep(flow)`, and StepIndicator `onStepClick={(step) => goToStep(step, flow)}`. Replace all `isCurrentStepValid()` with `isCurrentStepValid(flow)`.

Tax rendering condition becomes `currentStep === 3 && !flow.isFree`. Replace final-step heading/payment card area with:

```tsx
<h3 className="text-lg font-bold text-gray-900">
  {flow.isFree ? 'ยืนยันการลงทะเบียน' : 'วิธีชำระเงิน'}
</h3>
{flow.isFree ? (
  <p className="text-sm text-gray-600">
    {currency === 'THB' ? 'ยอดสุทธิ 0 บาท ไม่ต้องชำระเงิน' : 'ยอดสุทธิ $0.00 ไม่ต้องชำระเงิน'}
  </p>
) : (
  <PaymentMethodCard paymentMethod={checkoutData.paymentMethod}
    onSelect={(method) => updateCheckoutData({ paymentMethod: method })} isThai={isThai} />
)}
```

While quote is unknown/failed keep the final action disabled; never show unknown amounts as 0. Insert this error/retry block above the checkout grid; retain final Back control. Profile prefill waits for isRestored (T5).

```tsx
{quoteState.status === 'error' && (
  <div role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
    <p>{quoteState.error.message}</p>
    <button type="button" onClick={() => { void retryQuote(); }} className="mt-3 rounded-lg border border-amber-300 px-4 py-2">
      ตรวจสอบราคาอีกครั้ง
    </button>
  </div>
)}
```

Replace handleSubmit with:

```ts
const submitStarted = useRef(false);
const handleSubmit = useCallback(async () => {
  if (currentStep !== 4 || quoteState.status !== 'ready'
    || !canProceedToPayment(flow) || isSubmitting || submitStarted.current) return;
  submitStarted.current = true;
  setIsSubmitting(true);
  try {
    const data: CheckoutPaymentData = {
      ...checkoutData, ...(flow.isFree ? FREE_CHECKOUT_DATA : {}),
      eventId, quotedTotal: quoteState.quote.total, currency,
      originApp, returnTo, websiteUrl: event?.websiteUrl || null,
    };
    sessionStorage.setItem('checkout-payment-data', JSON.stringify(data));
    router.push('/checkout/payment');
  } catch (error) {
    submitStarted.current = false;
    setIsSubmitting(false);
    alert(`เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : 'กรุณาลองใหม่อีกครั้ง'}`);
  }
}, [currentStep, quoteState, canProceedToPayment, flow, isSubmitting, checkoutData,
  eventId, currency, originApp, returnTo, event?.websiteUrl, router]);
```

Keep the loading flag through successful navigation rather than clearing it in finally. This prevents another click during route transition; it is not a new backend idempotency guarantee.

OrderSummary gets:

```tsx
quoteState={quoteState}
showSubmit={currentStep === 4}
canSubmit={currentStep === 4 && canProceedToPayment(flow)}
promoApplied={Boolean(requestedPromo.code) && quoteState.status === 'ready' && quoteState.quote.promoValid}
promoError={quoteState.status === 'error' ? quoteState.error.message : promoError}
```

Remove obsolete paymentMethod/promoDiscountAmount props. Derive promoDiscountText from ready quote.discountType/value, never from stale independent state. Clear code on draft input changes and normalize it only when applied. Preserve existing item labels and event context.

Use these exact draft/discount bindings in the page:

```ts
const promoDiscountText = quoteState.status === 'ready' && quoteState.quote.promoValid
  ? quoteState.quote.discountType === 'percentage'
    ? `ลด ${quoteState.quote.discountValue}%`
    : `ลด ${currency === 'USD' ? '$' : '฿'}${quoteState.quote.discountValue}`
  : null;
const handlePromoCodeChange = (code: string) => {
  setRequestedPromo({ identity: promoIdentity, code: '' });
  updateCheckoutData({ promoCode: code, promoApplied: false, requestedPromoCode: '' });
  setPromoError(null);
};
```

Pass onPromoCodeChange={handlePromoCodeChange}. Add requestedPromoCode:'' to each existing package-eligibility invalidation update. Never leave that persisted candidate behind after clearing a package for changed pricing eligibility.

- [ ] **Step 8: Add integrated page acceptance tests**

The test exercises the actual page + hook + summary, with external data mocked. Use this complete initial test; expand tests via the specified transitions below.

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CheckoutPage from './page';
import { paymentsApi } from '@/lib/api/payments';

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '2' }), useSearchParams: () => new URLSearchParams('originApp=pris2026&returnTo=https%3A%2F%2Fevent.example.test'),
  useRouter: () => navigation,
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({
  isLoggedIn: true, isLoading: false,
  user: { id: 1, role: 'public', country: 'TH', isThai: true,
    firstName: 'Test', lastName: 'User', email: 'test@example.test', phone: '0800000000' },
}) }));
vi.mock('@/components/layout/Navbar', () => ({ Navbar: () => null }));
vi.mock('@/components/layout/Footer', () => ({ Footer: () => null }));
vi.mock('@/components/checkout/EventBanner', () => ({ EventBanner: () => null }));
vi.mock('@/lib/services', () => ({ getEventById: async () => ({
  id: '2', code: 'TEST', name: 'Test Event', websiteUrl: 'https://event.example.test',
  startDate: '2026-10-29', endDate: '2026-10-30', location: 'Test Hall',
  ticketTypes: [{ id: 7, name: 'Main Ticket', groupName: 'Main', ticketCategory: 'primary',
    price: '500', currency: 'THB', quota: 100, soldCount: 0, isActive: true, allowedRoles: [] }],
}) }));
vi.mock('@/lib/api/pricingEligibility', () => ({ pricingEligibilityApi: { get: async () => ({
  eventId: 2, policyCode: null, applies: false, phase: 'not_applicable', qualifiedForExtension: false,
  effectivePriority: null, effectiveTicketTypeId: null, offerExpiresAt: null, reason: 'not_applicable',
}) } }));
let client: QueryClient;
beforeEach(() => {
  vi.clearAllMocks(); sessionStorage.clear();
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  vi.spyOn(paymentsApi, 'myPurchases').mockResolvedValue({ success: true, data: {
    hasPrimaryTicket: false, primaryTicketName: null, regCode: null, purchasedAddOns: [],
  } });
  vi.spyOn(paymentsApi, 'myTickets').mockResolvedValue({ success: true, data: [] });
});
afterEach(() => { client.clear(); vi.restoreAllMocks(); });

it('restores and revalidates a full discount before showing final confirmation', async () => {
  sessionStorage.setItem('checkout-wizard-2', JSON.stringify({ currentStep: 2, checkoutData: {
    selectedPackage: '7', promoCode: 'FREE100', promoApplied: true,
    needTaxInvoice: true, taxName: 'Old', taxId: '1234567890123', paymentMethod: 'card',
  } }));
  const preview = vi.spyOn(paymentsApi, 'preview').mockResolvedValue({
    success: true, subtotal: 500, discountAmount: 500, discountType: 'percentage', discountValue: 100,
    netAmount: 0, fee: 0, total: 0, currency: 'THB', feeMethod: null, promoValid: true, promoError: null,
  });
  render(<QueryClientProvider client={client}><CheckoutPage /></QueryClientProvider>);
  await waitFor(() => expect(preview).toHaveBeenCalledWith(expect.objectContaining({ promoCode: 'FREE100' })));
  expect(screen.queryByRole('button', { name: 'ยืนยันการลงทะเบียน' })).not.toBeInTheDocument();
  const next = await screen.findByRole('button', { name: 'ถัดไป' });
  await waitFor(() => expect(next).toBeEnabled());
  fireEvent.click(next);
  await screen.findByText('ยอดสุทธิ 0 บาท ไม่ต้องชำระเงิน');
  expect(screen.queryByText('ต้องการใบกำกับภาษี')).not.toBeInTheDocument();
  expect(screen.queryByText('QR PromptPay / Mobile Banking')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'ยืนยันการลงทะเบียน' }));
  expect(navigation.push).toHaveBeenCalledWith('/checkout/payment');
  const stored = JSON.parse(sessionStorage.getItem('checkout-payment-data')!);
  expect(stored.quotedTotal).toBe(0);
  expect(stored.paymentMethod).toBeNull();
  expect(stored.needTaxInvoice).toBe(false);
  expect(stored.originApp).toBe('pris2026');
  expect(stored.returnTo).toBe('https://event.example.test');
});
```

Append these page transition tests (add act to the Testing Library import):

```tsx
it('restores tax review after removing a full discount at the final step', async () => {
  sessionStorage.setItem('checkout-wizard-2', JSON.stringify({ currentStep: 4, checkoutData: {
    selectedPackage: '7', promoCode: 'FREE100', promoApplied: true, needTaxInvoice: true, paymentMethod: 'card',
  } }));
  vi.spyOn(paymentsApi, 'preview').mockImplementation(async (request) => ({
    success: true, subtotal: 500, discountAmount: request.promoCode ? 500 : 0,
    discountType: request.promoCode ? 'percentage' : null, discountValue: request.promoCode ? 100 : null,
    netAmount: request.promoCode ? 0 : 500, fee: 0, total: request.promoCode ? 0 : 500,
    currency: 'THB', feeMethod: null, promoValid: Boolean(request.promoCode), promoError: null,
  }));
  render(<QueryClientProvider client={client}><CheckoutPage /></QueryClientProvider>);
  await screen.findByText('ยอดสุทธิ 0 บาท ไม่ต้องชำระเงิน');
  fireEvent.click(screen.getByRole('button', { name: 'ลบโค้ดส่วนลด' }));
  const taxChoice = await screen.findByRole('checkbox', { name: /ต้องการใบกำกับภาษี/ });
  expect(taxChoice).not.toBeChecked();
  expect(screen.queryByRole('button', { name: 'ยืนยันการลงทะเบียน' })).not.toBeInTheDocument();
  expect(navigation.push).not.toHaveBeenCalled();
});

it('blocks navigation during pricing and offers recovery on quote failure', async () => {
  sessionStorage.setItem('checkout-wizard-2', JSON.stringify({ currentStep: 2, checkoutData: { selectedPackage: '7' } }));
  let rejectPreview!: (error: Error) => void;
  const pending = new Promise<never>((_resolve, reject) => { rejectPreview = reject; });
  const preview = vi.spyOn(paymentsApi, 'preview').mockReturnValue(pending);
  render(<QueryClientProvider client={client}><CheckoutPage /></QueryClientProvider>);
  await waitFor(() => expect(preview).toHaveBeenCalled());
  expect(screen.getByRole('button', { name: 'ถัดไป' })).toBeDisabled();
  expect(screen.queryByRole('button', { name: /ชำระเงิน|ยืนยันการลงทะเบียน/ })).not.toBeInTheDocument();
  await act(async () => rejectPreview(new Error('Pricing unavailable')));
  await screen.findByRole('button', { name: 'ตรวจสอบราคาอีกครั้ง' });
  expect(navigation.push).not.toHaveBeenCalled();
});
```

- [ ] **Step 9: Verify focused tests, caller consistency, lint, and commit T5/T6 together**

```powershell
npx vitest run src/hooks/checkout/useCheckoutQuote.test.tsx src/hooks/checkout/useCheckoutWizard.test.tsx src/components/checkout/StepIndicator.test.tsx src/components/checkout/OrderSummary.test.tsx 'src/app/checkout/[id]/page.test.tsx'
npx tsc --noEmit --incremental false
npx eslint 'src/app/checkout/[id]/page.tsx' src/hooks/checkout/useCheckoutWizard.ts src/hooks/checkout/useCheckoutQuote.ts src/components/checkout/OrderSummary.tsx src/components/checkout/StepIndicator.tsx src/components/checkout/PromoCodeSection.tsx
git add -- src/hooks/checkout/useCheckoutWizard.ts src/hooks/checkout/useCheckoutWizard.test.tsx src/components/checkout/StepIndicator.tsx src/components/checkout/StepIndicator.test.tsx src/components/checkout/OrderSummary.tsx src/components/checkout/OrderSummary.test.tsx src/components/checkout/PromoCodeSection.tsx 'src/app/checkout/[id]/page.tsx' 'src/app/checkout/[id]/page.test.tsx'
git commit -m "feat(checkout): confirm zero-total registrations at the final step"
```

Inspect React effect dependencies and query count. A ready quote writing promoApplied/tax fields must not trigger a new query because those fields are outside the pricing identity.

## Task 7: Process free requests, recover quote conflicts, and preserve result context

**Files:**
- Modify: `D:/confer/confer/conference/conference-web/src/app/checkout/payment/page.tsx`
- Create: `D:/confer/confer/conference/conference-web/src/app/checkout/payment/page.test.tsx`
- Modify: `D:/confer/confer/conference/conference-web/src/app/checkout/payment/result/page.tsx`
- Create: `D:/confer/confer/conference/conference-web/src/app/checkout/payment/result/page.test.tsx`
- Modify: `D:/confer/confer/conference/conference-web/src/lib/paymentSession.ts`
- Modify: `D:/confer/confer/conference/conference-web/src/lib/paymentSession.test.ts`
- Modify: `D:/confer/confer/conference/conference-web/src/lib/checkout/paymentRequest.ts` (local stale-data error code)
- Modify: `D:/confer/confer/conference/conference-web/src/app/checkout/[id]/page.tsx` (recovery explanation)

**Interfaces:**
- PaymentPage consumes CheckoutPaymentData and buildCreateIntentRequest from T3; remove the duplicate private CheckoutPaymentData interface.
- Produce `resolveFreeResultCurrency(urlCurrency: string | null, storedCurrency?: string | null): 'THB' | 'USD'`.
- Price conflicts offer a checkout review action; no automatic retry/re-registration/gateway transition is added.
- Preserve existing hasStartedIntent/hasSubmitted refs, provider auto-form submission, and free result branch.

- [ ] **Step 1: Add request/processing/error tests before changing PaymentPage**

Create payment/page.test.tsx:

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import PaymentPage from './page';
import { paymentsApi } from '@/lib/api/payments';
import type { CheckoutPaymentData } from '@/lib/checkout/paymentRequest';

const router = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ isLoggedIn: true, isLoading: false }) }));
vi.mock('@/components/layout/Navbar', () => ({ Navbar: () => null }));
vi.mock('@/components/layout/Footer', () => ({ Footer: () => null }));

const data: CheckoutPaymentData = {
  eventId: '2', quotedTotal: 0, currency: 'USD',
  originApp: 'pris2026', returnTo: 'https://event.example.test', websiteUrl: 'https://event.example.test',
  firstName: 'Test', lastName: 'User', email: 'test@example.test', phone: '0800000000', country: 'US',
  selectedPackage: '7', selectedAddOns: [], selectedWorkshopTopic: undefined,
  selectedOptionalSessions: [], ownedSessionIds: [], isAddonOnly: false, purchasedAddOns: [],
  dietaryRequirement: '', dietaryOtherText: '', paymentMethod: null, promoCode: 'FREE100', promoApplied: true,
  needTaxInvoice: false, taxName: '', taxId: '', taxAddress: '', taxSubDistrict: '', taxDistrict: '', taxProvince: '', taxPostalCode: '',
};
beforeEach(() => {
  vi.clearAllMocks(); sessionStorage.clear();
  sessionStorage.setItem('checkout-payment-data', JSON.stringify(data));
  sessionStorage.setItem('checkout-wizard-2', JSON.stringify({ currentStep: 4, checkoutData: data }));
});
afterEach(() => vi.restoreAllMocks());

it('submits a free request once and keeps the currency and external return context', async () => {
  sessionStorage.setItem('payment-gateway', 'paysolutions');
  sessionStorage.setItem('payment-refno', 'OLD-REF');
  const create = vi.spyOn(paymentsApi, 'createIntent').mockResolvedValue({
    success: true, free: true, gateway: null, redirectForm: null, refno: null, orderRef: null,
    orderNumber: 'CONF-FREE', regCode: 'REG-FREE', totalAmount: '0', currency: 'USD',
  });
  render(<PaymentPage />);
  await waitFor(() => expect(router.push).toHaveBeenCalledOnce());
  expect(create).toHaveBeenCalledOnce();
  expect(create.mock.calls[0][0]).not.toHaveProperty('paymentMethod');
  expect(create.mock.calls[0][0].needTaxInvoice).toBe(false);
  const resultUrl = new URL(router.push.mock.calls[0][0], 'https://web.example.test');
  expect(resultUrl.searchParams.get('currency')).toBe('USD');
  expect(resultUrl.searchParams.get('originApp')).toBe('pris2026');
  expect(resultUrl.searchParams.get('returnTo')).toBe(data.returnTo);
  expect(sessionStorage.getItem('payment-refno')).toBeNull();
  expect(sessionStorage.getItem('checkout-payment-data')).not.toBeNull();
});

it('offers review rather than retrying a price conflict without a chosen method', async () => {
  const create = vi.spyOn(paymentsApi, 'createIntent').mockRejectedValue(Object.assign(new Error('Total changed'), {
    code: 'PAYMENT_METHOD_REQUIRED', status: 409,
  }));
  render(<PaymentPage />);
  fireEvent.click(await screen.findByRole('button', { name: 'กลับไปตรวจสอบราคา' }));
  expect(create).toHaveBeenCalledOnce();
  expect(screen.queryByRole('button', { name: 'ลองใหม่' })).not.toBeInTheDocument();
  const path = new URL(router.push.mock.calls[0][0], 'https://web.example.test');
  expect(path.pathname).toBe('/checkout/2');
  expect(path.searchParams.get('checkoutError')).toBe('PAYMENT_METHOD_REQUIRED');
  expect(path.searchParams.get('originApp')).toBe('pris2026');
  const wizard = JSON.parse(sessionStorage.getItem('checkout-wizard-2')!);
  expect(wizard.currentStep).toBe(2);
  expect(wizard.checkoutData.paymentMethod).toBeNull();
  expect(wizard.checkoutData.promoCode).toBe('FREE100');
});

it('does not submit legacy stored data that has no authoritative quote', async () => {
  const legacy = { ...data } as Partial<CheckoutPaymentData>;
  delete legacy.quotedTotal;
  sessionStorage.setItem('checkout-payment-data', JSON.stringify(legacy));
  const create = vi.spyOn(paymentsApi, 'createIntent');
  render(<PaymentPage />);
  await screen.findByRole('button', { name: 'กลับไปตรวจสอบราคา' });
  expect(create).not.toHaveBeenCalled();
});
```

Append these processing and paid-form tests (add act to the Testing Library import). No test opens a real gateway:

```tsx
it('shows confirmation processing while a free intent is pending', async () => {
  let resolveIntent!: (value: Awaited<ReturnType<typeof paymentsApi.createIntent>>) => void;
  vi.spyOn(paymentsApi, 'createIntent').mockImplementation(() => new Promise((resolve) => { resolveIntent = resolve; }));
  render(<PaymentPage />);
  await screen.findByText('กำลังยืนยันการลงทะเบียน');
  expect(screen.queryByText('ระบบกำลังเชื่อมต่อกับ payment gateway...')).not.toBeInTheDocument();
  await act(async () => resolveIntent({
    success: true, free: true, gateway: null, redirectForm: null, refno: null, orderRef: null,
    regCode: 'REG-FREE', orderNumber: 'CONF-FREE', totalAmount: '0', currency: 'USD',
  }));
});

it('preserves explicit paid card selection and submits the provider form once', async () => {
  sessionStorage.setItem('checkout-payment-data', JSON.stringify({ ...data, quotedTotal: 500, paymentMethod: 'card', promoApplied: false }));
  const create = vi.spyOn(paymentsApi, 'createIntent').mockResolvedValue({
    success: true, free: false, gateway: 'paysolutions', refno: 'TEST-REF', orderRef: null,
    orderNumber: 'CONF-PAID', regCode: null, totalAmount: '500', currency: 'USD',
    redirectForm: { actionUrl: 'https://gateway.example.test/payment', fields: { refno: 'TEST-REF' } },
  });
  const submit = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => undefined);
  const { container } = render(<PaymentPage />);
  await waitFor(() => expect(submit).toHaveBeenCalledOnce());
  expect(create.mock.calls[0][0].paymentMethod).toBe('card');
  expect(container.querySelector('form')?.getAttribute('action')).toBe('https://gateway.example.test/payment');
  expect(router.push).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Verify RED**

```powershell
npx vitest run src/app/checkout/payment/page.test.tsx
```

Expected: existing page forwards null method and does not add currency or recover missing method/stale quote.

- [ ] **Step 3: Replace request construction and classify stale stored quotes**

Use the T3 builder rather than the old handwritten requestBody/workshop/optional mapping. Keep parsedEventId checks only if still used; remove redundant copies after the builder takes responsibility.

In paymentRequest.ts change the invalid quotedTotal throw to:

```ts
throw Object.assign(new Error('Checkout quote must be refreshed'), { code: 'CHECKOUT_DATA_STALE' });
```

Include `code === 'CHECKOUT_DATA_STALE'` in isCheckoutRecoveryError. In PaymentPage's createPaymentIntent after reading/JSON-parsing saved data:

```ts
setIsFreeProcessing(data.quotedTotal === 0);
const requestBody = buildCreateIntentRequest(data);
setStatus('submitting');
const result = await paymentsApi.createIntent(requestBody);
```

Add `const [isFreeProcessing, setIsFreeProcessing] = useState(false);`. Replace processing heading/body:

```tsx
<h2 className="text-xl font-bold text-gray-800">
  {isFreeProcessing ? 'กำลังยืนยันการลงทะเบียน' : 'กำลังนำคุณไปยังหน้าชำระเงิน'}
</h2>
<p className="text-gray-500 text-sm">
  {isFreeProcessing ? 'ระบบกำลังตรวจสอบสิทธิ์และบันทึกการลงทะเบียน...' : 'ระบบกำลังเชื่อมต่อกับ payment gateway...'}
</p>
```

When no saved data exists or JSON is malformed, keep an explicit start-over action; do not invent totals/methods. An older page opened after deployment with missing quotedTotal offers review, not silent card fallback.

- [ ] **Step 4: Add conflict recovery action that resets the actual wizard store**

Keep existing TICKET_NOT_ELIGIBLE and STUDENT_ELIGIBILITY_REQUIRED branches. For other recovery errors map to a Thai explanation and set errorCode. Example branch after existing eligibility checks:

```ts
} else if (isCheckoutRecoveryError(apiError.code)) {
  setErrorCode(apiError.code || null);
  setErrorMessage('ราคา ส่วนลด หรือสิทธิ์ของรายการมีการเปลี่ยนแปลง กรุณากลับไปตรวจสอบรายการและราคาอีกครั้ง');
} else {
  const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสร้างรายการชำระเงิน';
  setErrorCode(apiError.code || null);
  setErrorMessage(msg);
}
```

Use this complete handler for the review button; it must update checkout-wizard storage, not just checkout-payment-data:

```ts
const returnToCheckout = () => {
  try {
    const saved = sessionStorage.getItem('checkout-payment-data');
    const data = saved ? JSON.parse(saved) as CheckoutPaymentData : null;
    if (!data?.eventId) { router.push('/events'); return; }
    const key = `checkout-wizard-${data.eventId}`;
    const wizardRaw = sessionStorage.getItem(key);
    const wizard = wizardRaw ? JSON.parse(wizardRaw) : { checkoutData: data };
    const invalidatePackage = errorCode === 'TICKET_NOT_ELIGIBLE';
    sessionStorage.setItem(key, JSON.stringify({
      checkoutData: {
        ...wizard.checkoutData,
        paymentMethod: null,
        ...(invalidatePackage ? { selectedPackage: '', selectedOptionalSessions: [], promoCode: '', promoApplied: false, requestedPromoCode: '' } : {}),
      },
      currentStep: 2,
    }));
    const params = new URLSearchParams();
    if (data.originApp) params.set('originApp', data.originApp);
    if (data.returnTo) params.set('returnTo', data.returnTo);
    if (errorCode) params.set('checkoutError', errorCode);
    router.push(`/checkout/${data.eventId}?${params.toString()}`);
  } catch {
    router.push('/events');
  }
};
```

Render `กลับไปตรวจสอบราคา` for `TICKET_NOT_ELIGIBLE` or isCheckoutRecoveryError(errorCode). Hide generic `ลองใหม่` for those errors. Keep the Profile action for STUDENT_ELIGIBILITY_REQUIRED. Replace the old TICKET_NOT_ELIGIBLE review handler with returnToCheckout to prevent stale wizard package restoration.

In CheckoutPage display a static mapped explanation when `checkoutError` is one of recognized recovery codes or TICKET_NOT_ELIGIBLE. Example:

```tsx
{isCheckoutRecoveryError(searchParams.get('checkoutError') || undefined) && (
  <div role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
    รายการมีการเปลี่ยนแปลง กรุณาตรวจสอบราคาและส่วนลดอีกครั้งก่อนดำเนินการ
  </div>
)}
```

Do not render arbitrary raw query text as an error. A recovered invalid code remains requested and blocks submission until successfully revalidated or explicitly removed. Network/unknown failures are not proof that registration failed: preserve current generic error behavior, avoid automatic retry, and retain existing server duplicate checks. General idempotency keys or outcome-lookup redesign are out of scope.

- [ ] **Step 5: Preserve free currency before clearing session**

In PaymentPage's existing free result URLSearchParams add:

```ts
currency: result.currency || data.currency,
```

Add to paymentSession.ts:

```ts
export function resolveFreeResultCurrency(urlCurrency: string | null, storedCurrency?: string | null): 'THB' | 'USD' {
  if (urlCurrency === 'THB' || urlCurrency === 'USD') return urlCurrency;
  if (storedCurrency === 'THB' || storedCurrency === 'USD') return storedCurrency;
  return 'THB';
}
```

Import the helper in the result page. Extend readCheckoutRedirectContext's declared/default return objects and parsed type with `currency: string | null`; return only validated THB/USD values. Capture `currency: stored.currency` in the existing lazy redirectContext initialization. Replace free result's hardcoded `setCurrency('THB')`:

```ts
setCurrency(resolveFreeResultCurrency(searchParams.get('currency'), redirectContext.currency));
```

Include redirectContext.currency in effect dependencies. Do not re-read sessionStorage after clearPaymentSession to determine currency/return context. Keep orderNumber/regCode result handling and current SSO countdown/return status parameter unchanged. Old free links with neither currency nor storage retain the prior THB fallback; this limitation is documented, not inferred as USD.

- [ ] **Step 6: Add currency/result tests**

Append to paymentSession.test.ts (import resolveFreeResultCurrency):

```ts
it('resolves only supported free-result currencies before storage cleanup', () => {
  expect(resolveFreeResultCurrency('USD', 'THB')).toBe('USD');
  expect(resolveFreeResultCurrency(null, 'USD')).toBe('USD');
  expect(resolveFreeResultCurrency('INVALID', 'USD')).toBe('USD');
  expect(resolveFreeResultCurrency('THB', 'USD')).toBe('THB');
  expect(resolveFreeResultCurrency(null, null)).toBe('THB');
});
```

Create payment/result/page.test.tsx:

```tsx
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import PaymentResultPage from './page';
import { paymentsApi } from '@/lib/api/payments';

const context = vi.hoisted(() => ({ params: 'free=1&orderNumber=CONF-FREE&regCode=REG-FREE&currency=USD', push: vi.fn() }));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(context.params), useRouter: () => ({ push: context.push }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ isLoggedIn: true, isLoading: false }) }));
vi.mock('@/components/layout/Navbar', () => ({ Navbar: () => null }));
vi.mock('@/components/layout/Footer', () => ({ Footer: () => null }));
vi.mock('@/components/ticket/QRCodeTicket', () => ({ QRCodeTicket: ({ regCode }: { regCode: string }) => <div>{regCode}</div> }));
beforeEach(() => { sessionStorage.clear(); vi.clearAllMocks(); });
afterEach(() => vi.restoreAllMocks());

it('shows USD zero after cleaning the payment session without provider polling', async () => {
  sessionStorage.setItem('checkout-payment-data', JSON.stringify({ currency: 'USD', websiteUrl: 'https://event.example.test' }));
  sessionStorage.setItem('payment-event-id', '2');
  const verify = vi.spyOn(paymentsApi, 'verify');
  render(<PaymentResultPage />);
  expect(await screen.findByText('$0.00')).toBeInTheDocument();
  expect(screen.getByText('REG-FREE')).toBeInTheDocument();
  expect(verify).not.toHaveBeenCalled();
  expect(sessionStorage.getItem('checkout-payment-data')).toBeNull();
});

it('uses stored USD for a legacy free URL without a currency parameter', async () => {
  context.params = 'free=1&orderNumber=CONF-FREE&regCode=REG-FREE';
  sessionStorage.setItem('checkout-payment-data', JSON.stringify({ currency: 'USD' }));
  render(<PaymentResultPage />);
  expect(await screen.findByText('$0.00')).toBeInTheDocument();
});
```

Reset context.params to its initial USD string in beforeEach. Append these THB/event-return tests; no test triggers window.location.assign:

```tsx
it('shows THB zero for an explicit THB free result', async () => {
  context.params = 'free=1&orderNumber=CONF-FREE&regCode=REG-FREE&currency=THB';
  render(<PaymentResultPage />);
  expect(await screen.findByText('฿0.00')).toBeInTheDocument();
});

it('captures the event website before clearing stored redirect context', async () => {
  sessionStorage.setItem('checkout-payment-data', JSON.stringify({
    currency: 'USD', websiteUrl: 'https://event.example.test', returnTo: 'https://fallback.example.test',
  }));
  render(<PaymentResultPage />);
  await screen.findByText('$0.00');
  const eventLink = screen.getByRole('link', { name: 'กลับไปหน้าเว็บไซต์' });
  expect(eventLink.getAttribute('href')).toBe('https://event.example.test');
  expect(sessionStorage.getItem('checkout-payment-data')).toBeNull();
});
```

For SSO countdown coverage add this test, which unmounts before its 10-second automatic navigation:

```tsx
it('keeps the existing SSO countdown after capturing and clearing context', async () => {
  sessionStorage.setItem('checkout-payment-data', JSON.stringify({
    currency: 'USD', originApp: 'pris2026', websiteUrl: 'https://event.example.test',
  }));
  const { unmount } = render(<PaymentResultPage />);
  await screen.findByText('$0.00');
  expect(screen.getByText(/กลับไปหน้าเว็บไซต์อัตโนมัติใน/)).toBeInTheDocument();
  expect(sessionStorage.getItem('checkout-payment-data')).toBeNull();
  unmount();
});
```

The staging SSO smoke case in T8 verifies the actual return URL parameters/navigation. Unit tests preserve the current countdown behavior and never contact the source website.

- [ ] **Step 7: Verify GREEN, build, and commit**

```powershell
npx vitest run src/lib/checkout/paymentRequest.test.ts src/lib/paymentSession.test.ts src/app/checkout/payment/page.test.tsx src/app/checkout/payment/result/page.test.tsx
npx tsc --noEmit --incremental false
npx eslint src/app/checkout/payment/page.tsx src/app/checkout/payment/result/page.tsx src/lib/paymentSession.ts src/lib/checkout/paymentRequest.ts 'src/app/checkout/[id]/page.tsx'
npm run build
git add -- src/app/checkout/payment/page.tsx src/app/checkout/payment/page.test.tsx src/app/checkout/payment/result/page.tsx src/app/checkout/payment/result/page.test.tsx src/lib/paymentSession.ts src/lib/paymentSession.test.ts src/lib/checkout/paymentRequest.ts 'src/app/checkout/[id]/page.tsx'
git commit -m "fix(checkout): recover changed totals and preserve free result context"
```

## Task 8: Document API consumers, run focused regression, and prepare release

**Files:**
- Create: `D:/confer/confer/conference/conference-api/docs/api/checkout-zero-total-contract.md`
- Update completion/evidence only: `D:/confer/confer/conference/conference-web/docs/superpowers/plans/2026-10-14-checkout-zero-total-confirmation.md`

**Interfaces:**
- Publish contract examples and deployment evidence to repository docs; no external message or live deployment is implied.
- Record API SHA, web SHA, test commands/results, isolated DB gate, and staging outcomes. Never record secret connection strings.

- [ ] **Step 1: Write consumer contract documentation**

The new API markdown document must contain this contract text and JSON examples:

```markdown
# Checkout payment-method contract

POST /api/payments/preview is advisory and read-only. It does not reserve
promo usage or ticket/session capacity. Every selected add-on must resolve
within the event/currency; incomplete selections return an error.

POST /api/payments/create-intent recalculates the amount from server data.
paymentMethod accepts qr or card. It can be omitted for a zero-total order.
null and free are invalid method values. There is no implicit card default.

Zero-total success uses the existing success/data envelope with free=true,
gateway=null, redirectForm=null, total=0, currency, orderNumber and regCode.
The internal payment channel is free. No bank or card payment is requested.
Tax-invoice requests are suppressed on successful zero-total orders.

When the final amount is positive but method is absent, HTTP 409 returns:
{"success":false,"code":"PAYMENT_METHOD_REQUIRED","error":"Checkout total requires payment; refresh pricing and choose a payment method"}
The client must refresh the quote and collect an explicit method. This
conflict is returned before paid-order writes or gateway preparation.

This is a contract tightening for positive-total clients that previously
omitted the method and relied on default card. Send card explicitly to
preserve that behavior. Clients already sending qr/card remain compatible.
Endpoint paths and response envelopes do not change.

Free request:
{"eventId":2,"packageId":"7","addOnIds":[],"currency":"THB","promoCode":"FREE100","needTaxInvoice":false}

Paid request:
{"eventId":2,"packageId":"7","addOnIds":[],"currency":"THB","paymentMethod":"qr","needTaxInvoice":false}

Do not send a client-computed amount as authority. Do not silently remove
an invalid promo and start paid checkout. Handle INVALID_PROMO,
FREE_TOTAL_CHANGED, PROMO_CHECKOUT_CHANGED, promo usage conflicts and
PAYMENT_METHOD_REQUIRED by showing the current quote for review.
Unknown transport failures may occur after commit; they are not proof
that registration failed. Existing registration/duplicate checks remain.
```

Use fenced JSON blocks when writing the document for readability. No new runtime OpenAPI generator is required; if the API already publishes a relevant payment schema elsewhere, update that consumer description alongside this document rather than duplicating incompatible definitions.

- [ ] **Step 2: Inventory every method-dependent caller**

From workspace root:

```powershell
rg -n 'create-intent|/payments/preview|createPaymentIntentSchema|paymentsApi.createIntent|paymentsApi.preview|CreateIntentRequest|PreviewRequest' conference-web/src conference-api/src Pris2026 PSATHealthHack sponsor --glob '!package-lock.json' --glob '!node_modules/**' --glob '!dist/**'
```

Expected repository callers are web checkout preview/payment, API route schema, and tests. Confirm with current output. Check external consumer inventory/deployment logs through the existing release process; do not infer absence of external consumers solely from rg. No tool sends a message to a consumer or operator unless the user separately authorizes it.

- [ ] **Step 3: Run the web acceptance suite once changes stabilize**

Working directory Web:

```powershell
npx vitest run src/lib/api/payments.test.ts src/lib/paymentSession.test.ts src/lib/checkout/paymentRequest.test.ts src/lib/checkout/prisPricing.test.ts src/hooks/checkout/useCheckoutQuote.test.tsx src/hooks/checkout/useCheckoutWizard.test.tsx src/components/checkout/OrderSummary.test.tsx src/components/checkout/StepIndicator.test.tsx 'src/app/checkout/[id]/page.test.tsx' src/app/checkout/payment/page.test.tsx src/app/checkout/payment/result/page.test.tsx
npx tsc --noEmit --incremental false
npx eslint 'src/app/checkout/[id]/page.tsx' src/app/checkout/payment/page.tsx src/app/checkout/payment/result/page.tsx src/hooks/checkout/useCheckoutWizard.ts src/hooks/checkout/useCheckoutQuote.ts src/components/checkout/OrderSummary.tsx src/components/checkout/StepIndicator.tsx src/components/checkout/PromoCodeSection.tsx src/lib/api/payments.ts src/lib/checkout/paymentRequest.ts src/lib/paymentSession.ts
npm run build
```

Vitest literal bracket paths are quoted in PowerShell; file edits/reads use LiteralPath when needed. Do not treat an empty test selection as a pass. Broaden to the repository suite only if a failure/new dependency warrants it; do not add screenshot-pixel tests for a single button visibility change.

- [ ] **Step 4: Run API regression and isolated integrations**

Working directory API:

```powershell
npx tsx --test src/schemas/payment.schema.test.ts src/modules/payments/api-contract.test.ts src/utils/promoDiscount.test.ts src/services/emailTemplates.test.ts src/services/receiptPdf.test.ts
npm run test:payments
npm run build
npm run test:payments:integration
npm run test:checkout-flow:integration
```

The first three commands are local gates. The last two require the isolated migrated target checked by test-database.ts. Generic npm test may skip integration suites; record skipped versus executed explicitly. Existing promo migration 0030 remains an existing deployment prerequisite if absent, but this feature introduces no new migration. Do not reuse historical migration notes as evidence of today's target state.

- [ ] **Step 5: Perform browser smoke checks on local/staging build**

Start the existing dev servers using repository scripts only after implementation authorization. Use sandbox/staging accounts and campaign codes, not real production registrations. Check at desktop and mobile viewport sizes:

| Case | Expected visible behavior | Expected API/database behavior |
|---|---|---|
| Step 1 and package step | summary present, no final-action button | no create-intent |
| Paid THB QR/card | tax step present; method required; one final action | explicit method, existing redirect payload |
| Paid USD | card selection; USD amount | existing USD provider channel |
| 100% promo | step 3 hidden; final confirmation; no method | internal/free/0; registration confirmed |
| Fixed discount equals/exceeds subtotal | same free UI | free success, capped discount |
| 100% promo capped below subtotal | paid flow | missing method rejected before order |
| Intrinsically free ticket | no promo required; free confirmation | server total 0 without method |
| Add-on-only zero total | retain existing primary registration | exactly one linked entitlement |
| Remove code at final step | returns to tax choice after fresh positive quote | no auto card/payment call |
| Change package/Add-on after apply | quote revalidates; action blocked meanwhile | current cart rules checked |
| Reload with applied code | code revalidated; unknown quote cannot confirm | no stale discount trust |
| Rapid edits / delayed responses | current quote wins | no submission from previous quote |
| Promo expired/user limit reached at submit | review explanation and fresh checkout | no silent code removal |
| Server changes free to paid | review required | 409 missing method; no paid side effect |
| Free USD result | $0.00 after session cleanup | no provider polling |
| Event/SSO return | existing link/countdown preserved | existing registered/regCode return params |
| Free tax data from restored state | hidden and cleared | need_tax_invoice=false, tax columns null |

Existing API free settlement tests cover promo concurrency/rollback; no claim is made that browser smoke alone proves concurrency. Inspect receipt/PDF labels with existing test outputs and one controlled staging free transaction.

- [ ] **Step 6: Roll out in compatible order**

1. Verify positive-total consumers explicitly send qr/card. Update any consumer still depending on implicit card before removing the API default.
2. Run API contract and isolated DB gates, then deploy API to staging. An old web build remains compatible because it sends explicit methods for normal payments.
3. Deploy the web build to staging and exercise the matrix. The new web must not be released ahead of the new API: the old API could default a missing free-method request to card when the amount changes.
4. Verify existing target migrations/constraints through normal deployment checks; do not apply a new schema migration for this feature.
5. Release API first and web second using the project's normal release authorization. Monitor missing-method/promo-conflict errors and registration outcomes. No cron, queue, or new monitoring integration is introduced.
6. Only count a release as verified after both deployed SHAs and smoke results are recorded. This planning request does not authorize steps 2-5 to run now.

- [ ] **Step 7: Rollback procedure**

- If new web has an issue, restore the previous web build while retaining the new API. Old explicit-method checkout remains compatible.
- Before rolling API back, restore the previous web build first. Do not leave new method-free clients on the API with implicit card behavior.
- Successful free orders, registrations, promo usage and coupons are valid committed data. Do not delete/reverse them as a software rollback.
- There is no new migration to reverse. Any existing migration prerequisite is outside this feature rollback.

- [ ] **Step 8: Commit docs/evidence after actual verification**

Working directory API:

```powershell
git add -- docs/api/checkout-zero-total-contract.md
git commit -m "docs(api): describe zero-total payment method contract"
```

Working directory Web, only after checking off steps that actually ran:

```powershell
git add -- docs/superpowers/plans/2026-10-14-checkout-zero-total-confirmation.md
git commit -m "docs: record checkout verification and release evidence"
```

## Acceptance-to-task coverage

| Approved requirement / risk | Implementation | Proof |
|---|---|---|
| Right-summary final-only action | T6 | OrderSummary tests + page smoke |
| Existing final logical step becomes confirmation | T5/T6 | wizard/indicator/page tests |
| Exact free button copy | T6 | query by button accessible name |
| Hide/skip tax and clear request fields | T1/T3/T5/T6 | payload tests + stored DB tax assertion |
| Any server-confirmed zero total | T1/T4 | percentage/fixed/free-ticket HTTP matrix |
| All events/add-on-only/THB/USD | T2/T3/T6/T7 | generic fixture event, entitlement SQL, currency tests |
| Promo remains in summary from selection | T6 | earlier-step page with promo input/chip and no submit |
| Frontend + API change | T1-T7 | type, schema, HTTP, browser gates |
| Old quote/result race | T4/T6 | controlled deferred previews |
| Refresh and storage recovery | T3/T5/T7 | restoration/stale-storage/request tests |
| No silent paid fallback | T1/T7 | counts unchanged + no automatic retry |
| SSO/event return context | T6/T7 | stored data and result URL/link assertions |
| Existing free atomicity/promo limits | reuse T2/T8 | existing isolated integration suite |
| External consumer compatibility | T8 | inventory and ordered rollout |
| Booth coupon rules unchanged | no policy edit | existing booth/free regression; fixed free not reclassified |

## Plan self-review and stop condition

- Scope: one checkout product slice spans the existing web/API boundary; tasks have explicit file ownership and do not redesign payments.
- Contract: omission versus null, 400 versus 409, server authority, free provider semantics, and the behavioral compatibility break are explicit.
- State: quote readiness blocks navigation/submission, promo candidate remains separate from validated application, unknown is not zero, and tax restoration is specified.
- Reload audit: a failed explicitly requested promo persists separately from promoApplied; reloading does not silently discard it. A restored final step with a positive quote and no chosen method returns to tax review.
- Security/side effects: existing authentication/authorization/session checks remain; preview is read-only; missing-method guard precedes paid writes; free settlement remains atomic.
- Interfaces: CheckoutFlow, CheckoutQuoteState/Input, CheckoutPaymentData, buildCreateIntentRequest, recovery classifier, and currency resolver are defined before use; producers/consumers are named.
- Verification: RED/GREEN steps distinguish unit, HTTP integration, and deployed smoke evidence. Current tests are not reported as future implementation proof.
- Documentation-only status: all implementation checkboxes remain unchecked. No application source, dependency file, migration, production data, gateway, or email was changed when preparing this plan.

**Implementation stop condition:** T1-T7 satisfy the acceptance matrix and focused build/test gates; T8 records compatibility and staging evidence. No unrelated refactor, additional payment mode, generalized idempotency protocol, new gateway, or schema migration is added.

**Planning stop condition (this request):** Save and review this complete document, report its location and material contract/rollout implications, and stop. The user explicitly asked not to implement. Execution-method selection and implementation approval belong to a later request; no worker is dispatched now.
