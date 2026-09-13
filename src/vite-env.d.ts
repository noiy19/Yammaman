/// <reference types="vite/client" />

/**
 * Typed environment.
 *
 * READ THIS BEFORE ADDING A SECRET
 * Every VITE_* variable is compiled into the client bundle and is public. The
 * commerce engine's TenantApiKey, the Cloudinary API secret, the Resend key and
 * the RunningHub key must NEVER appear here — they belong in the deployment
 * platform's server-side environment and are reached through a server function.
 * tech-stack.md is explicit that credentials and the live TenantApiKey stay out
 * of the repo.
 *
 * So this list stays short on purpose: only values that are genuinely safe to
 * hand to a browser.
 */
interface ImportMetaEnv {
  /** Base URL of the commerce engine, reached via a server-side proxy. */
  readonly VITE_COMMERCE_API_BASE?: string;
  /** Cloudinary cloud name — a public identifier, not a secret. */
  readonly VITE_CLOUDINARY_CLOUD_NAME?: string;
  /** Clerk publishable key — designed to be public. */
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
