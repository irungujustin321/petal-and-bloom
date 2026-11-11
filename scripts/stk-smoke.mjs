import fs from "node:fs";

for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const SANDBOX = "https://sandbox.safaricom.co.ke";
const auth = Buffer.from(
  `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`,
).toString("base64");

const tokRes = await fetch(
  `${SANDBOX}/oauth/v1/generate?grant_type=client_credentials`,
  { headers: { Authorization: `Basic ${auth}` } },
);
const tok = await tokRes.json();
console.log("token_ok", !!tok.access_token, tok.errorMessage || tok.error || "");
if (!tok.access_token) process.exit(1);

const shortcode = process.env.MPESA_SHORTCODE || "174379";
const passkey = process.env.MPESA_PASSKEY;
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
const g = (t) => parts.find((p) => p.type === t)?.value || "";
const ts = `${g("year")}${g("month")}${g("day")}${g("hour")}${g("minute")}${g("second")}`;
const password = Buffer.from(`${shortcode}${passkey}${ts}`).toString("base64");

const body = {
  BusinessShortCode: shortcode,
  Password: password,
  Timestamp: ts,
  TransactionType: "CustomerPayBillOnline",
  Amount: 1,
  PartyA: "254708374149",
  PartyB: shortcode,
  PhoneNumber: "254708374149",
  CallBackURL: process.env.MPESA_CALLBACK_URL,
  AccountReference: "PBTEST",
  TransactionDesc: "PetalTest",
};

const res = await fetch(`${SANDBOX}/mpesa/stkpush/v1/processrequest`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${tok.access_token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});
console.log(await res.text());
