import { useState, useEffect } from "react";

// ============================================================
// STORAGE LAYER
// Currently: localStorage. Supabase swap: replace loadData +
// saveData only — nothing else in this file needs to change.
//
//   import { supabase } from "./supabaseClient"
//
//   async function loadData() {
//     const { data } = await supabase
//       .from('pulse_entries').select('*')
//       .order('created_at', { ascending: true });
//     return data || emptyData();
//   }
//   async function saveData(payload) {
//     await supabase.from('pulse_entries').upsert(payload);
//     return true;
//   }
// ============================================================

const STORAGE_KEY = "life_os_pulse_v3";

function emptyData() {
  return { daily: [], weekly: [], monthly: [], quarterly: [], yearly: [] };
}

async function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...emptyData(), ...JSON.parse(raw) } : emptyData();
  } catch { return emptyData(); }
}

async function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch { return false; }
}

// ============================================================
// DESIGN TOKENS
// ============================================================

const T = {
  gold:         "#C8922A",   // matched to logo gold — warm, rich
  goldMid:      "#B8821A",
  goldFaint:    "rgba(200,146,42,0.10)",
  goldBorder:   "rgba(200,146,42,0.25)",
  goldBorderHi: "rgba(200,146,42,0.55)",
  bg:           "#FAFAF7",
  text:         "#0F1523",   // near-black dark blue — matches indigo
  textBody:     "#2A2A2A",
  textMeta:     "#6B6B6B",
  card:         "#FFFFFF",
  indigo:       "#0F1523",   // near-black dark blue — primary text + title
  indigoMid:    "#1C2340",   // slightly lighter for secondary uses
  blue:         "#3B6B9E",   // 8–10 Exemplar → World-Class
  blueLight:    "#5A8AB8",
  bluePale:     "#7AA4CC",
  stone:        "#8A8070",
  amber:        "#8A7030",
  red:          "#8A3030",
  fontDisplay:  "'Cormorant Garamond', Georgia, serif",
  fontBody:     "Georgia, serif",
};

// ============================================================
// DATA CONSTANTS
// ============================================================

const DOMAINS = [
  { key: "path",          label: "Path",          description: "Your calling, contribution & the work you're here to do" },
  { key: "spark",         label: "Spark",         description: "The animating fire — aliveness, joy, play & the godspark" },
  { key: "body",          label: "Body",           description: "Physical vitality, health, energy & embodiment" },
  { key: "finances",      label: "Finances",       description: "Your relationship with money, resources & abundance" },
  { key: "relationships", label: "Relationships",  description: "Intimacy, friendship, community & belonging" },
  { key: "innergame",     label: "Inner Game",     description: "Your relationship with yourself — beliefs, values & self-trust" },
  { key: "outergame",     label: "Outer Game",     description: "How you show up in the world — presence, expression & public identity" },
];

// Integer 0–10 anchors for daily heat check
const HEAT_BANDS = [
  { min: 9, max: 10, color: T.blue,      label: "Exemplar" },
  { min: 7, max: 8,  color: T.blueLight, label: "Fluent" },
  { min: 5, max: 6,  color: T.stone,     label: "Functional" },
  { min: 3, max: 4,  color: T.amber,     label: "Friction" },
  { min: 0, max: 2,  color: T.red,       label: "Crisis" },
];

// Half-point weekly scale
const HORIZON_SCALE = [
  { value: 10,  tier: "World-Class",  label: "Complete coherence",       description: "Effortless mastery. Luminous presence. Contribution that uplifts everyone around you." },
  { value: 9.5, tier: "Exemplar+",   label: "Integrated and at ease",   description: "Leading by example without effort. Influence radiates naturally." },
  { value: 9,   tier: "Exemplar",    label: "Excellence feels natural",  description: "Deeply skilled, balanced, reliable. You are not striving — you are expressing." },
  { value: 8.5, tier: "Fluent+",     label: "Competence meets wisdom",   description: "Solid and growing. Skill and perspective both present. Depth is increasing." },
  { value: 8,   tier: "Fluent",      label: "Steady and grounded",       description: "Strong foundations. Consistent excellence. Self-aware and calm under pressure." },
  { value: 7.5, tier: "Capable+",    label: "Building confidence",       description: "Clear progress. Deliberate practice paying off. You can feel the momentum." },
  { value: 7,   tier: "Capable",     label: "Dependable and engaged",    description: "Showing up reliably. Purposeful. Contributing well." },
  { value: 6.5, tier: "Functional+", label: "Rebuilding rhythm",         description: "Mostly consistent. Habits stabilising. Moving in the right direction." },
  { value: 6,   tier: "Functional",  label: "Managing the basics",       description: "Holding it together. Responsible and competent. Sometimes fatigued." },
  { value: 5.5, tier: "Plateau+",    label: "Something stirring",        description: "Curiosity returning. Not quite moving yet, but the stillness is ending." },
  { value: 5,   tier: "Plateau",     label: "Holding steady",            description: "Maintaining without expanding. Uninspired but not in pain. The viability threshold." },
  { value: 4.5, tier: "Friction+",   label: "Awareness of stuckness",    description: "Restless. You can feel that something needs to change. Not yet moving." },
  { value: 4,   tier: "Friction",    label: "Stuck but willing",         description: "Desire present, momentum low. Self-judgment softening into openness." },
  { value: 3.5, tier: "Strain+",     label: "Fatigue and doubt",         description: "Inconsistent. Overwhelmed at times. Starting to see the pattern you're in." },
  { value: 3,   tier: "Strain",      label: "Contracted",                description: "Energy collapsed inward. Fear or shame present. Rest, not force, is what's needed." },
  { value: 2.5, tier: "Crisis+",     label: "Holding on",                description: "High stress, low support. Survival instincts active. One day at a time." },
  { value: 2,   tier: "Crisis",      label: "Depleted",                  description: "Basics unmet. Clarity lost. Exhaustion or anxiety is chronic." },
  { value: 1.5, tier: "Emergency+",  label: "Deep pain or numb",         description: "Alternating between intensity and shutdown. Not okay, and that is real." },
  { value: 1,   tier: "Emergency",   label: "Disconnected",              description: "Spiritually or emotionally collapsed. The light has dimmed. Support is needed." },
  { value: 0,   tier: "Ground Zero", label: "Complete reset",            description: "End of a cycle. Everything cleared. Stillness before what comes next." },
];

const SCALE_BANDS = [
  { label: "Exemplar → World-Class", range: "8 – 10",    color: T.blue,      dividerAfter: false },
  { label: "Capable → Fluent",       range: "6.5 – 7.5", color: T.blueLight, dividerAfter: false },
  { label: "Functional → Plateau",   range: "5 – 6",     color: T.stone,     dividerAfter: true  },
  { label: "Friction → Strain",      range: "3 – 4.5",   color: T.amber,     dividerAfter: false },
  { label: "Crisis → Ground Zero",   range: "0 – 2.5",   color: T.red,       dividerAfter: false },
];

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_FULL  = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const QUARTER_MONTHS = [[0,1,2],[3,4,5],[6,7,8],[9,10,11]];

// ============================================================
// DATE / CADENCE HELPERS
// ============================================================

function getLocalDateStr(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function getWeekId(date = new Date()) {
  // ISO week starting Monday; label uses Sun–Sat display
  const d = new Date(date);
  d.setHours(0,0,0,0);
  const day = d.getDay(); // 0=Sun
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((day + 6) % 7));
  return getLocalDateStr(mon);
}

function getWeekRange(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const sun = new Date(d); sun.setDate(d.getDate() - day);
  const sat = new Date(sun); sat.setDate(sun.getDate() + 6);
  const fmt = (dt) => `${MONTH_NAMES[dt.getMonth()]} ${dt.getDate()}`;
  return `${fmt(sun)}–${fmt(sat)}`;
}

function getMonthId(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
}

function getQuarterId(date = new Date()) {
  const q = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()}-Q${q}`;
}

function getYearId(date = new Date()) {
  return String(date.getFullYear());
}

// Weekly pulse: unlocks Sunday 5am, grace Mon–Tue 11:59pm
function getWeeklyPulseStatus(date = new Date()) {
  const day = date.getDay(); // 0=Sun
  const hour = date.getHours();

  if (day === 0 && hour >= 5) return "available";   // Sun after 5am
  if (day === 1) return "available";                 // Monday
  if (day === 2) return "available";                 // Tuesday
  if (day === 3 || day === 4 || day === 5) return "locked_early"; // Wed–Fri
  if (day === 6) return "locked_early";              // Saturday
  if (day === 0 && hour < 5) return "locked_early";  // Sun before 5am
  return "locked_early";
}

function getWeeklyUnlockCountdown(date = new Date()) {
  const day = date.getDay();
  const daysUntilSun = (7 - day) % 7 || 7;
  const nextSun = new Date(date);
  nextSun.setDate(date.getDate() + (day === 0 ? 7 : daysUntilSun));
  nextSun.setHours(5, 0, 0, 0);
  if (day === 0 && date.getHours() < 5) {
    nextSun.setDate(date.getDate());
  }
  const diff = nextSun - date;
  const hours = Math.floor(diff / 3600000);
  const mins  = Math.floor((diff % 3600000) / 60000);
  if (hours > 48) return `Sunday at 5:00 a.m.`;
  if (hours > 0)  return `in ${hours}h ${mins}m`;
  return `in ${mins}m`;
}

// Monthly: last Sunday of month at 5am, grace first 3 days of next month
function getMonthlyPulseStatus(date = new Date()) {
  const y = date.getFullYear(), m = date.getMonth();
  const lastDayOfMonth = new Date(y, m+1, 0);
  const lastSunday = new Date(lastDayOfMonth);
  lastSunday.setDate(lastDayOfMonth.getDate() - lastDayOfMonth.getDay());
  lastSunday.setHours(5, 0, 0, 0);

  const graceEnd = new Date(y, m+1, 3, 23, 59, 59);
  if (date >= lastSunday && date <= graceEnd) return "available";
  if (date > graceEnd) return "closed";
  return "locked_early";
}

// Quarterly: last Sunday of quarter at 5am, grace first 7 days
function getQuarterlyPulseStatus(date = new Date()) {
  const q = Math.floor(date.getMonth() / 3);
  const lastMonthOfQ = QUARTER_MONTHS[q][2];
  const lastDayOfQ = new Date(date.getFullYear(), lastMonthOfQ+1, 0);
  const lastSunday = new Date(lastDayOfQ);
  lastSunday.setDate(lastDayOfQ.getDate() - lastDayOfQ.getDay());
  lastSunday.setHours(5, 0, 0, 0);
  const graceEnd = new Date(date.getFullYear(), lastMonthOfQ+1, 7, 23, 59, 59);
  if (date >= lastSunday && date <= graceEnd) return "available";
  if (date > graceEnd) return "closed";
  return "locked_early";
}

// Yearly: last Sunday of year at 5am, grace through Jan 7
function getYearlyPulseStatus(date = new Date()) {
  const y = date.getFullYear();
  const dec31 = new Date(y, 11, 31);
  const lastSunday = new Date(dec31);
  lastSunday.setDate(dec31.getDate() - dec31.getDay());
  lastSunday.setHours(5, 0, 0, 0);
  const graceEnd = new Date(y+1, 0, 7, 23, 59, 59);
  if (date >= lastSunday && date <= graceEnd) return "available";
  if (date > graceEnd) return "closed";
  return "locked_early";
}

// ============================================================
// HELPERS
// ============================================================

function getTierColor(value) {
  if (value == null) return T.textMeta;
  if (value >= 8)   return T.blue;
  if (value >= 6.5) return T.blueLight;
  if (value >= 5)   return T.stone;
  if (value >= 3)   return T.amber;
  return T.red;
}

function getHeatColor(n) {
  if (n >= 9) return T.blue;
  if (n >= 7) return T.blueLight;
  if (n >= 5) return T.stone;
  if (n >= 3) return T.amber;
  return T.red;
}

function getScaleEntry(value) {
  if (value == null) return null;
  const rounded = Math.round(value * 2) / 2;
  return HORIZON_SCALE.find(s => s.value === rounded) || HORIZON_SCALE[HORIZON_SCALE.length - 1];
}

function calcAvg(scores) {
  const vals = Object.values(scores).filter(v => v != null && v !== undefined);
  if (!vals.length) return null;
  return parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
}

function formatDate(iso) {
  const d = new Date(iso);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function getInsights(weeklyHistory) {
  if (weeklyHistory.length < 2) return [];
  const insights = [];
  DOMAINS.forEach(d => {
    const recent = weeklyHistory.slice(-3).map(h => h.scores?.[d.key]).filter(s => s != null);
    if (recent.length >= 2) {
      const allLow   = recent.every(s => s <= 4);
      const dropping = recent[recent.length-1] < recent[0] - 1;
      const rising   = recent[recent.length-1] > recent[0] + 1;
      if (allLow)        insights.push({ type: "persistent", domain: d.label, message: `${d.label} has been in Friction or below for ${recent.length} consecutive check-ins.` });
      else if (dropping) insights.push({ type: "declining",  domain: d.label, message: `${d.label} has been declining across your recent check-ins.` });
      else if (rising)   insights.push({ type: "rising",     domain: d.label, message: `${d.label} is showing consistent upward movement. Something is working.` });
    }
  });
  return insights;
}

// Daily pulses this week
function getDailyThisWeek(dailyHistory, date = new Date()) {
  const weekId = getWeekId(date);
  return (dailyHistory || []).filter(e => e.weekId === weekId);
}

// Today's daily pulse if exists
function getTodaysPulse(dailyHistory, date = new Date()) {
  const today = getLocalDateStr(date);
  return (dailyHistory || []).find(e => e.localDate === today) || null;
}

// ============================================================
// AI AGENT
// ============================================================

async function callAgent(systemPrompt, userMessage) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const data = await response.json();
  return data.content[0].text;
}

const AGENT_SYSTEM = `You are the reflection agent for Life OS: Pulse — a personal development tool built on the Horizon Scale.

THE HORIZON SCALE
0–4.5: Deficit Zone — the system draws stability from surrounding systems. Needs restoration.
5–7.5: Viable Zone — the system maintains itself and participates in life.
8–10: Surplus Zone — the system produces more stability than it consumes.

5 is the viability threshold. Below it, important parts of life begin to suffer.

THE SEVEN DOMAINS
Path · Spark · Body · Finances · Relationships · Inner Game · Outer Game

KEY COUPLINGS
Inner Game → Path: when self-trust builds, purposeful action follows
Body declining → leading indicator for systemic strain
Finances ↔ Path: large gap = common source of chronic friction
Spark low despite stable domains: functioning but not living

YOUR VOICE
Senior practitioner. Warm but not familiar. Precise but not clinical.
Witness, don't fix. Notice, don't prescribe.
Flat, low, matter-of-fact delivery. Devoted through steadiness.
Never: "you should", "you need to", "incredible", "I can see"
Never: diagnose, pathologise, catastrophise low scores
Always: name what the data shows, hold low scores without alarm

RESPONSE LENGTH
Weekly: 100–180 words. One question or observation at the end.
Monthly: 180–280 words. One question or observation at the end.
Quarterly: 200–320 words. One orienting observation at the end.
Annual: 280–400 words. One horizon question at the end.`;

function buildWeeklyPrompt(weeklyEntry, dailyThisWeek, previousWeekly) {
  const avg = calcAvg(weeklyEntry.scores);
  const domainLines = DOMAINS.map(d => {
    const s = weeklyEntry.scores[d.key];
    const note = weeklyEntry.sayMore?.[d.key];
    return `${d.label}: ${s} (${getScaleEntry(s)?.tier})${note ? ` — "${note}"` : ""}`;
  }).join("\n");

  const dailyLines = dailyThisWeek.length
    ? dailyThisWeek.map(e => {
        const ds = DOMAINS.map(d => `${d.label} ${e.scores?.[d.key] ?? "—"}`).join(", ");
        return `${e.localDate} — ${ds}${e.note ? ` — "${e.note}"` : ""}`;
      }).join("\n")
    : "No daily check-ins this week.";

  const historyLines = previousWeekly.slice(-2).map(h => {
    const a = calcAvg(h.scores);
    return `${h.weekLabel || h.weekId}: avg ${a}`;
  }).join("\n") || "No previous history.";

  return `WEEKLY PULSE — ${weeklyEntry.weekLabel || weeklyEntry.weekId}
Overall: ${avg} (${getScaleEntry(avg)?.tier})

DOMAIN SCORES:
${domainLines}

DAILY CHECK-INS THIS WEEK (${dailyThisWeek.length}):
${dailyLines}

PREVIOUS WEEKS:
${historyLines}

${weeklyEntry.reflection ? `REFLECTION: "${weeklyEntry.reflection}"` : ""}
${weeklyEntry.focusDomain ? `FOCUS DOMAIN: ${DOMAINS.find(d=>d.key===weeklyEntry.focusDomain)?.label}` : ""}

Generate a weekly synthesis. Name what the data shows — domain patterns, movement since last week, any notable daily patterns. Hold low scores without alarm. End with one question or observation.`;
}

function buildMonthlyPrompt(monthlyData, weeklyThisMonth, dailyThisMonth) {
  const domainTrends = DOMAINS.map(d => {
    const vals = weeklyThisMonth.map(h => h.scores?.[d.key]).filter(v => v != null);
    const first = vals[0], last = vals[vals.length-1];
    const delta = first != null && last != null ? (last - first).toFixed(1) : "n/a";
    return `${d.label}: ${vals.join(" → ")} (Δ ${delta})`;
  }).join("\n");

  const notes = dailyThisMonth.filter(e => e.note).map(e => `${e.localDate}: "${e.note}"`).join("\n") || "None.";

  return `MONTHLY PULSE — ${monthlyData.monthLabel}
Weekly check-ins: ${weeklyThisMonth.length} | Daily check-ins: ${dailyThisMonth.length}

DOMAIN MOVEMENT:
${domainTrends}

DAILY NOTES:
${notes}

${monthlyData.reflection ? `REFLECTION: "${monthlyData.reflection}"` : ""}

Generate a monthly reflection. What is shifting, what is holding, what patterns are visible across the month. Note domain correlations. If any domain has been persistently below 5, name it. End with one question.`;
}

// ============================================================
// CSS
// ============================================================

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #FAFAF7; color: #1A1A1A; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(200,146,42,0.35); border-radius: 2px; }
  textarea { resize: vertical; }
  ::placeholder { color: #BBAB90; font-style: italic; }
`;

// ============================================================
// SHARED COMPONENTS
// ============================================================

function SectionLabel({ children }) {
  return <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: T.gold, marginBottom: "12px", fontFamily: T.fontBody, fontWeight: "600" }}>{children}</div>;
}

function Divider({ margin = "28px 0" }) {
  return <div style={{ borderBottom: "1px solid rgba(200,146,42,0.3)", margin }} />;
}

function InsightCard({ insight }) {
  const isRising = insight.type === "rising";
  return (
    <div style={{ padding: "13px 16px", marginBottom: "8px", borderLeft: `3px solid ${isRising ? T.blue : T.amber}`, background: isRising ? "rgba(59,107,158,0.05)" : "rgba(138,112,48,0.05)", borderRadius: "0 6px 6px 0" }}>
      <p style={{ margin: 0, fontSize: "13px", color: isRising ? T.blue : T.amber, fontStyle: "italic", lineHeight: 1.6 }}>{insight.message}</p>
    </div>
  );
}

function AgentReflection({ text, loading, error }) {
  if (loading) return (
    <div style={{ padding: "24px", border: `1px solid ${T.goldBorder}`, borderRadius: "10px", background: T.card, textAlign: "center" }}>
      <div style={{ color: T.gold, fontFamily: T.fontDisplay, fontSize: "16px", fontStyle: "italic" }}>Reading your map...</div>
    </div>
  );
  if (error) return (
    <div style={{ padding: "16px", border: "1px solid rgba(138,112,48,0.2)", borderRadius: "10px", background: "rgba(138,112,48,0.04)" }}>
      <p style={{ color: T.amber, fontSize: "13px", margin: 0 }}>{error}</p>
    </div>
  );
  if (!text) return null;
  return (
    <div style={{ padding: "22px 24px", border: `1px solid ${T.goldBorderHi}`, borderRadius: "10px", background: T.card, borderLeft: `3px solid ${T.gold}`, boxShadow: "0 2px 8px rgba(200,146,42,0.08)" }}>
      <SectionLabel>YOUR REFLECTION</SectionLabel>
      <p style={{ margin: 0, fontSize: "15px", color: T.textBody, fontFamily: T.fontDisplay, fontStyle: "italic", lineHeight: 1.8 }}>{text}</p>
    </div>
  );
}

// ============================================================
// PULSE WHEEL — tappable domain labels open a popup card
// ============================================================

function PulseWheel({ scores, size = 320, hideLabels = false }) {
  const cx = size / 2, cy = size / 2, maxR = size * 0.37, n = DOMAINS.length;

  const getPoint = (i, s) => {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2;
    const r = maxR * ((s ?? 5) / 10);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };
  const getLabelPoint = (i) => {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + maxR * 1.28 * Math.cos(a), y: cy + maxR * 1.28 * Math.sin(a) };
  };
  const polygonPoints = DOMAINS.map((d, i) => {
    const p = getPoint(i, scores[d.key] ?? 5);
    return `${p.x},${p.y}`;
  }).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      {/* Grid rings — gossamer thin */}
      {[2,4,6,8,10].map(r => {
        const pts = DOMAINS.map((_, i) => {
          const a = (i/n)*2*Math.PI - Math.PI/2;
          const rad = maxR*(r/10);
          return `${cx+rad*Math.cos(a)},${cy+rad*Math.sin(a)}`;
        }).join(" ");
        return <polygon key={r} points={pts} fill="none" stroke="rgba(200,146,42,0.15)" strokeWidth="0.5" />;
      })}
      {/* Spokes — gossamer thin */}
      {DOMAINS.map((_, i) => {
        const a = (i/n)*2*Math.PI - Math.PI/2;
        return <line key={i} x1={cx} y1={cy} x2={cx+maxR*Math.cos(a)} y2={cy+maxR*Math.sin(a)} stroke="rgba(200,146,42,0.15)" strokeWidth="0.5" />;
      })}
      {/* Glow layer */}
      <polygon points={polygonPoints} fill="none" stroke="rgba(200,146,42,0.1)" strokeWidth="4" strokeLinejoin="round" />
      {/* Shape — delicate gold */}
      <polygon points={polygonPoints} fill="rgba(200,146,42,0.06)" stroke="#C8922A" strokeWidth="0.75" strokeLinejoin="round" style={{ transition: "all 0.4s ease", filter: "drop-shadow(0 0 3px rgba(200,146,42,0.35))" }} />
      {/* Score dots — warm gold */}
      {DOMAINS.map((d, i) => {
        const s = scores[d.key] ?? 5;
        const p = getPoint(i, s);
        return <circle key={d.key} cx={p.x} cy={p.y} r={3.5} fill="#C8922A" stroke={T.bg} strokeWidth="1.5" />;
      })}
      {/* Labels */}
      {DOMAINS.map((d, i) => {
        const lp = getLabelPoint(i);
        const s  = scores[d.key] ?? 5;
        return (
          <g key={d.key}>
            <text x={lp.x} y={lp.y - 7} textAnchor="middle" fill="#0F1523" fontSize="11" fontFamily={T.fontDisplay} fontWeight="600">{d.label}</text>
            {!hideLabels && (
              <text x={lp.x} y={lp.y + 7} textAnchor="middle" fill={getTierColor(s)} fontSize="9.5" fontFamily={T.fontBody} opacity="0.85">{getScaleEntry(s)?.tier}</text>
            )}
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={2.5} fill="rgba(200,146,42,0.25)" />
    </svg>
  );
}

// ============================================================
// DAILY HEAT CHECK — number tap with colour band guide
// ============================================================

// ============================================================
// HOURGLASS PICKER — vertical stack, width tapers to 5, expands back
// ============================================================

function HourglassPicker({ domain, onSelect }) {
  const numbers = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
  const minW = 38, maxW = 100;
  const getWidth = (n) => {
    const pct = Math.pow((n - 5) / 5, 2);
    return Math.round(minW + (maxW - minW) * pct);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: T.fontDisplay, fontSize: "13px", color: T.textMeta, fontStyle: "italic", marginBottom: "16px" }}>
        {domain.description}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
        {numbers.map(n => {
          const col = getHeatColor(n);
          const w = getWidth(n);
          const isThreshold = n === 5;
          return (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: "16px", width: "100%" }}>
              {/* left number — more space */}
              <div style={{ width: "36px", textAlign: "right", fontSize: "12px", color: isThreshold ? T.gold : T.textMeta, fontWeight: isThreshold ? "700" : "400", fontFamily: T.fontDisplay, flexShrink: 0 }}>
                {n}
              </div>
              {/* button with hairline stubs only visible outside */}
              <div style={{ flex: 1, display: "flex", justifyContent: "center", position: "relative", alignItems: "center" }}>
                {/* left stub */}
                <div style={{ position: "absolute", top: "50%", left: 0, width: `calc((100% - ${w}%) / 2 - 1px)`, height: "1px", background: "rgba(0,0,0,0.08)", transform: "translateY(-50%)", pointerEvents: "none" }} />
                {/* right stub */}
                <div style={{ position: "absolute", top: "50%", right: 0, width: `calc((100% - ${w}%) / 2 - 1px)`, height: "1px", background: "rgba(0,0,0,0.08)", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <button
                  onClick={() => onSelect(n)}
                  style={{
                    width: `${w}%`,
                    height: "28px",
                    background: `${col}20`,
                    border: `1px solid ${col}44`,
                    borderRadius: "3px",
                    cursor: "pointer",
                    transition: "all 0.1s",
                    outline: "none",
                    position: "relative",
                    zIndex: 1,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = col;
                    e.currentTarget.style.borderColor = col;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = `${col}20`;
                    e.currentTarget.style.borderColor = `${col}44`;
                  }}
                />
              </div>
              {/* right tier label — more space */}
              <div style={{ width: "80px", fontSize: "10px", color: isThreshold ? T.gold : col, letterSpacing: "0.06em", flexShrink: 0, fontWeight: isThreshold ? "600" : "400" }}>
                {n === 10 ? "World-Class" :
                 n === 9  ? "Exemplar" :
                 n === 8  ? "Fluent" :
                 n === 7  ? "Capable" :
                 n === 6  ? "Functional" :
                 n === 5  ? "— Threshold" :
                 n === 4  ? "Friction" :
                 n === 3  ? "Strain" :
                 n === 2  ? "Crisis" :
                 n === 1  ? "Emergency" :
                            "Ground Zero"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Weekly rhythm dots
function WeekDots({ count, total = 7 }) {
  return (
    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: "8px", height: "8px", borderRadius: "50%",
          background: i < count ? T.gold : "rgba(200,146,42,0.2)",
          transition: "background 0.2s"
        }} />
      ))}
    </div>
  );
}

// ============================================================
// DAILY CHECK-IN VIEW — one domain at a time, hourglass picker
// ============================================================

function DailyCheckIn({ existing, onSave, onClose }) {
  const initScores = existing?.scores || Object.fromEntries(DOMAINS.map(d => [d.key, null]));
  const [scores, setScores]       = useState(initScores);
  const [activeDomain, setActiveDomain] = useState(
    // Start on first unscored domain, or 0 if all scored (edit mode)
    existing ? 0 : 0
  );
  const [note, setNote]           = useState(existing?.note || "");
  const [saving, setSaving]       = useState(false);
  const [showNote, setShowNote]   = useState(false);

  const scoredCount = DOMAINS.filter(d => scores[d.key] !== null).length;
  const allScored   = scoredCount === DOMAINS.length;
  const avg         = allScored ? calcAvg(Object.fromEntries(DOMAINS.map(d => [d.key, scores[d.key]]))) : null;

  function handleSelect(n) {
    const key = DOMAINS[activeDomain].key;
    const newScores = { ...scores, [key]: n };
    setScores(newScores);

    // Auto-advance to next unscored domain
    const nextUnscoredIdx = DOMAINS.findIndex((d, i) => i > activeDomain && newScores[d.key] === null);
    if (nextUnscoredIdx !== -1) {
      setActiveDomain(nextUnscoredIdx);
    } else {
      // All scored — show note step
      const allDone = DOMAINS.every(d => newScores[d.key] !== null);
      if (allDone) setShowNote(true);
    }
  }

  async function handleSave() {
    setSaving(true);
    const now = new Date();
    await onSave({
      localDate: getLocalDateStr(now),
      weekId:    getWeekId(now),
      monthId:   getMonthId(now),
      quarterId: getQuarterId(now),
      yearId:    getYearId(now),
      timestamp: now.toISOString(),
      scores,
      note,
    });
    setSaving(false);
  }

  const isEdit = !!existing;
  const currentDomain = DOMAINS[activeDomain];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
        <button onClick={onClose} style={{ background: "none", border: `1px solid ${T.goldBorder}`, color: T.textMeta, padding: "7px 14px", borderRadius: "4px", cursor: "pointer", fontFamily: T.fontBody, fontSize: "10px", letterSpacing: "0.12em" }}>← BACK</button>
        <div>
          <div style={{ fontFamily: T.fontDisplay, fontSize: "26px", color: T.text, fontWeight: "400" }}>
            {isEdit ? "Update Today's Pulse" : "Check Your Pulse"}
          </div>
          <div style={{ fontSize: "11px", color: T.textMeta, fontStyle: "italic", marginTop: "2px" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: "10px", color: T.gold, letterSpacing: "0.12em", fontWeight: "600" }}>{scoredCount} OF 7</span>
        {avg && <span style={{ fontFamily: T.fontDisplay, fontSize: "14px", color: getTierColor(avg), fontWeight: "600" }}>{avg} · {getScaleEntry(avg)?.tier}</span>}
      </div>
      <div style={{ height: "2px", background: "rgba(200,146,42,0.15)", borderRadius: "1px", marginBottom: "28px" }}>
        <div style={{ height: "100%", width: `${(scoredCount/7)*100}%`, background: T.gold, borderRadius: "1px", transition: "width 0.3s" }} />
      </div>

      {!showNote ? (
        <>
          {/* Live wheel — updates as you score */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
            <PulseWheel scores={Object.fromEntries(DOMAINS.map(d => [d.key, scores[d.key] ?? 5]))} size={260} />
          </div>

          {/* Domain tab strip */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "28px", flexWrap: "wrap" }}>
            {DOMAINS.map((d, i) => {
              const s = scores[d.key];
              const isActive = i === activeDomain;
              const isScored = s !== null;
              return (
                <button key={d.key} onClick={() => setActiveDomain(i)}
                  style={{
                    padding: "7px 12px", borderRadius: "6px", cursor: "pointer",
                    fontFamily: T.fontDisplay, fontSize: "13px", fontWeight: isActive ? "600" : "400",
                    border: isActive ? `1px solid ${T.goldBorderHi}` : `1px solid ${T.goldBorder}`,
                    background: isActive ? "rgba(200,146,42,0.1)" : T.card,
                    color: isScored ? getTierColor(s) : isActive ? T.text : T.textMeta,
                    transition: "all 0.15s",
                  }}>
                  {d.label}{isScored ? ` · ${s}` : ""}
                </button>
              );
            })}
          </div>

          {/* Active domain card */}
          <div style={{ padding: "24px 20px 28px", background: T.card, border: `1px solid ${T.goldBorderHi}`, borderRadius: "12px", boxShadow: "0 2px 8px rgba(200,146,42,0.08)" }}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{ fontFamily: T.fontDisplay, fontSize: "28px", fontWeight: "600", color: T.text, marginBottom: "2px" }}>
                {currentDomain.label}
              </div>
              <div style={{ fontSize: "12px", color: T.textMeta, fontStyle: "italic", marginBottom: "4px", fontFamily: T.fontDisplay }}>
                {currentDomain.description}
              </div>
              <div style={{ fontSize: "11px", color: T.textMeta, letterSpacing: "0.04em" }}>
                0 = serious trouble &nbsp;·&nbsp; 10 = couldn't be better
              </div>
              {scores[currentDomain.key] !== null && (
                <div style={{ fontFamily: T.fontDisplay, fontSize: "16px", color: getTierColor(scores[currentDomain.key]), fontWeight: "500", marginTop: "6px" }}>
                  {scores[currentDomain.key]} · {getScaleEntry(scores[currentDomain.key])?.tier}
                </div>
              )}
            </div>
            <HourglassPicker domain={currentDomain} onSelect={handleSelect} />
          </div>

          {/* If all scored but user is reviewing — show continue */}
          {allScored && (
            <button onClick={() => setShowNote(true)} style={{ ...{width: "100%", padding: "18px", background: T.gold, border: "none", color: "#FFFFFF", borderRadius: "8px", cursor: "pointer", fontFamily: T.fontDisplay, fontSize: "19px", fontWeight: "500", letterSpacing: "0.06em"}, marginTop: "20px" }}>
              Continue →
            </button>
          )}
        </>
      ) : (
        /* Note + save step */
        <div>
          {/* Live wheel — stays visible on summary step */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
            <PulseWheel scores={Object.fromEntries(DOMAINS.map(d => [d.key, scores[d.key] ?? 5]))} size={240} />
          </div>
          {/* Mini summary */}
          <div style={{ padding: "20px", background: T.card, border: `1px solid ${T.goldBorder}`, borderRadius: "12px", marginBottom: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <SectionLabel>TODAY'S SCORES</SectionLabel>
              <button onClick={() => setShowNote(false)} style={{ background: "none", border: "none", color: T.gold, fontSize: "10px", cursor: "pointer", fontFamily: T.fontBody, letterSpacing: "0.12em" }}>ADJUST →</button>
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {DOMAINS.map(d => (
                <div key={d.key} style={{ padding: "6px 10px", background: `${getTierColor(scores[d.key])}18`, borderRadius: "5px", border: `1px solid ${getTierColor(scores[d.key])}44` }}>
                  <div style={{ fontSize: "10px", color: T.textMeta }}>{d.label}</div>
                  <div style={{ fontFamily: T.fontDisplay, fontSize: "18px", fontWeight: "700", color: getTierColor(scores[d.key]), lineHeight: 1 }}>{scores[d.key]}</div>
                </div>
              ))}
            </div>
            {avg && (
              <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(200,146,42,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: T.textMeta }}>Overall</span>
                <span style={{ fontFamily: T.fontDisplay, fontSize: "22px", fontWeight: "700", color: getTierColor(avg) }}>{avg} · {getScaleEntry(avg)?.tier}</span>
              </div>
            )}
          </div>

          <div style={{ marginBottom: "28px" }}>
            <SectionLabel>A NOTE FROM TODAY (optional)</SectionLabel>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} maxLength={80}
              placeholder="a few words from today..."
              style={{ width: "100%", background: T.card, border: `1px solid ${T.goldBorder}`, borderRadius: "8px", color: T.text, fontFamily: T.fontDisplay, fontSize: "15px", fontStyle: "italic", padding: "13px 16px", outline: "none" }}
              onFocus={e => e.currentTarget.style.borderColor = T.goldBorderHi}
              onBlur={e => e.currentTarget.style.borderColor = T.goldBorder} />
          </div>

          <button onClick={handleSave} disabled={saving}
            style={{ width: "100%", padding: "18px", background: T.gold, border: "none", color: "#FFFFFF", borderRadius: "8px", cursor: saving ? "wait" : "pointer", fontFamily: T.fontDisplay, fontSize: "19px", fontWeight: "500", letterSpacing: "0.06em" }}>
            {saving ? "Saving..." : isEdit ? "Update Pulse" : "Log your Pulse for the day"}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// WEEKLY PULSE PICKER (expandable)
// ============================================================

function HorizonScalePicker({ domain, value, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const selected = getScaleEntry(value);
  return (
    <div style={{ marginBottom: "12px", border: `1px solid ${expanded ? T.goldBorderHi : T.goldBorder}`, borderRadius: "10px", overflow: "hidden", background: T.card, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", position: "relative" }}>
      <div onClick={() => setExpanded(!expanded)} style={{ padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ fontFamily: T.fontDisplay, fontSize: "19px", fontWeight: "600", color: T.text }}>{domain.label}</div>
            <button
              onClick={e => { e.stopPropagation(); setShowInfo(!showInfo); }}
              style={{ width: "20px", height: "20px", borderRadius: "50%", border: `1.5px solid ${showInfo ? T.indigo : T.gold}`, background: showInfo ? T.indigo : "transparent", color: showInfo ? "#FFF" : T.gold, fontSize: "11px", fontWeight: "600", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", transition: "all 0.15s", lineHeight: 1 }}>
              i
            </button>
          </div>
          <div style={{ fontSize: "11px", color: T.textMeta, fontStyle: "italic", marginTop: "3px" }}>{domain.description}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {value !== null ? (
            <>
              <div style={{ fontFamily: T.fontDisplay, fontSize: "28px", fontWeight: "700", color: getTierColor(value), lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: "10px", color: getTierColor(value), opacity: 0.85, marginTop: "2px" }}>{selected?.tier}</div>
            </>
          ) : <div style={{ fontSize: "11px", color: T.textMeta, fontStyle: "italic" }}>tap to assess</div>}
        </div>
      </div>

      {/* Domain info popup */}
      {showInfo && (
        <div onClick={e => e.stopPropagation()}
          style={{ margin: "0 16px 14px", padding: "14px 16px", background: `rgba(45,53,97,0.04)`, border: `1px solid rgba(45,53,97,0.15)`, borderLeft: `3px solid ${T.indigo}`, borderRadius: "8px" }}>
          <div style={{ fontFamily: T.fontDisplay, fontSize: "15px", fontWeight: "600", color: T.indigo, marginBottom: "6px" }}>{domain.label}</div>
          <div style={{ fontSize: "12px", color: T.textBody, lineHeight: 1.7, fontFamily: T.fontDisplay, fontStyle: "italic" }}>{domain.description}</div>
          <button onClick={() => setShowInfo(false)} style={{ marginTop: "10px", background: "none", border: "none", color: T.indigo, fontSize: "9px", cursor: "pointer", padding: 0, fontFamily: T.fontBody, letterSpacing: "0.14em", opacity: 0.7 }}>CLOSE ×</button>
        </div>
      )}
      {value !== null && !expanded && (
        <div style={{ padding: "0 20px 14px", borderTop: "1px solid rgba(200,146,42,0.15)" }}>
          <p style={{ fontSize: "12px", color: T.textMeta, fontStyle: "italic", lineHeight: 1.6, margin: 0 }}>"{selected?.description}"</p>
          <button onClick={e => { e.stopPropagation(); setExpanded(true); }} style={{ marginTop: "8px", background: "none", border: "none", color: T.gold, fontSize: "10px", cursor: "pointer", padding: 0, fontFamily: T.fontBody, letterSpacing: "0.12em" }}>CHANGE →</button>
        </div>
      )}
      {expanded && (
        <div style={{ borderTop: "1px solid rgba(200,146,42,0.15)", maxHeight: "400px", overflowY: "auto" }}>
          <div style={{ padding: "10px 16px 6px", fontSize: "9px", color: T.textMeta, letterSpacing: "0.18em" }}>READ EACH LEVEL — SELECT WHERE YOU RECOGNISE YOURSELF</div>
          {HORIZON_SCALE.map(entry => {
            const isSel = value === entry.value;
            return (
              <div key={entry.value} onClick={() => { onChange(entry.value); setExpanded(false); }}
                style={{ padding: "11px 16px", cursor: "pointer", borderBottom: "1px solid rgba(200,146,42,0.1)", background: isSel ? "rgba(200,146,42,0.08)" : "transparent", transition: "background 0.12s", display: "flex", gap: "14px", alignItems: "flex-start" }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "rgba(200,146,42,0.04)"; }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                <div style={{ flexShrink: 0, textAlign: "center", minWidth: "42px" }}>
                  <div style={{ fontFamily: T.fontDisplay, fontSize: "20px", fontWeight: "700", color: getTierColor(entry.value), lineHeight: 1 }}>{entry.value}</div>
                  <div style={{ fontSize: "9px", color: getTierColor(entry.value), opacity: 0.8, marginTop: "2px" }}>{entry.tier}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: T.fontDisplay, fontSize: "14px", fontWeight: "600", color: T.text, marginBottom: "3px" }}>{entry.label}</div>
                  <div style={{ fontSize: "12px", color: T.textMeta, fontStyle: "italic", lineHeight: 1.55 }}>{entry.description}</div>
                </div>
                {isSel && <div style={{ color: getTierColor(entry.value), fontSize: "14px", flexShrink: 0, marginTop: "4px" }}>✓</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// HISTORY CARD
// ============================================================

function HistoryCard({ entry, expanded, onExpand }) {
  const avg = calcAvg(entry.scores);
  return (
    <div onClick={onExpand} style={{ border: `1px solid ${expanded ? T.goldBorderHi : T.goldBorder}`, borderRadius: "10px", overflow: "hidden", marginBottom: "10px", background: T.card, cursor: "pointer", transition: "border-color 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: T.fontDisplay, fontSize: "17px", color: T.text, fontWeight: "600" }}>{entry.weekLabel || formatDate(entry.date || entry.weekId)}</div>
          {entry.focusDomain && <div style={{ fontSize: "11px", color: T.textMeta, fontStyle: "italic", marginTop: "3px" }}>Focus: {DOMAINS.find(d => d.key === entry.focusDomain)?.label}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: T.fontDisplay, fontSize: "30px", color: getTierColor(avg), fontWeight: "700", lineHeight: 1 }}>{avg}</div>
          <div style={{ fontSize: "10px", color: T.textMeta, letterSpacing: "0.08em", marginTop: "2px" }}>{getScaleEntry(avg)?.tier}</div>
        </div>
      </div>
      {expanded && (
        <div style={{ borderTop: "1px solid rgba(200,146,42,0.15)", padding: "20px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center", marginBottom: "16px" }}>
            <PulseWheel scores={entry.scores} size={200} />
            <div style={{ flex: 1, minWidth: "160px" }}>
              {DOMAINS.map(d => (
                <div key={d.key} style={{ marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", color: T.textMeta }}>{d.label}</span>
                    <span style={{ fontSize: "11px", color: getTierColor(entry.scores[d.key]), fontWeight: "bold" }}>{entry.scores[d.key]} · {getScaleEntry(entry.scores[d.key])?.tier}</span>
                  </div>
                  <div style={{ height: "2px", background: "rgba(200,146,42,0.15)", borderRadius: "1px" }}>
                    <div style={{ height: "100%", width: `${(entry.scores[d.key] || 0) * 10}%`, background: getTierColor(entry.scores[d.key]), borderRadius: "1px" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {entry.reflection && (
            <div style={{ padding: "13px 16px", background: "rgba(200,146,42,0.05)", borderLeft: `3px solid ${T.gold}`, borderRadius: "0 6px 6px 0", marginBottom: entry.agentReflection ? "12px" : 0 }}>
              <SectionLabel>REFLECTION</SectionLabel>
              <p style={{ margin: 0, fontSize: "13px", color: T.textBody, fontStyle: "italic", lineHeight: 1.65 }}>{entry.reflection}</p>
            </div>
          )}
          {entry.agentReflection && <AgentReflection text={entry.agentReflection} />}
        </div>
      )}
    </div>
  );
}

// ============================================================
// SCAFFOLD CARDS — Monthly / Quarterly / Yearly
// ============================================================

function ScaffoldCard({ title, label, status, completedAt, onStart }) {
  const statusConfig = {
    locked_early: { text: "Not yet available", color: T.textMeta, action: false },
    available:    { text: "Available now",      color: T.gold,     action: true  },
    completed:    { text: "Completed",          color: T.blue,     action: false },
    closed:       { text: "Window closed",      color: T.amber,    action: false },
  };
  const cfg = statusConfig[completedAt ? "completed" : status] || statusConfig.locked_early;

  return (
    <div style={{ padding: "18px 20px", border: `1px solid ${cfg.action ? T.goldBorderHi : T.goldBorder}`, borderRadius: "10px", background: T.card, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: T.fontDisplay, fontSize: "18px", fontWeight: "600", color: T.text }}>{title}</div>
          <div style={{ fontSize: "11px", color: T.textMeta, fontStyle: "italic", marginTop: "3px" }}>{label}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: cfg.color, fontWeight: "600", letterSpacing: "0.08em" }}>{cfg.text}</div>
          {cfg.action && (
            <button onClick={onStart} style={{ marginTop: "8px", padding: "8px 16px", background: T.gold, border: "none", color: "#FFF", borderRadius: "6px", cursor: "pointer", fontFamily: T.fontBody, fontSize: "10px", letterSpacing: "0.12em" }}>
              BEGIN →
            </button>
          )}
          {completedAt && <div style={{ fontSize: "10px", color: T.textMeta, marginTop: "4px" }}>{formatDate(completedAt)}</div>}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================

export default function App() {
  const [view, setView]         = useState("home");
  const [data, setData]         = useState(emptyData());
  const [loading, setLoading]   = useState(true);
  const [expandedHistory, setExpandedHistory] = useState(null);

  // Weekly state
  const [wScores, setWScores]           = useState(Object.fromEntries(DOMAINS.map(d => [d.key, null])));
  const [wSayMore, setWSayMore]         = useState(Object.fromEntries(DOMAINS.map(d => [d.key, ""])));
  const [wReflection, setWReflection]   = useState("");
  const [wFocusDomain, setWFocusDomain] = useState("");
  const [wSaving, setWSaving]           = useState(false);
  const [wSaved, setWSaved]             = useState(null);

  // Agent state
  const [agentText, setAgentText]       = useState("");
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentError, setAgentError]     = useState("");

  const now = new Date();
  const todayStr   = getLocalDateStr(now);
  const weekId     = getWeekId(now);
  const weekLabel  = `Week of ${getWeekRange(now)}`;
  const monthId    = getMonthId(now);
  const quarterId  = getQuarterId(now);
  const yearId     = getYearId(now);

  const weeklyStatus   = getWeeklyPulseStatus(now);
  const monthlyStatus  = getMonthlyPulseStatus(now);
  const quarterlyStatus= getQuarterlyPulseStatus(now);
  const yearlyStatus   = getYearlyPulseStatus(now);

  const todayPulse      = getTodaysPulse(data.daily, now);
  const dailyThisWeek   = getDailyThisWeek(data.daily, now);
  const weeklyThisWeek  = (data.weekly || []).find(e => e.weekId === weekId);
  const monthlyThisMonth= (data.monthly || []).find(e => e.monthId === monthId);
  const quarterlyThisQ  = (data.quarterly || []).find(e => e.quarterId === quarterId);
  const yearlyThisYear  = (data.yearly || []).find(e => e.yearId === yearId);

  const wAllScored = DOMAINS.every(d => wScores[d.key] !== null);
  const wScoredCount = DOMAINS.filter(d => wScores[d.key] !== null).length;
  const wAvg = wAllScored ? calcAvg(Object.fromEntries(DOMAINS.map(d => [d.key, wScores[d.key] ?? 5]))) : null;
  const wCompletedScores = Object.fromEntries(DOMAINS.map(d => [d.key, wScores[d.key] ?? 5]));
  const insights = getInsights(data.weekly || []);

  useEffect(() => {
    loadData().then(d => { setData(d); setLoading(false); });
  }, []);

  // ---- Handlers ----

  const [savedDailyEntry, setSavedDailyEntry] = useState(null);

  async function handleDailySave(entry) {
    // Recompute date fields at save time to avoid stale closure
    const saveTime = new Date();
    const freshEntry = {
      ...entry,
      localDate: getLocalDateStr(saveTime),
      weekId:    getWeekId(saveTime),
      monthId:   getMonthId(saveTime),
      quarterId: getQuarterId(saveTime),
      yearId:    getYearId(saveTime),
      timestamp: saveTime.toISOString(),
    };
    const existing = (data.daily || []).findIndex(e => e.localDate === freshEntry.localDate);
    let newDaily;
    if (existing >= 0) {
      newDaily = [...data.daily];
      newDaily[existing] = { ...newDaily[existing], ...freshEntry, updatedAt: saveTime.toISOString() };
    } else {
      newDaily = [...(data.daily || []), { ...freshEntry, createdAt: saveTime.toISOString() }];
    }
    const newData = { ...data, daily: newDaily };
    // Write to localStorage first, verify it round-trips
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      const verify = localStorage.getItem(STORAGE_KEY);
      if (!verify) throw new Error("verify failed");
    } catch (e) {
      alert("Save failed — please try again. If this keeps happening, check your browser storage settings.");
      return;
    }
    setData(newData);
    setSavedDailyEntry(freshEntry);
    setView("dailySaved");
  }

  async function handleWeeklySave() {
    setWSaving(true);
    const entry = {
      weekId, weekLabel,
      monthId, quarterId, yearId,
      completedAt: new Date().toISOString(),
      dailyCount: dailyThisWeek.length,
      scores: { ...wCompletedScores },
      sayMore: { ...wSayMore },
      reflection: wReflection,
      focusDomain: wFocusDomain,
    };
    const newWeekly = [...(data.weekly || []).filter(e => e.weekId !== weekId), entry];
    const newData = { ...data, weekly: newWeekly };
    await saveData(newData);
    setData(newData);
    setWSaved(entry);
    setView("weekSaved");
    setWSaving(false);
  }

  async function handleRequestReflection(entry) {
    setAgentText(""); setAgentError(""); setAgentLoading(true);
    try {
      const daily = getDailyThisWeek(data.daily, new Date(entry.weekId));
      const prev = (data.weekly || []).filter(e => e.weekId !== entry.weekId);
      const text = await callAgent(AGENT_SYSTEM, buildWeeklyPrompt(entry, daily, prev));
      setAgentText(text);
      const updated = (data.weekly || []).map(e => e.weekId === entry.weekId ? { ...e, agentReflection: text, agentGeneratedAt: new Date().toISOString() } : e);
      const newData = { ...data, weekly: updated };
      await saveData(newData);
      setData(newData);
    } catch (err) {
      setAgentError("Reflection unavailable. Check your API configuration.");
    }
    setAgentLoading(false);
  }

  function resetWeekly() {
    setWScores(Object.fromEntries(DOMAINS.map(d => [d.key, null])));
    setWSayMore(Object.fromEntries(DOMAINS.map(d => [d.key, ""])));
    setWReflection(""); setWFocusDomain(""); setAgentText(""); setAgentError(""); setWSaved(null);
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: T.bg }}>
      <div style={{ color: T.textMeta, fontFamily: T.fontBody, fontStyle: "italic" }}>Loading your record...</div>
    </div>
  );

  const btnPrimary   = { width: "100%", padding: "18px", background: T.gold, border: "none", color: "#FFFFFF", borderRadius: "8px", cursor: "pointer", fontFamily: T.fontDisplay, fontSize: "19px", fontWeight: "500", letterSpacing: "0.06em" };
  const btnSecondary = { width: "100%", padding: "14px", background: "none", border: `1px solid ${T.goldBorder}`, color: T.textMeta, borderRadius: "8px", cursor: "pointer", fontFamily: T.fontBody, fontSize: "11px", letterSpacing: "0.1em" };
  const btnAgent     = { width: "100%", padding: "16px", background: T.card, border: `1px solid ${T.goldBorderHi}`, color: T.gold, borderRadius: "8px", cursor: "pointer", fontFamily: T.fontDisplay, fontSize: "16px", fontWeight: "500", letterSpacing: "0.05em" };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: T.fontBody }}>
      <style>{css}</style>
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "44px 24px 120px" }}>

        {/* HEADER */}
        <div style={{ marginBottom: "40px", borderBottom: `1px solid rgba(200,146,42,0.25)`, paddingBottom: "32px", textAlign: "center" }}>
          <div style={{ marginBottom: "16px" }}>
            <img
              src="/logo.png"
              alt=""
              style={{ width: "72px", height: "72px", objectFit: "contain" }}
            />
          </div>
          <h1 style={{ fontFamily: T.fontDisplay, fontSize: "52px", fontWeight: "300", color: T.gold, lineHeight: 1, letterSpacing: "-0.01em", margin: 0 }}>
            <span style={{ fontSize: "22px", fontWeight: "400", color: T.gold, letterSpacing: "0.01em" }}>Life OS: </span>Pulse
          </h1>
          <div style={{ fontFamily: T.fontDisplay, fontSize: "14px", color: T.textMeta, fontStyle: "italic", marginTop: "10px", letterSpacing: "0.01em" }}>
            Rate each domain 0–10. How are you today, honestly?
          </div>
        </div>

        {/* DAILY CHECK-IN */}
        {view === "daily" && (
          <DailyCheckIn
            existing={todayPulse}
            onSave={handleDailySave}
            onClose={() => setView("home")}
          />
        )}

        {/* DAILY SAVED */}
        {view === "dailySaved" && savedDailyEntry && (() => {
          const savedAvg = calcAvg(savedDailyEntry.scores);
          return (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "9px", letterSpacing: "0.3em", color: T.gold, marginBottom: "12px", fontWeight: "600" }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}
              </div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                <PulseWheel scores={savedDailyEntry.scores} size={300} />
              </div>
              <div style={{ fontFamily: T.fontDisplay, fontSize: "52px", fontWeight: "300", color: getTierColor(savedAvg), lineHeight: 1, marginBottom: "6px" }}>
                {savedAvg}
              </div>
              <div style={{ fontSize: "11px", color: getTierColor(savedAvg), letterSpacing: "0.15em", fontWeight: "600", marginBottom: "4px" }}>
                {getScaleEntry(savedAvg)?.tier?.toUpperCase()}
              </div>
              <div style={{ fontSize: "13px", color: T.textMeta, fontStyle: "italic", fontFamily: T.fontDisplay, marginBottom: "32px" }}>
                {getScaleEntry(savedAvg)?.label}
              </div>
              {savedDailyEntry.note && (
                <div style={{ padding: "14px 20px", border: `1px solid ${T.goldBorder}`, borderLeft: `3px solid ${T.gold}`, borderRadius: "0 8px 8px 0", background: T.card, marginBottom: "28px", textAlign: "left", maxWidth: "380px", margin: "0 auto 28px" }}>
                  <p style={{ margin: 0, fontFamily: T.fontDisplay, fontSize: "15px", fontStyle: "italic", color: T.textBody, lineHeight: 1.65 }}>"{savedDailyEntry.note}"</p>
                </div>
              )}
              <button onClick={() => { setSavedDailyEntry(null); setView("home"); }}
                style={{ padding: "16px 40px", background: T.gold, border: "none", color: "#FFFFFF", borderRadius: "8px", cursor: "pointer", fontFamily: T.fontDisplay, fontSize: "18px", fontWeight: "500", letterSpacing: "0.06em" }}>
                Done for today
              </button>
            </div>
          );
        })()}

        {/* HOME */}
        {view === "home" && (
          <div>
            {/* Radar wheel — always visible on home */}
            {(() => {
              const latestWeekly = (data.weekly || []).slice(-1)[0];
              const displayScores = latestWeekly?.scores || Object.fromEntries(DOMAINS.map(d => [d.key, 5]));
              const hasData = !!latestWeekly;
              return (
                <div style={{ padding: "28px 16px 20px", background: T.card, border: `1px solid ${T.goldBorder}`, borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", marginBottom: "20px", textAlign: "center" }}>
                  {hasData && (
                    <div style={{ marginBottom: "6px" }}>
                      <span style={{ fontFamily: T.fontDisplay, fontSize: "13px", color: T.textMeta, fontStyle: "italic" }}>
                        {latestWeekly.weekLabel || "Last weekly pulse"}
                      </span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <PulseWheel scores={displayScores} size={300} hideLabels={!hasData} />
                  </div>
                  {!hasData && (
                    <p style={{ fontSize: "12px", color: T.textMeta, fontStyle: "italic", marginTop: "12px", fontFamily: T.fontDisplay, lineHeight: 1.6 }}>
                      Complete your first Weekly Pulse to see your map here.
                    </p>
                  )}
                  {hasData && (
                    <div style={{ marginTop: "12px", fontFamily: T.fontDisplay, fontSize: "26px", fontWeight: "300", color: getTierColor(calcAvg(displayScores)) }}>
                      {calcAvg(displayScores)} · <span style={{ fontSize: "15px" }}>{getScaleEntry(calcAvg(displayScores))?.tier}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Horizon Scale card */}
            <div style={{ marginBottom: "28px", padding: "18px 22px", background: T.card, border: `1px solid ${T.goldBorder}`, borderRadius: "10px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <SectionLabel>THE HORIZON SCALE</SectionLabel>
              <p style={{ fontSize: "12px", color: T.textMeta, fontStyle: "italic", lineHeight: 1.6, margin: "0 0 14px", fontFamily: T.fontDisplay }}>
                The scale you use across all seven domains. Each level describes where you recognise yourself — not where you'd like to be.
              </p>
              {SCALE_BANDS.map(item => (
                <div key={item.label}>
                  {item.dividerAfter ? (
                    <div>
                      <div style={{ borderTop: "2px solid rgba(200,146,42,0.5)" }} />
                      <div style={{ height: "90px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "stretch", padding: "0 4px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
                          <span style={{ fontSize: "13px", color: item.color, fontFamily: T.fontDisplay, fontWeight: "500" }}>{item.label}</span>
                          <span style={{ fontSize: "11px", color: T.textMeta }}>{item.range}</span>
                        </div>
                        <div style={{ textAlign: "center", padding: "0 8px" }}>
                          <div style={{ fontSize: "9px", color: T.gold, letterSpacing: "0.2em", fontWeight: "700", marginBottom: "3px" }}>THE PASS/FAIL MARK</div>
                          <div style={{ fontSize: "11px", color: T.textMeta, fontStyle: "italic", fontFamily: T.fontDisplay, lineHeight: 1.5 }}>Above this you're helping. Below it, you're hurting yourself and those around you.</div>
                        </div>
                      </div>
                      <div style={{ borderTop: "2px solid rgba(200,146,42,0.5)" }} />
                    </div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0" }}>
                      <span style={{ fontSize: "13px", color: item.color, fontFamily: T.fontDisplay, fontWeight: "500" }}>{item.label}</span>
                      <span style={{ fontSize: "11px", color: T.textMeta }}>{item.range}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Weekly rhythm status */}
            <div style={{ marginBottom: "20px", padding: "16px 20px", background: T.card, border: `1px solid ${T.goldBorder}`, borderRadius: "10px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div>
                  <div style={{ fontSize: "10px", color: T.gold, letterSpacing: "0.18em", fontWeight: "600", marginBottom: "3px" }}>{weekLabel.toUpperCase()}</div>
                  <div style={{ fontFamily: T.fontDisplay, fontSize: "14px", color: T.textMeta, fontStyle: "italic" }}>
                    {dailyThisWeek.length} of 7 daily pulses logged
                  </div>
                </div>
                <WeekDots count={dailyThisWeek.length} />
              </div>
              {weeklyThisWeek ? (
                <div style={{ fontSize: "11px", color: T.blue, fontWeight: "600" }}>✓ Weekly Pulse complete</div>
              ) : (
                <div style={{ fontSize: "11px", color: weeklyStatus === "available" ? T.gold : T.textMeta }}>
                  {weeklyStatus === "available"
                    ? "Weekly Pulse available now"
                    : `Weekly Pulse unlocks ${getWeeklyUnlockCountdown(now)}`}
                </div>
              )}
            </div>

            {/* Daily + Weekly entry cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "28px" }}>
              {/* Daily */}
              <button onClick={() => setView("daily")}
                style={{ padding: "20px 16px", background: T.card, border: `1px solid ${todayPulse ? T.goldBorderHi : T.goldBorder}`, borderRadius: "10px", cursor: "pointer", textAlign: "left", transition: "all 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.goldBorderHi; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = todayPulse ? T.goldBorderHi : T.goldBorder; }}>
                <div style={{ fontFamily: T.fontDisplay, fontSize: "18px", color: T.text, fontWeight: "600", marginBottom: "4px" }}>Daily Pulse</div>
                <div style={{ fontSize: "11px", color: T.textMeta, fontStyle: "italic", lineHeight: 1.5 }}>7 domains · ~40 seconds</div>
                <div style={{ fontSize: "10px", color: todayPulse ? T.blue : T.gold, marginTop: "8px", fontWeight: "600" }}>
                  {todayPulse ? `✓ Logged · ${calcAvg(todayPulse.scores)}` : "Today"}
                </div>
              </button>

              {/* Weekly */}
              <button
                onClick={() => weeklyStatus === "available" && !weeklyThisWeek && setView("weekScan")}
                style={{ padding: "20px 16px", background: T.card, border: `1px solid ${weeklyThisWeek ? T.goldBorderHi : T.goldBorder}`, borderRadius: "10px", cursor: weeklyStatus === "available" && !weeklyThisWeek ? "pointer" : "default", textAlign: "left", transition: "all 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", opacity: weeklyStatus === "locked_early" ? 0.7 : 1 }}
                onMouseEnter={e => { if (weeklyStatus === "available" && !weeklyThisWeek) e.currentTarget.style.borderColor = T.goldBorderHi; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = weeklyThisWeek ? T.goldBorderHi : T.goldBorder; }}>
                <div style={{ fontFamily: T.fontDisplay, fontSize: "18px", color: T.text, fontWeight: "600", marginBottom: "4px" }}>Weekly Pulse</div>
                <div style={{ fontSize: "11px", color: T.textMeta, fontStyle: "italic", lineHeight: 1.5 }}>Think of your week as a whole · 7 domains</div>
                <div style={{ fontSize: "10px", marginTop: "8px", fontWeight: "600", color: weeklyThisWeek ? T.blue : weeklyStatus === "available" ? T.gold : T.textMeta }}>
                  {weeklyThisWeek ? `✓ Complete · ${calcAvg(weeklyThisWeek.scores)}` : weeklyStatus === "available" ? "Available now" : `Unlocks ${getWeeklyUnlockCountdown(now)}`}
                </div>
              </button>
            </div>

            {/* Extended cadence scaffold */}
            <Divider margin="0 0 20px" />
            <SectionLabel>EXTENDED CADENCE</SectionLabel>
            <ScaffoldCard
              title="Monthly Pulse"
              label={`${MONTH_FULL[now.getMonth()]} ${now.getFullYear()}`}
              status={monthlyStatus}
              completedAt={monthlyThisMonth?.completedAt}
              onStart={() => alert("Monthly Pulse coming in the next build.")}
            />
            <ScaffoldCard
              title="Quarterly Pulse"
              label={`Q${Math.floor(now.getMonth()/3)+1} ${now.getFullYear()}`}
              status={quarterlyStatus}
              completedAt={quarterlyThisQ?.completedAt}
              onStart={() => alert("Quarterly Pulse coming in the next build.")}
            />
            <ScaffoldCard
              title="Yearly Pulse"
              label={`${now.getFullYear()} Review`}
              status={yearlyStatus}
              completedAt={yearlyThisYear?.completedAt}
              onStart={() => alert("Yearly Pulse coming in the next build.")}
            />

            {/* Monthly AI reflection (if enough data) */}
            {(data.weekly || []).length >= 3 && (
              <div style={{ marginTop: "24px" }}>
                <Divider margin="0 0 20px" />
                <SectionLabel>MONTHLY REFLECTION</SectionLabel>
                <button onClick={async () => {
                  setAgentText(""); setAgentError(""); setAgentLoading(true);
                  try {
                    const wThisMonth = (data.weekly || []).filter(e => e.monthId === monthId);
                    const dThisMonth = (data.daily || []).filter(e => e.monthId === monthId);
                    const text = await callAgent(AGENT_SYSTEM, buildMonthlyPrompt({ monthLabel: `${MONTH_FULL[now.getMonth()]} ${now.getFullYear()}` }, wThisMonth, dThisMonth));
                    setAgentText(text);
                  } catch { setAgentError("Monthly reflection unavailable."); }
                  setAgentLoading(false);
                }} disabled={agentLoading} style={{ ...btnAgent, opacity: agentLoading ? 0.6 : 1 }}>
                  {agentLoading ? "Reading your record..." : "See your monthly reflection →"}
                </button>
                {(agentText || agentError) && <div style={{ marginTop: "16px" }}><AgentReflection text={agentText} loading={false} error={agentError} /></div>}
              </div>
            )}

            {/* Record button — bottom */}
            <div style={{ marginTop: "40px" }}>
              <Divider margin="0 0 20px" />
              <button onClick={() => setView("history")} style={{ ...btnSecondary }}>
                VIEW RECORD {(data.weekly || []).length > 0 ? `· ${(data.weekly||[]).length} weekly check-ins` : ""}
              </button>
            </div>

            {/* Entry count */}
            {((data.weekly||[]).length > 0 || (data.daily||[]).length > 0) && (
              <p style={{ textAlign: "center", fontSize: "11px", color: T.textMeta, fontStyle: "italic", marginTop: "14px" }}>
                {(data.weekly||[]).length} weekly · {(data.daily||[]).length} daily on record
              </p>
            )}
          </div>
        )}

        {/* WEEKLY SCAN */}
        {view === "weekScan" && (
          <div>
            <div style={{ marginBottom: "28px" }}>
              <button onClick={() => setView("home")} style={{ background: "none", border: `1px solid ${T.goldBorder}`, color: T.textMeta, padding: "7px 14px", borderRadius: "4px", cursor: "pointer", fontFamily: T.fontBody, fontSize: "10px", letterSpacing: "0.12em", marginBottom: "16px" }}>← BACK</button>
              <div style={{ fontSize: "9px", letterSpacing: "0.3em", color: T.gold, marginBottom: "6px", fontWeight: "600" }}>WEEKLY PULSE</div>
              <div style={{ fontFamily: T.fontDisplay, fontSize: "13px", color: T.textMeta, fontStyle: "italic", marginBottom: "16px" }}>{weekLabel}</div>
              {/* Previous week's focus — gentle reflection */}
              {(() => {
                const prevWeekly = (data.weekly || []).slice(-1)[0];
                if (prevWeekly?.focusDomain) {
                  const focusLabel = DOMAINS.find(d => d.key === prevWeekly.focusDomain)?.label;
                  return (
                    <div style={{ marginBottom: "20px", padding: "14px 18px", background: T.card, border: `1px solid ${T.goldBorder}`, borderLeft: `3px solid ${T.gold}`, borderRadius: "0 8px 8px 0" }}>
                      <div style={{ fontSize: "9px", letterSpacing: "0.18em", color: T.gold, marginBottom: "6px", fontWeight: "600" }}>LAST WEEK YOU WERE FOCUSING ON</div>
                      <div style={{ fontFamily: T.fontDisplay, fontSize: "20px", color: T.text, fontWeight: "500" }}>{focusLabel}</div>
                      <div style={{ fontSize: "12px", color: T.textMeta, fontStyle: "italic", marginTop: "4px" }}>How did that go? You'll see it in your map.</div>
                    </div>
                  );
                }
                return null;
              })()}
              {dailyThisWeek.length > 0 && (
                <div style={{ fontSize: "11px", color: T.textMeta, marginBottom: "16px" }}>
                  {dailyThisWeek.length} daily check-in{dailyThisWeek.length !== 1 ? "s" : ""} this week
                </div>
              )}
              <div style={{ marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "10px", color: T.gold, letterSpacing: "0.12em", fontWeight: "600" }}>{wScoredCount} OF {DOMAINS.length}</span>
                {wAvg && <span style={{ fontFamily: T.fontDisplay, fontSize: "14px", color: getTierColor(wAvg), fontWeight: "600" }}>{wAvg} · {getScaleEntry(wAvg)?.tier}</span>}
              </div>
              <div style={{ height: "2px", background: "rgba(200,146,42,0.15)", borderRadius: "1px", marginBottom: "20px" }}>
                <div style={{ height: "100%", width: `${(wScoredCount/DOMAINS.length)*100}%`, background: T.gold, borderRadius: "1px", transition: "width 0.4s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
                <PulseWheel scores={wCompletedScores} size={260} />
              </div>
              <p style={{ fontSize: "13px", color: T.textMeta, fontStyle: "italic", textAlign: "center", marginBottom: "24px", lineHeight: 1.65, fontFamily: T.fontDisplay }}>
                Open each domain. Read the levels.<br />Select where you recognise yourself this week.
              </p>
            </div>
            {DOMAINS.map(domain => (
              <HorizonScalePicker key={domain.key} domain={domain} value={wScores[domain.key]}
                onChange={val => setWScores(prev => ({ ...prev, [domain.key]: val }))} />
            ))}
            <div style={{ marginTop: "12px" }}>
              {wAllScored
                ? <button onClick={() => setView("weekSayMore")} style={btnPrimary}>Continue →</button>
                : <div style={{ textAlign: "center", padding: "16px", color: T.textMeta, fontSize: "13px", fontStyle: "italic", fontFamily: T.fontDisplay }}>{DOMAINS.length - wScoredCount} domain{DOMAINS.length - wScoredCount !== 1 ? "s" : ""} remaining</div>}
            </div>
          </div>
        )}

        {/* WEEKLY SAY MORE */}
        {view === "weekSayMore" && (
          <div>
            <div style={{ marginBottom: "28px" }}>
              <div style={{ fontSize: "9px", letterSpacing: "0.3em", color: T.gold, marginBottom: "8px", fontWeight: "600" }}>WEEKLY PULSE</div>
              <h2 style={{ fontFamily: T.fontDisplay, fontSize: "32px", color: T.text, fontWeight: "400", margin: "0 0 6px" }}>Anything to add?</h2>
              <p style={{ fontSize: "12px", color: T.textMeta, fontStyle: "italic", lineHeight: 1.65, fontFamily: T.fontDisplay }}>
                Optional. Where a number alone doesn't capture it.
              </p>
            </div>
            {DOMAINS.map(d => {
              const s = wCompletedScores[d.key];
              return (
                <div key={d.key} style={{ marginBottom: "12px", padding: "16px 18px", border: `1px solid ${T.goldBorder}`, borderRadius: "10px", background: T.card, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div style={{ fontFamily: T.fontDisplay, fontSize: "16px", fontWeight: "600", color: T.text }}>{d.label}</div>
                    <div>
                      <span style={{ fontFamily: T.fontDisplay, fontSize: "20px", fontWeight: "700", color: getTierColor(s) }}>{s}</span>
                      <span style={{ fontSize: "10px", color: getTierColor(s), marginLeft: "6px" }}>{getScaleEntry(s)?.tier}</span>
                    </div>
                  </div>
                  <textarea value={wSayMore[d.key]} onChange={e => setWSayMore(prev => ({ ...prev, [d.key]: e.target.value }))}
                    placeholder="What's true here this week?"
                    rows={2}
                    style={{ width: "100%", background: T.bg, border: `1px solid ${T.goldBorder}`, borderRadius: "6px", color: T.text, fontFamily: T.fontDisplay, fontSize: "13px", fontStyle: "italic", padding: "10px 14px", outline: "none", lineHeight: 1.6, resize: "none" }}
                    onFocus={e => { e.currentTarget.style.borderColor = T.goldBorderHi; e.currentTarget.style.background = T.card; }}
                    onBlur={e => { e.currentTarget.style.borderColor = T.goldBorder; e.currentTarget.style.background = T.bg; }} />
                </div>
              );
            })}
            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <button onClick={() => setView("weekReveal")} style={btnPrimary}>See Your Map →</button>
              <button onClick={() => setView("weekScan")} style={btnSecondary}>← Back to scores</button>
            </div>
          </div>
        )}

        {/* WEEKLY REVEAL */}
        {view === "weekReveal" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "36px" }}>
              <div style={{ fontSize: "9px", letterSpacing: "0.3em", color: T.gold, marginBottom: "8px", fontWeight: "600" }}>YOUR MAP · {weekLabel.toUpperCase()}</div>
              <PulseWheel scores={wCompletedScores} size={310} />
              <div style={{ marginTop: "20px" }}>
                <div style={{ fontFamily: T.fontDisplay, fontSize: "58px", fontWeight: "300", color: getTierColor(wAvg), lineHeight: 1 }}>{wAvg}</div>
                <div style={{ fontSize: "10px", color: T.textMeta, letterSpacing: "0.2em", marginTop: "6px" }}>{getScaleEntry(wAvg)?.tier?.toUpperCase()}</div>
              </div>
            </div>
            <div style={{ marginBottom: "28px" }}>
              {DOMAINS.map(d => {
                const s = wCompletedScores[d.key];
                return (
                  <div key={d.key} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "10px 0", borderBottom: "1px solid rgba(200,146,42,0.15)" }}>
                    <div style={{ width: "100px", flexShrink: 0, fontFamily: T.fontDisplay, fontSize: "15px", color: T.text, fontWeight: "600" }}>{d.label}</div>
                    <div style={{ flex: 1, height: "3px", background: "rgba(200,146,42,0.15)", borderRadius: "2px" }}>
                      <div style={{ height: "100%", width: `${s * 10}%`, background: getTierColor(s), borderRadius: "2px", transition: "width 0.5s" }} />
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, minWidth: "110px" }}>
                      <span style={{ fontFamily: T.fontDisplay, fontSize: "18px", fontWeight: "700", color: getTierColor(s) }}>{s}</span>
                      <span style={{ fontSize: "11px", color: T.textMeta, marginLeft: "6px" }}>{getScaleEntry(s)?.tier}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {insights.length > 0 && (
              <div style={{ marginBottom: "28px" }}>
                <SectionLabel>WHAT YOUR RECORD IS SHOWING</SectionLabel>
                {insights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
              </div>
            )}
            <Divider />
            <div style={{ marginBottom: "24px" }}>
              <SectionLabel>WHAT DOES YOUR MAP REVEAL? (optional)</SectionLabel>
              <textarea value={wReflection} onChange={e => setWReflection(e.target.value)}
                placeholder="What surprises you? What doesn't? What are you ready to see clearly?"
                rows={4}
                style={{ width: "100%", background: T.card, border: `1px solid ${T.goldBorder}`, borderRadius: "8px", color: T.text, fontFamily: T.fontDisplay, fontSize: "15px", fontStyle: "italic", padding: "14px 18px", outline: "none", lineHeight: 1.65 }}
                onFocus={e => e.currentTarget.style.borderColor = T.goldBorderHi}
                onBlur={e => e.currentTarget.style.borderColor = T.goldBorder} />
            </div>
            <div style={{ marginBottom: "32px" }}>
              <SectionLabel>IF ONE DOMAIN GETS YOUR ATTENTION THIS WEEK (optional)</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {DOMAINS.map(d => {
                  const s = wCompletedScores[d.key];
                  const active = wFocusDomain === d.key;
                  return (
                    <button key={d.key} onClick={() => setWFocusDomain(active ? "" : d.key)}
                      style={{ padding: "12px 14px", background: active ? "rgba(200,146,42,0.1)" : T.card, border: `1px solid ${active ? T.goldBorderHi : T.goldBorder}`, borderRadius: "8px", color: active ? T.text : T.textMeta, cursor: "pointer", fontFamily: T.fontDisplay, fontSize: "14px", textAlign: "left", transition: "all 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                      <div style={{ fontWeight: "600" }}>{d.label}</div>
                      <div style={{ fontSize: "11px", color: getTierColor(s), marginTop: "3px", fontStyle: "italic" }}>{s} · {getScaleEntry(s)?.tier}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <button onClick={handleWeeklySave} disabled={wSaving} style={{ ...btnPrimary, marginBottom: "10px", opacity: wSaving ? 0.6 : 1 }}>
              {wSaving ? "Saving..." : "Save to Your Record"}
            </button>
            <button onClick={() => setView("weekSayMore")} style={btnSecondary}>← Adjust my assessment</button>
          </div>
        )}

        {/* WEEKLY SAVED */}
        {view === "weekSaved" && wSaved && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: T.fontDisplay, fontSize: "58px", fontWeight: "300", color: T.gold, marginBottom: "10px" }}>Recorded.</div>
            <p style={{ fontSize: "16px", color: T.textMeta, fontStyle: "italic", lineHeight: 1.75, maxWidth: "380px", margin: "0 auto 12px", fontFamily: T.fontDisplay }}>
              {weekLabel}
            </p>
            <p style={{ fontSize: "13px", color: T.textMeta, fontStyle: "italic", lineHeight: 1.75, maxWidth: "380px", margin: "0 auto 36px", fontFamily: T.fontDisplay }}>
              Your pulse is on record. Return next week and watch the pattern emerge.
            </p>
            <PulseWheel scores={wSaved.scores} size={270} />
            {wSaved.focusDomain && (
              <div style={{ marginTop: "28px", padding: "22px 28px", border: `1px solid ${T.goldBorder}`, borderRadius: "10px", display: "inline-block", minWidth: "220px", background: T.card, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: "9px", letterSpacing: "0.22em", color: T.gold, marginBottom: "10px", fontWeight: "600" }}>YOUR FOCUS THIS WEEK</div>
                <div style={{ fontFamily: T.fontDisplay, fontSize: "26px", color: T.text, fontWeight: "500" }}>{DOMAINS.find(d => d.key === wSaved.focusDomain)?.label}</div>
                <div style={{ fontSize: "12px", color: T.textMeta, fontStyle: "italic", marginTop: "5px", fontFamily: T.fontDisplay }}>{getScaleEntry(wSaved.scores[wSaved.focusDomain])?.tier}</div>
              </div>
            )}
            <div style={{ marginTop: "32px", marginBottom: "8px" }}>
              {!agentText && !agentLoading && !agentError && (
                <button onClick={() => handleRequestReflection(wSaved)} style={btnAgent}>See your weekly reflection →</button>
              )}
              {(agentText || agentLoading || agentError) && <AgentReflection text={agentText} loading={agentLoading} error={agentError} />}
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "24px", justifyContent: "center" }}>
              <button onClick={() => { resetWeekly(); setView("home"); }} style={{ padding: "13px 22px", background: T.card, border: `1px solid ${T.goldBorder}`, color: T.textMeta, borderRadius: "6px", cursor: "pointer", fontFamily: T.fontBody, fontSize: "10px", letterSpacing: "0.12em" }}>DONE</button>
              <button onClick={() => setView("history")} style={{ padding: "13px 22px", background: T.gold, border: "none", color: "#FFFFFF", borderRadius: "6px", cursor: "pointer", fontFamily: T.fontBody, fontSize: "10px", letterSpacing: "0.12em" }}>VIEW MY RECORD</button>
            </div>
          </div>
        )}

        {/* HISTORY */}
        {view === "history" && (() => {
          // Group daily entries by weekId, sorted newest first
          const allDaily = [...(data.daily || [])].sort((a, b) => b.localDate.localeCompare(a.localDate));
          const weekGroups = {};
          allDaily.forEach(entry => {
            const wid = entry.weekId || "unknown";
            if (!weekGroups[wid]) weekGroups[wid] = [];
            weekGroups[wid].push(entry);
          });
          const sortedWeekIds = Object.keys(weekGroups).sort((a, b) => b.localeCompare(a));
          const hasAny = allDaily.length > 0 || (data.weekly || []).length > 0;

          return (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
                <button onClick={() => setView("home")} style={{ background: T.card, border: `1px solid ${T.goldBorder}`, color: T.textMeta, padding: "7px 14px", borderRadius: "4px", cursor: "pointer", fontFamily: T.fontBody, fontSize: "10px", letterSpacing: "0.12em" }}>← BACK</button>
                <h2 style={{ fontFamily: T.fontDisplay, fontSize: "30px", color: T.text, fontWeight: "400", margin: 0 }}>Your Record</h2>
              </div>

              {!hasAny ? (
                <p style={{ color: T.textMeta, fontStyle: "italic", textAlign: "center", padding: "48px 0", fontFamily: T.fontDisplay, fontSize: "16px" }}>Nothing logged yet. Complete your first Daily or Weekly Pulse to begin your record.</p>
              ) : (
                <>
                  {/* Domain trends — only when 2+ weekly entries */}
                  {(data.weekly || []).length > 1 && (
                    <div style={{ padding: "20px 22px", border: `1px solid ${T.goldBorder}`, borderRadius: "10px", marginBottom: "24px", background: T.card, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                      <SectionLabel>DOMAIN TRENDS</SectionLabel>
                      {DOMAINS.map(d => {
                        const values = (data.weekly || []).map(h => h.scores[d.key]);
                        const latest = values[values.length-1];
                        const prev   = values[values.length-2];
                        const trend  = Math.round((latest - prev) * 2) / 2;
                        return (
                          <div key={d.key} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                            <span style={{ width: "100px", fontSize: "12px", color: T.textMeta, flexShrink: 0 }}>{d.label}</span>
                            <div style={{ flex: 1, height: "3px", background: "rgba(200,146,42,0.15)", borderRadius: "2px" }}>
                              <div style={{ height: "100%", width: `${latest * 10}%`, background: getTierColor(latest), borderRadius: "2px" }} />
                            </div>
                            <span style={{ fontSize: "11px", color: getTierColor(latest), width: "76px", textAlign: "right" }}>{getScaleEntry(latest)?.tier}</span>
                            <span style={{ fontSize: "12px", width: "32px", textAlign: "right", color: trend > 0 ? T.blue : trend < 0 ? T.amber : T.textMeta, fontWeight: "bold" }}>
                              {trend > 0 ? `+${trend}` : trend < 0 ? trend : "—"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Insights */}
                  {insights.length > 0 && (
                    <div style={{ marginBottom: "22px" }}>
                      <SectionLabel>YOUR RECORD IS NOTICING</SectionLabel>
                      {insights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
                    </div>
                  )}

                  {/* Daily entries grouped by week */}
                  {sortedWeekIds.map(wid => {
                    const days = weekGroups[wid];
                    const weeklyEntry = (data.weekly || []).find(w => w.weekId === wid);
                    const isCurrentWeek = wid === weekId;
                    const weekAvg = calcAvg(Object.fromEntries(
                      DOMAINS.map(d => [d.key, days.reduce((s, e) => s + (e.scores?.[d.key] ?? 0), 0) / days.length])
                    ));

                    // label
                    const firstDay = days[days.length - 1];
                    const weekLabel_ = weeklyEntry?.weekLabel || (firstDay ? `Week of ${firstDay.localDate}` : wid);

                    return (
                      <div key={wid} style={{ marginBottom: "28px" }}>
                        {/* Week header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", paddingBottom: "8px", borderBottom: `1px solid ${T.goldBorder}` }}>
                          <div>
                            <div style={{ fontSize: "9px", color: T.gold, letterSpacing: "0.2em", fontWeight: "700" }}>
                              {isCurrentWeek ? "THIS WEEK" : weekLabel_.toUpperCase()}
                            </div>
                            <div style={{ fontFamily: T.fontDisplay, fontSize: "13px", color: T.textMeta, fontStyle: "italic" }}>
                              {days.length} day{days.length !== 1 ? "s" : ""} logged{weeklyEntry ? " · Weekly Pulse complete" : ""}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontFamily: T.fontDisplay, fontSize: "22px", color: getTierColor(weekAvg), lineHeight: 1 }}>{weekAvg}</div>
                            <div style={{ fontSize: "9px", color: getTierColor(weekAvg), letterSpacing: "0.1em" }}>{getScaleEntry(weekAvg)?.tier?.toUpperCase()}</div>
                          </div>
                        </div>

                        {/* Daily cards — expandable */}
                        {days.map((entry, di) => {
                          const avg = calcAvg(entry.scores || {});
                          const dateObj = new Date(entry.localDate + "T12:00:00");
                          const dateLabel = dateObj.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
                          const cardKey = `${wid}-${di}`;
                          const isOpen = expandedHistory === cardKey;
                          return (
                            <div key={di} style={{ marginBottom: "10px", background: T.card, border: `1px solid ${T.goldBorder}`, borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" }}>
                              {/* Collapsed header — always visible, clickable */}
                              <div
                                onClick={() => setExpandedHistory(isOpen ? null : cardKey)}
                                style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                              >
                                <div>
                                  <div style={{ fontSize: "11px", color: T.gold, letterSpacing: "0.12em", fontWeight: "600", marginBottom: "2px" }}>{dateLabel.toUpperCase()}</div>
                                  <div style={{ fontFamily: T.fontDisplay, fontSize: "13px", color: T.textMeta, fontStyle: "italic" }}>{getScaleEntry(avg)?.label}</div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                  <div style={{ textAlign: "right" }}>
                                    <div style={{ fontFamily: T.fontDisplay, fontSize: "28px", color: getTierColor(avg), lineHeight: 1 }}>{avg}</div>
                                    <div style={{ fontSize: "9px", color: getTierColor(avg), letterSpacing: "0.1em" }}>{getScaleEntry(avg)?.tier?.toUpperCase()}</div>
                                  </div>
                                  <div style={{ fontSize: "14px", color: T.textMeta, opacity: 0.5 }}>{isOpen ? "▲" : "▼"}</div>
                                </div>
                              </div>

                              {/* Expanded detail */}
                              {isOpen && (
                                <div style={{ borderTop: `1px solid ${T.goldBorder}`, padding: "20px 18px" }}>
                                  {/* Wheel */}
                                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                                    <PulseWheel scores={entry.scores || {}} size={260} />
                                  </div>
                                  {/* Domain score pills — more space */}
                                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginBottom: entry.note ? "16px" : 0 }}>
                                    {DOMAINS.map(d => {
                                      const s = entry.scores?.[d.key];
                                      if (s == null) return null;
                                      const col = getTierColor(s);
                                      return (
                                        <div key={d.key} style={{ padding: "8px 14px", background: `${col}14`, border: `1px solid ${col}33`, borderRadius: "6px", textAlign: "center", minWidth: "72px" }}>
                                          <div style={{ fontSize: "9px", color: T.textMeta, letterSpacing: "0.08em", marginBottom: "3px" }}>{d.label.toUpperCase()}</div>
                                          <div style={{ fontSize: "18px", color: col, fontWeight: "600", fontFamily: T.fontDisplay, lineHeight: 1 }}>{s}</div>
                                          <div style={{ fontSize: "8px", color: col, opacity: 0.8, marginTop: "2px" }}>{getScaleEntry(s)?.tier}</div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {/* Note */}
                                  {entry.note && (
                                    <div style={{ borderLeft: `2px solid ${T.goldBorder}`, paddingLeft: "14px", marginTop: "4px" }}>
                                      <p style={{ margin: 0, fontFamily: T.fontDisplay, fontSize: "14px", fontStyle: "italic", color: T.textMeta, lineHeight: 1.65 }}>"{entry.note}"</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Weekly summary if exists */}
                        {weeklyEntry && (
                          <HistoryCard entry={weeklyEntry} expanded={expandedHistory === wid}
                            onExpand={() => setExpandedHistory(expandedHistory === wid ? null : wid)} />
                        )}
                      </div>
                    );
                  })}

                  {/* Weeks with only weekly (no daily) entries */}
                  {[...(data.weekly || [])].reverse()
                    .filter(w => !weekGroups[w.weekId])
                    .map((entry, idx) => (
                      <div key={idx} style={{ marginBottom: "28px" }}>
                        <div style={{ fontSize: "9px", color: T.gold, letterSpacing: "0.2em", fontWeight: "700", marginBottom: "8px" }}>{(entry.weekLabel || entry.weekId).toUpperCase()}</div>
                        <HistoryCard entry={entry} expanded={expandedHistory === `w${idx}`}
                          onExpand={() => setExpandedHistory(expandedHistory === `w${idx}` ? null : `w${idx}`)} />
                      </div>
                    ))
                  }
                </>
              )}
            </div>
          );
        })()}

      </div>
    </div>
  );
}
