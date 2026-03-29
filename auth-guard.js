// ============================================================
// LIFE OS — AUTH GUARD v2 (PRODUCTION)
// Redirects unauthenticated users to nextus.world/login.
// 3-second timeout — fails open on slow network.
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

  try {
    const result = await Promise.race([sessionPromise, timeoutPromise]);

    if (result.timedOut) {
      console.warn("[AuthGuard] Session check timed out — failing open.");
      return;
    }

    if (result.error) {
      console.warn("[AuthGuard] Session check error — failing open:", result.error);
      return;
    }

    if (result.session?.user) {
      window.LIFEOS_USER    = result.session.user;
      window.LIFEOS_USER_ID = result.session.user.id;
      console.log("[AuthGuard] Session active:", result.session.user.id);
    } else {
      // No session — redirect to login with return URL
      window.location.href = `${LOGIN_URL}?redirect=${REDIRECT_PARAM}`;
    }

  } catch (e) {
    console.warn("[AuthGuard] Unexpected error — failing open:", e);
  }
})();
