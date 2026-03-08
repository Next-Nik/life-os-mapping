// LIFE OS — APP LOGIC v3
// Session management, API communication, event handling.
// Seven domains: Path, Spark, Body, Finances, Relationships, Inner Game, Outer Game

const App = {
  session: null,
  isWaiting: false,

  init() {
    this.bindEvents();
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

  async startConversation() {
    UI.hideWelcome();
    UI.showChat();

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

  handleAPIResponse(data) {
    if (data.session) this.session = data.session;

    const chatContainer = document.getElementById("chat-container");

    if (data.phaseLabel) {
      UI.updateProgress(data.phaseLabel);
    }

    // Update live wheel whenever wheelData arrives
    if (data.wheelData) {
      this.updateWheel(data.wheelData);
    }

    // Domain readout card — shown after placement lands (placement_confirm phase)
    if (data.phase === "placement_confirm" && data.wheelData) {
      const completedDomain = data.wheelData.find(d => d.score !== null && d.score !== undefined);
      // Find the most recently scored domain
      const scored = data.wheelData.filter(d => d.score !== null);
      if (scored.length > 0) {
        const latest = scored[scored.length - 1];
        const readoutEl = this.renderDomainReadout(latest);
        if (readoutEl) {
          // Insert before the message
          chatContainer.appendChild(readoutEl);
          setTimeout(() => readoutEl.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        }
      }
    }

    // Final map — special rendering
    if (data.complete && data.mapData) {
      const mapEl = this.renderFinalMap(data.mapData, data.session, data.wheelData);
      chatContainer.appendChild(mapEl);
      setTimeout(() => mapEl.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
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

  // ─── Domain readout card ───────────────────────────────────────────────────
  renderDomainReadout(domain) {
    if (!domain || domain.score === null) return null;
    const score = domain.score;
    const scoreColor = score <= 3 ? "var(--score-red)" : score <= 5 ? "var(--score-orange)" : score <= 7 ? "var(--score-amber)" : "var(--score-green)";

    const el = document.createElement("div");
    el.className = "domain-readout";
    el.innerHTML = `
      <div class="domain-readout-inner">
        <div class="domain-readout-label">${domain.label}</div>
        <div class="domain-readout-score" style="color:${scoreColor}">${score}<span class="domain-readout-denom">/10</span></div>
        <div class="domain-readout-tier">${domain.tier}</div>
        ${domain.horizonScore ? `<div class="domain-readout-horizon">Horizon: ${domain.horizonScore}</div>` : ""}
      </div>`;
    return el;
  },

  // ─── Live wheel renderer ───────────────────────────────────────────────────
  updateWheel(wheelData) {
    const container = document.getElementById("wheel-container");
    const canvas    = document.getElementById("domain-wheel");
    const legend    = document.getElementById("wheel-legend");
    if (!container || !canvas) return;

    // Show wheel once first domain scores
    const hasAnyScore = wheelData.some(d => d.score !== null);
    if (!hasAnyScore) return;
    container.style.display = "flex";

    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const maxR = 110;
    const domains = wheelData;
    const n = domains.length;
    const angleStep = (Math.PI * 2) / n;
    const startAngle = -Math.PI / 2; // top

    ctx.clearRect(0, 0, W, H);

    // ── Background rings (gossamer) ──
    const goldRing = "rgba(200,169,110,0.12)";
    for (let ring = 2; ring <= 10; ring += 2) {
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const angle = startAngle + i * angleStep;
        const r = (ring / 10) * maxR;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = goldRing;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // ── Spokes ──
    for (let i = 0; i < n; i++) {
      const angle = startAngle + i * angleStep;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + maxR * Math.cos(angle), cy + maxR * Math.sin(angle));
      ctx.strokeStyle = "rgba(200,169,110,0.15)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // ── Horizon goal outline (dashed, gold) ──
    const horizonPoints = domains.map((d, i) => {
      const angle = startAngle + i * angleStep;
      const r = d.horizonScore !== null ? (d.horizonScore / 10) * maxR : 0;
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), hasData: d.horizonScore !== null };
    });

    const horizonWithData = horizonPoints.filter(p => p.hasData);
    if (horizonWithData.length >= 2) {
      ctx.beginPath();
      ctx.setLineDash([3, 4]);
      horizonPoints.forEach((p, i) => {
        if (!p.hasData) return;
        i === 0 || !horizonPoints[i - 1]?.hasData ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      });
      if (horizonWithData.length === n) ctx.closePath();
      ctx.strokeStyle = "rgba(200,169,110,0.45)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ── Current placement filled shape ──
    const placedPoints = domains.map((d, i) => {
      const angle = startAngle + i * angleStep;
      const r = d.score !== null ? (d.score / 10) * maxR : 0;
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), hasData: d.score !== null };
    });

    const placedWithData = placedPoints.filter(p => p.hasData);
    if (placedWithData.length > 0) {
      ctx.beginPath();
      let firstMoved = false;
      placedPoints.forEach((p, i) => {
        if (d => d.score === null) {
          // still draw to centre for unfilled domains to keep shape
        }
        if (!firstMoved) { ctx.moveTo(p.x, p.y); firstMoved = true; }
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fillStyle = "rgba(200,169,110,0.12)";
      ctx.fill();
      ctx.strokeStyle = "rgba(200,169,110,0.7)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // ── Score nodes ──
    domains.forEach((d, i) => {
      if (d.score === null) return;
      const angle = startAngle + i * angleStep;
      const r = (d.score / 10) * maxR;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#C8922A";
      ctx.fill();
    });

    // ── Domain labels ──
    const labelR = maxR + 18;
    ctx.font = "500 10px Georgia, serif";
    ctx.fillStyle = "rgba(26,26,26,0.75)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    domains.forEach((d, i) => {
      const angle = startAngle + i * angleStep;
      const x = cx + labelR * Math.cos(angle);
      const y = cy + labelR * Math.sin(angle);

      // Adjust alignment for left/right sides
      if (angle > Math.PI * 0.15 && angle < Math.PI * 0.85) ctx.textAlign = "left";
      else if (angle > -Math.PI * 0.85 && angle < -Math.PI * 0.15) ctx.textAlign = "right";
      else ctx.textAlign = "center";

      // Bold if scored
      ctx.font = d.score !== null ? "600 10px Georgia, serif" : "400 10px Georgia, serif";
      ctx.fillStyle = d.score !== null ? "rgba(200,169,110,0.9)" : "rgba(26,26,26,0.35)";
      ctx.fillText(d.label, x, y);
    });

    // Update legend
    if (legend) {
      const scored = wheelData.filter(d => d.score !== null);
      legend.innerHTML = scored.map(d => `
        <div class="wheel-legend-item">
          <span class="wheel-legend-dot" style="background:${d.score <= 3 ? "var(--score-red)" : d.score <= 5 ? "var(--score-orange)" : d.score <= 7 ? "var(--score-amber)" : "var(--score-green)"}"></span>
          <span class="wheel-legend-name">${d.label}</span>
          <span class="wheel-legend-score">${d.score}</span>
        </div>`).join("");
    }
  },

  renderFinalMap(mapData, session, wheelData) {
    const wrapper = document.createElement("div");
    wrapper.className = "message message-profile";

    const domainOrder = ["path", "spark", "body", "finances", "relationships", "inner_game", "outer_game"];

    const domainLabels = {
      path:          "Path",
      spark:         "Spark",
      body:          "Body",
      finances:      "Finances",
      relationships: "Relationships",
      inner_game:    "Inner Game",
      outer_game:    "Outer Game"
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
      path:          "Vision",
      spark:         "Human Being",
      body:          "Nature",
      finances:      "Finance & Economy",
      relationships: "Society",
      inner_game:    "Legacy",
      outer_game:    "Society"
    };

    const domainData  = session?.domainData || {};
    const focusDomains = mapData.focus_domains || [];

    const scoreRows = domainOrder.map(id => {
      const data = domainData[id];
      if (!data) return "";
      const isFocus  = focusDomains.includes(id);
      const score    = data.score || 0;
      const barWidth = (score / 10) * 100;
      const barColor = score <= 3 ? "var(--score-red)" : score <= 5 ? "var(--score-orange)" : score <= 7 ? "var(--score-amber)" : "var(--score-green)";
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
          <p style="margin-top:10px;color:#8fa8be;font-size:0.92rem;">${mapData.focus_reasoning}</p>
        </div>

        ${mapData.brain_insight ? `
        <div class="profile-section">
          <div class="profile-section-label">What To Learn</div>
          <p style="color:#c8d8e8;font-size:0.92rem;">${mapData.brain_insight}</p>
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
