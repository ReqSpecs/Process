import { createServiceClient } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type EmailValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Signup gate: block malformed addresses, disposable domains, and
 * domains with no MX records so bounced-email trial abuse is harder.
 */
export async function validateEmail(email: string): Promise<EmailValidationResult> {
  const normalized = email.trim().toLowerCase();

  if (!EMAIL_RE.test(normalized)) {
    return { ok: false, reason: "That doesn't look like a valid email address." };
  }

  const domain = normalized.split("@")[1];

  const supabase = createServiceClient();
  const { data: blocked } = await supabase
    .from("blocked_email_domains")
    .select("domain")
    .eq("domain", domain)
    .maybeSingle();

  if (blocked) {
    return {
      ok: false,
      reason: "Disposable email addresses aren't supported. Please use your work or personal email.",
    };
  }

  const hasMx = await domainHasMx(domain);
  if (!hasMx) {
    return {
      ok: false,
      reason: "We couldn't verify that email domain can receive mail. Please check for typos.",
    };
  }

  return { ok: true };
}

/** DNS-over-HTTPS MX lookup — works on Cloudflare Workers (no node:dns). */
async function domainHasMx(domain: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`,
      {
        headers: { accept: "application/dns-json" },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (!res.ok) return true; // fail open: DNS service issue shouldn't block signups
    const data = (await res.json()) as { Status: number; Answer?: unknown[] };
    return data.Status === 0 && Array.isArray(data.Answer) && data.Answer.length > 0;
  } catch {
    return true; // fail open on network errors
  }
}
