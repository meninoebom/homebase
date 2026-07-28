# Users stuck on an old build after moving to a custom domain

## Symptom

Homebase moved from `meninoebom.github.io/homebase/` to `homebase.you`. Anyone who had opened the old URL keeps seeing the **old app** at the old URL forever. They never get redirected to the new domain, they never receive updates, and nothing you deploy reaches them. There is no error and no warning; the app just quietly stops being the app you are shipping.

Their journal files are fine throughout. This is a stale *app*, not lost data.

## Root cause

A closed loop between the service worker and the redirect:

1. The old origin still has a registered, active service worker, scoped to `/homebase/`.
2. GitHub Pages now answers everything at the old origin with a **301 to the custom domain**, including `/homebase/sw.js`.
3. When the browser checks for a service-worker update, it fetches the worker script and finds a redirect. The Service Worker spec forbids redirects on the worker script, so the update **fails** — and a failed update leaves the existing worker installed and active.
4. That worker registers a Workbox `NavigationRoute` bound to the precached `index.html`, so in-scope navigations are answered from its cache. The browser never hits the network, so it **never sees the 301** that would have carried the user to the new domain.

Each step re-arms the next. The worker cannot update itself, and it prevents the redirect that would make updating unnecessary.

Two related consequences worth knowing:

- The old and new origins have **separate IndexedDB**, so the saved directory handle does not travel. On the new domain a returning user gets the first-run screen and re-picks their folder. Their files are untouched.
- The usual remedy for a bad worker — deploy a no-op "safety worker" at the same URL, per [Workbox's guidance](https://developer.chrome.com/docs/workbox/remove-buggy-service-workers) — **is unavailable here**, because the CNAME makes the redirect unconditional. You cannot serve any content at the old URL to replace the worker.

## Fix

There is no remote fix. Each affected browser must clear it locally:

- DevTools → Application → Service Workers → **Unregister** (at the *old* origin), then reload; or
- Clear site data for the old origin.

A `Clear-Site-Data: storage` response header would do it centrally, but GitHub Pages cannot set headers.

## Rule going forward

**Deploy the safety worker before the redirect, not after.** If Homebase ever changes origin again, the order is:

1. Ship a build at the *old* origin whose service worker only calls `self.registration.unregister()` and clears its caches.
2. Give it time to propagate to real visitors.
3. Only then point the domain at the new origin.

More generally: a service worker is the one artifact that outlives your deploys. Any origin change strands it, and the window to fix it closes the moment the old URL stops serving your files. Treat "who has an old service worker?" as a migration question, and assume the answer is not only you if the old link was ever shared.
