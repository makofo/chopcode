// Talks to the Platega payment API. Credentials live ONLY in Railway env vars
// (PLATEGA_MERCHANT_ID, PLATEGA_SECRET) — never hard-coded here.
//
// Auth: headers X-MerchantId + X-Secret.
// Create payment: POST https://app.platega.io/transaction/process
// Response carries the pay URL as "url" (v2) or "redirect" (v1) + a transactionId.

export async function createPlategaPayment({ amount, description, payload, returnUrl, failedUrl }) {
  const merchantId = process.env.PLATEGA_MERCHANT_ID;
  const secret = process.env.PLATEGA_SECRET;
  if (!merchantId || !secret) {
    throw new Error("PLATEGA_MERCHANT_ID / PLATEGA_SECRET are not set");
  }

  const endpoint =
    process.env.PLATEGA_CREATE_URL || "https://app.platega.io/transaction/process";
  const paymentMethod = Number(process.env.PLATEGA_METHOD || 2); // 2 = СБП (можно сменить через env)

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-MerchantId": merchantId,
      "X-Secret": secret,
    },
    body: JSON.stringify({
      paymentMethod,
      paymentDetails: { amount, currency: "RUB" },
      description,
      return: returnUrl,
      failedUrl,
      payload,
    }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error("Platega " + res.status + ": " + text);

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error("Platega returned non-JSON: " + text);
  }

  const payUrl = data.url || data.redirect;
  if (!payUrl) throw new Error("Platega response has no pay URL: " + text);

  return { transactionId: data.transactionId, payUrl };
}
