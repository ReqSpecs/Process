"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SIGNUP_FLAG } from "@/lib/signupFlag";
import { fireCompleteRegistration } from "@/components/analytics/metaEvents";

/**
 * Reports a signup to Meta when the server says this sign-in created the
 * account (see lib/signupConversion.ts).
 *
 * Mounted site-wide rather than on one page because the destination varies:
 * a new account can land on /welcome, /start-trial, or straight into the app
 * depending on how they signed up and where they came from.
 *
 * The Suspense boundary belongs to useSearchParams, which otherwise opts every
 * statically rendered page into dynamic rendering.
 */
export function SignupConversion() {
  return (
    <Suspense fallback={null}>
      <Reporter />
    </Suspense>
  );
}

function Reporter() {
  const flagged = useSearchParams().get(SIGNUP_FLAG) === "1";

  // Depends on the boolean alone. A new search-params object on every render
  // would re-run this, and the cleanup would cancel a report still waiting for
  // the pixel to load.
  useEffect(() => {
    if (!flagged) return;
    return fireCompleteRegistration(clearFlag);
  }, [flagged]);

  return null;
}

/**
 * Drops the marker once the event is away, so a reload of what is often the
 * first page of a session cannot report the signup twice. replaceState rather
 * than router.replace: this is a cosmetic URL change, and it should not cost a
 * server round trip or re-render the page someone just landed on.
 */
function clearFlag(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete(SIGNUP_FLAG);
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}
