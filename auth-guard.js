// ============================================================
// LIFE OS — AUTH GUARD v2 (PRODUCTION)
// Pattern A — but gate is on the button, not on page load.
// Page loads for everyone. Auth check runs silently.
// Button updates based on session state.
// ============================================================

(async function() {
  const SUPABASE_URL      = window.SUPABASE_URL;
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;
  const AUTH_TIMEOUT_MS   = 3000;
  const LOGIN_URL         = "https://nextus.world/login.html";
  const REDIRECT_PARAM    = encodeURIComponent(window.location.href);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes("YOUR_")) {
    console.warn("[AuthGuard] Supabase not configured — skipping auth check.");
    return;
  }

  let sb;
  try {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.warn("[AuthGuard] Could not initialise Supabase:", e);
    return;
  }

  const timeoutPromise = new Promise((resolve) =>
    setTimeout(() => resolve({ timedOut: true }), AUTH_TIMEOUT_MS)
  );

  const sessionPromise = sb.auth.getSession().then(({ data, error }) => ({
    session: data?.session,
    error,
    timedOut: false
  })).catch((e) => ({
    session: null,
    error: e,
    timedOut: false
  }));

  const result = await Promise.race([sessionPromise, timeoutPromise]);

  if (result.timedOut || result.error) {
    // Fail open — button stays as "Begin your map", tool works without session
    console.warn("[AuthGuard] Session check failed or timed out — failing open.");
    return;
  }

  if (result.session?.user) {
    // Signed in — store user, button stays as "Begin your map"
    window.LIFEOS_USER    = result.session.user;
    window.LIFEOS_USER_ID = result.session.user.id;
    console.log("[AuthGuard] Session active:", result.session.user.id);
  } else {
    // Not signed in — update button to invite sign-in
    const btn = document.getElementById("begin-btn");
    if (btn) {
      btn.textContent = "Sign in to begin";
      btn.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        window.location.href = `${LOGIN_URL}?redirect=${REDIRECT_PARAM}`;
      }, true); // capture phase — fires before app.js bind
    }
  }
})();
