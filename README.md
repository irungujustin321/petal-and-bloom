# Petal & Bloom

A floral cosmetics boutique: customers shop and pay with **M-Pesa STK Push**, while staff manage stock and prices in a separate admin console. Data and auth live in **Supabase**.

## What you get

- Customer register / login (shoppers only)
- Admin login at `/admin/login` (staff role only)
- Catalog with stock and KES prices
- Cart, checkout, and Lipa na M-Pesa online (STK push)
- Order history and payment polling
- Admin stock, prices, image upload, and order fulfillment

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, paste and run `supabase/schema.sql`.
3. In **Authentication → Providers**, keep Email enabled. For local testing, turn **off** “Confirm email”.
4. Create your staff user under **Authentication → Users** (or register once on the customer form).
5. Promote that user:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

6. Copy **Project URL**, **anon key**, and **service role key** from **Project Settings → API**.

## 2. M-Pesa (Daraja)

1. Create an app at [developer.safaricom.co.ke](https://developer.safaricom.co.ke) with **Lipa na M-Pesa Online**.
2. Sandbox defaults: shortcode `174379`, test phone `254708374149`, and the sandbox passkey from Daraja.
3. STK callbacks must hit a **public HTTPS** URL. Locally, expose the app with ngrok (or similar) and set `MPESA_CALLBACK_URL` to `https://YOUR_HOST/api/mpesa/callback`.

## 3. Environment

Copy `.env.example` to `.env.local` and fill in the values.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Door | Path |
| --- | --- |
| Shop | `/` `/shop` |
| Customer login | `/login` |
| Customer register | `/register` |
| Admin login | `/admin/login` |
| Stock & prices | `/admin/products` |

## Payment flow

1. Customer checks out with a Kenyan mobile number (`07…` or `2547…`).
2. Stock is reserved and Daraja sends an STK prompt.
3. Safaricom posts the result to `/api/mpesa/callback`.
4. The order page polls `/api/mpesa/status` until the order is paid or failed. Failed payments return stock.

Switch `MPESA_ENV` to `production` and use your live shortcode, passkey, and consumer credentials when you go live. Use `CustomerBuyGoodsOnline` if you settle to a Till instead of a Paybill.
