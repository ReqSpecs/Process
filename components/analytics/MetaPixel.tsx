"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Meta's pixel, loaded once for the whole site.
 *
 * Hardcoded rather than configured: a pixel id is public the moment the page
 * renders, so there's nothing to protect, and an environment variable would
 * only add another build-time setting to forget.
 */
const PIXEL_ID = "897722186256760";

/**
 * Development never reports. A conversion fired while building the checkout
 * flow is indistinguishable from a real one to Meta, and it trains the ad
 * optimiser on people who were never going to buy.
 */
const ENABLED = process.env.NODE_ENV === "production";

export function MetaPixel() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  // The snippet below sends the first PageView itself. Every later one has to
  // be sent by hand: the App Router swaps pages without a document load, so
  // otherwise an entire session reports as a single page view.
  useEffect(() => {
    if (!ENABLED) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname]);

  if (!ENABLED) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
