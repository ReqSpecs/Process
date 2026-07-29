import Stripe from "stripe";

type CryptoProvider = ReturnType<typeof Stripe.createSubtleCryptoProvider>;

let stripeClient: Stripe | null = null;
let cryptoProvider: CryptoProvider | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      // Cloudflare Workers has no Node http stack. The SDK's default client
      // hangs there instead of failing, which wedges the whole render — and a
      // hang skips every catch block, so nothing falls back.
      httpClient: Stripe.createFetchHttpClient(),
      // Never let Stripe being slow hold a page open. Callers treat a failure as
      // "use the stated pricing", which is far better than an unanswered request.
      timeout: 8000,
    });
  }
  return stripeClient;
}

/** Web Crypto signature checks; Workers can't reach Node's crypto module. */
export function getStripeCryptoProvider(): CryptoProvider {
  cryptoProvider ??= Stripe.createSubtleCryptoProvider();
  return cryptoProvider;
}
