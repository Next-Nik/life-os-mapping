// LIFE OS — APP LOGIC v4
// Session management, API communication, event handling.
// Seven domains: Path, Spark, Body, Finances, Relationships, Inner Game, Outer Game
//
// v4 adds:
// — localStorage autosave after every answer (survives refresh)
// — 10-minute non-blocking warning for anonymous users
// — 5-minute Supabase autosave for signed-in users
// — Two-tier results: light (anonymous) vs full (signed-in)
// — Email capture modal at completion for anonymous users
// — Supabase auth + session save on email submit

// ─── Supabase client (lazy-loaded) ───────────────────────────────────────────
// Set these in your Vercel environment variables:
//   VITE_SUPABASE_URL  (not used here — vanilla JS reads from window)
//   Injected via index.html meta tags or a separate supabase-config.js
//
// For now reads from window.SUPABASE_URL / window.SUPABASE_ANON_KEY
// which are set in index.html. See index.html for the script block.

let supabase = null;

function initSupabase() {
  if (supabase) return supabase;
  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("YOUR_")) return null;

  try {
    supabase = window.supabase.createClient(url, key);
    return supabase;
  } catch {
    return null;
  }
}

// ─── localStorage helpers ─────────────────────────────────────────────────────
const LS_KEY = "lifeos_orienteering_session_v1";

function lsSave(session) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      session,
      savedAt: Date.now()
    }));
  } catch {}
}

function lsLoad() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Discard saves older than 24 hours
    if (Date.now() - parsed.savedAt > 86400000) {
      localStorage.removeItem(LS_KEY);
      return null;
    }
    return parsed.session;
  } catch {
    return null;
  }
}

function lsClear() {
  try { localStorage.removeItem(LS_KEY); } catch {}
}

// ─── Supabase session save ────────────────────────────────────────────────────
async function supabaseSaveSession(session, userId) {
  const sb = initSupabase();
  if (!sb || !userId) return;
  try {
    await sb.from("orienteering_sessions").upsert({
      user_id:    userId,
      session:    session,
      phase:      session.phase,
      updated_at: new Date().toISOString(),
      complete:   session.status === "complete" || session.phase === "complete"
    }, { onConflict: "user_id" });
  } catch (err) {
    console.warn("Supabase autosave failed:", err);
  }
}

// ─── Main App ─────────────────────────────────────────────────────────────────
const App = {
  session:          null,
  isWaiting:        false,
  userId:           null,       // set after Supabase sign-in
  userEmail:        null,
  warningShown:     false,      // 10-min warning fires once
  warningTimer:     null,
  autosaveTimer:    null,       // 5-min Supabase autosave interval
  pendingMapData:   null,       // held until auth decision at completion

  // ─── Init ──────────────────────────────────────────────────────────────────
  init() {
    initSupabase();
    this.bindEvents();
    this.checkExistingAuth();
  },

  // Check if user already has a Supabase session from a previous visit
  async checkExistingAuth() {
    const sb = initSupabase();
    if (!sb) return;
    try {
      const { data: { session } } = await sb.auth.getSession();
      if (session?.user) {
        this.userId    = session.user.id;
        this.userEmail = session.user.email;
      }
    } catch {}
  },

  bindEvents() {
    let currentSlide = 0;
    const totalSlides = 3;
    const track = document.getElementById("carousel-track");
    const arrow = document.getElementById("carousel-arrow");
    const dots  = document.querySelectorAll(".carousel-dot");

    const advanceCarousel = () => {
      currentSlide++;
      track.style.transform = `translateX(-${currentSlide * 33.333}%)`;
      dots.forEach((d, i) => d.classList.toggle("active", i === currentSlide));

      if (currentSlide === totalSlides - 1) {
        arrow.outerHTML = `<button class="carousel-begin" id="carousel-arrow">Begin your map</button>`;
        document.getElementById("carousel-arrow").addEventListener("click", () => this.startConversation());
      }
    };

    if (arrow) arrow.addEventListener("click", advanceCarousel);

    const sendBtn = document.getElementById("send-btn");
    const input   = document.getElementById("user-input");

    if (sendBtn) sendBtn.addEventListener("click", () => this.sendUserInput());

    if (input) {
      input.addEventListener("input", () => {
        input.style.height = "auto";
        input.style.height = Math.min(input.scrollHeight, 120) + "px";
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.sendUserInput();
        }
      });
    }
  },

  // ─── Start ─────────────────────────────────────────────────────────────────
  async startConversation() {
    UI.hideWelcome();
    UI.showChat();

    // Start the 10-minute warning timer (anonymous users only)
    this.startWarningTimer();

    // Start 5-minute Supabase autosave interval (fires only if userId is set)
    this.startAutosaveTimer();

    const chatContainer = document.getElementById("chat-container");
    const typingEl = UI.createTypingIndicator();
    chatContainer.appendChild(typingEl);
    UI.scrollToBottom();

    try {
      const data = await this.callAPI([]);
      UI.hideTyping();
      this.handleAPIResponse(data);
    } catch (err) {
      UI.hideTyping();
      this.addAssistantMessage("Something went wrong. Please refresh and try again.");
    }
  },

  // ─── Warning timer ─────────────────────────────────────────────────────────
  startWarningTimer() {
    if (this.warningTimer) clearTimeout(this.warningTimer);
    this.warningTimer = setTimeout(() => {
      // Only fire if not already signed in
      if (!this.userId && !this.warningShown) {
        this.warningShown = true;
        UI.showSaveWarning(() => {
          UI.showAuthModal({
            mode: "save",
            onSubmit: (email) => this.signInWithEmail(email),
            onDismiss: () => {}
          });
        });
      }
    }, 10 * 60 * 1000); // 10 minutes
  },

  // ─── Supabase autosave interval ────────────────────────────────────────────
  startAutosaveTimer() {
    if (this.autosaveTimer) clearInterval(this.autosaveTimer);
    this.autosaveTimer = setInterval(() => {
      if (this.userId && this.session) {
        supabaseSaveSession(this.session, this.userId);
      }
    }, 5 * 60 * 1000); // every 5 minutes
  },

  stopTimers() {
    if (this.warningTimer)  clearTimeout(this.warningTimer);
    if (this.autosaveTimer) clearInterval(this.autosaveTimer);
  },

  // ─── Sign in with email ────────────────────────────────────────────────────
  async signInWithEmail(email) {
    const sb = initSupabase();
    if (!sb) {
      // Supabase not configured — store email locally for now, proceed as if signed in
      this.userEmail = email;
      this.onSignInSuccess(null, email);
      return;
    }

    try {
      // Use OTP magic link — no password required
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true }
      });

      if (error) throw error;

      // OTP sent — user needs to click link in email.
      // For now we treat them as "pending auth" and save what we have.
      this.userEmail = email;
      this.onSignInSuccess(null, email);

    } catch (err) {
      console.warn("Sign in error:", err);
      // Fail gracefully — store email, continue
      this.userEmail = email;
      this.onSignInSuccess(null, email);
    }
  },

  // Called after successful email capture (with or without confirmed auth)
  onSignInSuccess(userId, email) {
    if (userId) this.userId = userId;
    this.userEmail = email;

    // Save current session state to Supabase if we have a userId
    if (this.userId && this.session) {
      supabaseSaveSession(this.session, this.userId);
    }

    // If we were holding a completed map pending auth, now deliver the full results
    if (this.pendingMapData) {
      const { mapData, session } = this.pendingMapData;
      this.pendingMapData = null;
      this.deliverFullResults(mapData, session);
    }
  },

  // ─── Send user input ────────────────────────────────────────────────────────
  sendUserInput() {
    if (this.isWaiting) return;
    const input = document.getElementById("user-input");
    const text  = input ? input.value.trim() : "";
    if (!text) return;
    this.sendMessage(text);
  },

  sendMessage(text, suppressBubble = false) {
    if (this.isWaiting) return;
    this.isWaiting = true;

    UI.clearInput();
    UI.disableInput();

    const chatContainer = document.getElementById("chat-container");

    if (!suppressBubble) {
      const userBubble = UI.createUserMessage(text);
      chatContainer.appendChild(userBubble);
      UI.scrollToMessage(userBubble);
    }

    const typingEl = UI.createTypingIndicator();
    chatContainer.appendChild(typingEl);
    UI.showTyping();

    const messages = [{ role: "user", content: text }];

    this.callAPI(messages)
      .then(data => {
        UI.hideTyping();
        this.handleAPIResponse(data);
        this.isWaiting = false;
      })
      .catch(() => {
        UI.hideTyping();
        this.addAssistantMessage("Something went wrong. Please try again.");
        UI.enableInput();
        this.isWaiting = false;
      });
  },

  // ─── API call ───────────────────────────────────────────────────────────────
  async callAPI(messages) {
    const body = { messages, session: this.session };
    const response = await fetch("/api/chat", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },

  // ─── Handle API response ────────────────────────────────────────────────────
  handleAPIResponse(data) {
    if (data.session) {
      this.session = data.session;
      // localStorage autosave after every response
      lsSave(this.session);
    }

    const chatContainer = document.getElementById("chat-container");

    if (data.phaseLabel) {
      UI.updateProgress(data.phaseLabel);
    }

    // Completion — two paths based on auth state
    if (data.complete && data.mapData) {
      this.stopTimers();
      lsClear(); // Clear localStorage on completion — data will live in Supabase

      if (this.userId || this.userEmail) {
        // Already signed in or email captured — deliver full results
        this.deliverFullResults(data.mapData, data.session || this.session);
      } else {
        // Anonymous — show light results, hold full map pending sign-in
        this.pendingMapData = { mapData: data.mapData, session: data.session || this.session };
        this.deliverLightResults(data.mapData, data.session || this.session);
      }

      UI.setInputMode("none");
      return;
    }

    // Regular message
    if (data.message) {
      const msgEl = UI.createAssistantMessage(data.message);
      chatContainer.appendChild(msgEl);
      setTimeout(() => msgEl.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }

    UI.setInputMode(data.complete ? "none" : (data.inputMode || "text"));
  },

  // ─── Full results (signed-in users) ────────────────────────────────────────
  deliverFullResults(mapData, session) {
    const chatContainer = document.getElementById("chat-container");

    // Remove light results card if it's there
    const lightCard = document.getElementById("light-results-wrapper");
    if (lightCard) lightCard.remove();

    const mapEl = this.renderFinalMap(mapData, session);
    chatContainer.appendChild(mapEl);
    setTimeout(() => mapEl.scrollIntoView({ behavior: "smooth", block: "start" }), 100);

    // Save to Supabase if signed in
    if (this.userId) {
      supabaseSaveSession({ ...session, phase: "complete", status: "complete" }, this.userId);
    }

    UI.setInputMode("none");
  },

  // ─── Light results (anonymous users) ───────────────────────────────────────
  deliverLightResults(mapData, session) {
    const chatContainer = document.getElementById("chat-container");

    const wrapper = document.createElement("div");
    wrapper.id = "light-results-wrapper";

    const lightCard = UI.createLightResultsCard(mapData, session, () => {
      UI.showAuthModal({
        mode: "results",
        onSubmit: (email) => this.signInWithEmail(email),
        onDismiss: () => {
          // Show preview state — user can still sign in later
        }
      });
    });

    wrapper.appendChild(lightCard);
    chatContainer.appendChild(wrapper);
    setTimeout(() => wrapper.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  },

  // ─── Full map render ────────────────────────────────────────────────────────
  renderFinalMap(mapData, session) {
    const wrapper = document.createElement("div");
    wrapper.className = "message message-profile";

    const domainOrder = ["path","spark","body","finances","relationships","inner_game","outer_game"];
    const domainLabels = {
      path:"Path", spark:"Spark", body:"Body", finances:"Finances",
      relationships:"Relationships", inner_game:"Inner Game", outer_game:"Outer Game"
    };
    const domainQuestions = {
      path:          "Am I on my path — and actually moving?",
      spark:         "Is the fire on?",
      body:          "How is this living system doing?",
      finances:      "Do I have the agency to act on what matters?",
      relationships: "Am I truly known by anyone?",
      inner_game:    "Are my stories tending me, or running me?",
      outer_game:    "Is what I'm broadcasting aligned with who I actually am?"
    };
    const domainFractals = {
      path:"Vision", spark:"Human Being", body:"Nature",
      finances:"Finance & Economy", relationships:"Society",
      inner_game:"Legacy", outer_game:"Society"
    };

    const domainData   = session?.domainData || {};
    const focusDomains = mapData.focus_domains || [];

    const scoreRows = domainOrder.map(id => {
      const data = domainData[id];
      if (!data) return "";
      const isFocus  = focusDomains.includes(id);
      const score    = data.score || 0;
      const barWidth = (score / 10) * 100;
      const barColor = score <= 3 ? "#e05c5c" : score <= 6 ? "#E89842" : "#5cb85c";
      return `
        <div class="map-domain-row ${isFocus ? "map-domain-focus" : ""}">
          <div class="map-domain-info">
            <div class="map-domain-name">${isFocus ? "▸ " : ""}${domainLabels[id]}</div>
            <div class="map-domain-thesis">${domainQuestions[id]}</div>
          </div>
          <div class="map-domain-bar-wrap">
            <div class="map-domain-bar" style="width:${barWidth}%;background:${barColor};"></div>
          </div>
          <div class="map-domain-right">
            <div class="map-domain-score">${score}/10</div>
            <div class="map-domain-fractal">${domainFractals[id]}</div>
          </div>
          ${isFocus ? '<div class="map-focus-tag">focus</div>' : ""}
        </div>`;
    }).join("");

    wrapper.innerHTML = `
      <div class="profile-card">
        <div class="profile-hero">
          <div class="profile-card-heading">Your Life OS Map</div>
          <div class="map-stage-badge">${mapData.stage}</div>
          <div class="map-stage-desc">${mapData.stage_description}</div>
        </div>

        <div class="profile-section">
          <div class="profile-section-label">Your Seven Domains</div>
          <div class="map-domains">${scoreRows}</div>
        </div>

        <div class="profile-section">
          <div class="profile-section-label">What The Pattern Shows</div>
          <p>${mapData.overall_reflection.replace(/\n\n/g, "</p><p>")}</p>
        </div>

        <div class="profile-section">
          <div class="profile-section-label">Your Three Focus Domains</div>
          <p>${focusDomains.map(id => domainLabels[id] || id).join("  ·  ")}</p>
          <p style="margin-top:10px;color:var(--doc-light);font-size:0.92rem;">${mapData.focus_reasoning}</p>
        </div>

        ${mapData.brain_insight ? `
        <div class="profile-section">
          <div class="profile-section-label">What To Learn</div>
          <p style="font-size:0.92rem;">${mapData.brain_insight}</p>
        </div>` : ""}

        <div class="profile-closing">
          ${mapData.next_step}
        </div>
      </div>`;

    return wrapper;
  },

  addAssistantMessage(text) {
    const chatContainer = document.getElementById("chat-container");
    const el = UI.createAssistantMessage(text);
    chatContainer.appendChild(el);
    UI.scrollToMessage(el);
    UI.enableInput();
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
window.App = App;
