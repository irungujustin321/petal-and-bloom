const SANDBOX = "https://sandbox.safaricom.co.ke";
const PRODUCTION = "https://api.safaricom.co.ke";

function baseUrl() {
  return process.env.MPESA_ENV === "production" ? PRODUCTION : SANDBOX;
}

function timestampNairobi() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}${get("month")}${get("day")}${get("hour")}${get("minute")}${get("second")}`;
}

async function accessToken() {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  if (!key || !secret) {
    throw new Error("Missing MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET");
  }
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await fetch(`${baseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: "no-store",
  });
  const data = (await res.json()) as { access_token?: string; errorMessage?: string };
  console.log("DARAJA AUTH RESPONSE:", data);
  if (!res.ok || !data.access_token) {
    throw new Error(data.errorMessage || "Could not get M-Pesa access token");
  }
  return data.access_token;
}

function credentials() {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  if (!shortcode || !passkey) {
    throw new Error("Missing MPESA_SHORTCODE or MPESA_PASSKEY");
  }
  const timestamp = timestampNairobi();
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
  return { shortcode, timestamp, password };
}

export type StkPushResult = {
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  ResponseCode?: string;
  ResponseDescription?: string;
  CustomerMessage?: string;
  errorCode?: string;
  errorMessage?: string;
};

export async function initiateStkPush(params: {
  phone: string;
  amount: number;
  accountRef: string;
  description: string;
}) {
  const token = await accessToken();
  console.log("FRESH TOKEN:", token);
  const { shortcode, timestamp, password } = credentials();
  const callback = process.env.MPESA_CALLBACK_URL;
  if (!callback) throw new Error("Missing MPESA_CALLBACK_URL");

  const transactionType =
    process.env.MPESA_TRANSACTION_TYPE || "CustomerPayBillOnline";

  const res = await fetch(`${baseUrl()}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: transactionType,
      Amount: params.amount,
      PartyA: params.phone,
      PartyB: shortcode,
      PhoneNumber: params.phone,
      CallBackURL: callback,
      AccountReference: params.accountRef.slice(0, 12),
      TransactionDesc: params.description.slice(0, 13),
    }),
  });

  return (await res.json()) as StkPushResult;
}

export async function queryStkPush(checkoutRequestId: string) {
  const token = await accessToken();
  const { shortcode, timestamp, password } = credentials();

  const res = await fetch(`${baseUrl()}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  });

  return (await res.json()) as {
    ResponseCode?: string;
    ResultCode?: string;
    ResultDesc?: string;
    errorMessage?: string;
  };
}

export type StkCallbackBody = {
  Body?: {
    stkCallback?: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item?: { Name: string; Value?: string | number }[];
      };
    };
  };
};

export function receiptFromCallback(body: StkCallbackBody) {
  const items = body.Body?.stkCallback?.CallbackMetadata?.Item ?? [];
  const receipt = items.find((i) => i.Name === "MpesaReceiptNumber")?.Value;
  return receipt != null ? String(receipt) : null;
}
