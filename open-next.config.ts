import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default {
  ...defineCloudflareConfig(),
  // The adapter shells out to `npm run build`, which is the adapter itself.
  // Call Next directly so the two don't recurse.
  buildCommand: "npx next build",
};
