# AbacatePay Integration Status

**Date:** 2026-02-18
**Status:** Paused (Partially Implemented)
**Reason:** Paused to revert landing page buttons to WhatsApp while integration is finalized.

## Overview
The following components have been implemented to support AbacatePay integration:

### 1. Database Schema
- **Table:** `payments`
- **Columns:**
    - `id` (UUID, PK)
    - `transaction_id` (Text) - AbacatePay Billing ID
    - `status` (Text) - 'pending', 'confirmed'
    - `amount` (Decimal)
    - `customer_email` (Text)
    - `plan_type` (Text) - 'monthly', 'quarterly', 'yearly'
    - `metadata` (JSONB) - Stores full webhook payload
    - `created_at` (Timestamp)

### 2. API Routes
- **Checkout:** `app/api/checkout/route.ts`
    - Handles billing creation via AbacatePay API.
    - **Current Config:** Hardcoded API Key (Dev), PIX only enabled (Card disabled due to account restrictions).
    - **Note:** Ensure `ABACATEPAY_API_KEY` is properly set in `.env` for production.
- **Webhook:** `app/api/webhooks/payment/route.ts`
    - Listens for `billing.paid` events.
    - Updates `payments` table status to 'confirmed'.
    - **URL:** Needs to be configured in AbacatePay dashboard (requires public URL/ngrok).

### 3. Frontend Components
- **Checkout Modal:** `components/checkout/CheckoutModal.tsx`
    - Collects user info (Name, Email, Phone, CPF) and initiates checkout.
- **Success Page:** `app/assinatura/sucesso/page.tsx`
    - Polls for payment confirmation.
    - Displays "Create Account" button when `status === 'confirmed'`.
    - **Fix:** Uses `transactionId` from URL for consistency.

### 4. Integration Steps to Resume
1.  **Re-enable Checkout Modal:** In `app/page.tsx`, revert the `handleSubscribe` function to open the modal instead of redirecting to WhatsApp.
2.  **Environment Variables:** Ensure `.env` is correctly loaded with `ABACATEPAY_API_KEY`.
3.  **Webhook Configuration:**
    - Deploy to staging/production.
    - Copy webhook URL (`/api/webhooks/payment`) to AbacatePay Dashboard.
    - Select `billing.paid` event.
    - Updates will then be automatic.
4.  **Card Payments:** Once the account enables Card/Boleto, update `app/api/checkout/route.ts` to include `["PIX", "CARD"]`.

## Manual Testing (Localhost)
Since webhooks don't reach localhost:
1.  Initiate checkout -> Get redirected to AbacatePay.
2.  Pay via PIX (Sandbox).
3.  Copy `transaction_id` (Billing ID) from URL/Console.
4.  Run SQL in Supabase:
    ```sql
    UPDATE payments SET status = 'confirmed' WHERE transaction_id = 'YOUR_ID';
    ```
5.  Access: `http://localhost:3000/assinatura/sucesso?transaction_id=YOUR_ID`
