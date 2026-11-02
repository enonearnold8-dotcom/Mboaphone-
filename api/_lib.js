// Outils partagés par les fonctions du serveur (ce fichier n'est pas une page : le "_" le cache).
import crypto from "node:crypto";

const DB_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const DB_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
export const dbReady = () => !!(DB_URL && DB_TOKEN);

// Une commande Redis (ex. ["SET", "cle", "valeur"])
export async function db(...cmd) {
  const r = await fetch(DB_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${DB_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd)
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}
export const getJSON = async k => { const v = await db("GET", k); return v ? JSON.parse(v) : null };
export const setJSON = (k, v, ttl) => ttl ? db("SET", k, JSON.stringify(v), "EX", ttl) : db("SET", k, JSON.stringify(v));

export const rnd = n => String(crypto.randomInt(0, 10 ** n)).padStart(n, "0");
export const uuid = () => crypto.randomUUID();
export const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y) };
export const fcfa = n => Math.round(n).toLocaleString("fr-FR").replace(/ | /g, " ") + " FCFA";
export const clean = (v, max = 120) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);

export function ip(req) { return String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "x" }
// Limite : au plus `max` appels par `sec` secondes pour une même adresse
export async function limit(req, name, max, sec) {
  const k = `rl:${name}:${ip(req)}`;
  const n = await db("INCR", k);
  if (n === 1) await db("EXPIRE", k, sec);
  return n <= max;
}

export async function telegram(text) {
  const t = process.env.TELEGRAM_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (!t || !chat) return false;
  try {
    const r = await fetch(`https://api.telegram.org/bot${t}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true })
    });
    return r.ok;
  } catch (e) { return false }
}

export function siteUrl(req) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `https://${host}`;
}

// Jeton administrateur (valable 12 h)
export async function newAdminToken() { const t = uuid(); await db("SET", `adm:${t}`, "1", "EX", 43200); return t }
export async function isAdmin(t) { return typeof t === "string" && /^[0-9a-f-]{36}$/i.test(t) && (await db("GET", `adm:${t}`)) === "1" }

export function send(res, status, obj) { res.setHeader("Cache-Control", "no-store"); res.status(status).json(obj) }
export function postOnly(req, res) { if (req.method !== "POST") { send(res, 405, { ok: false, error: "Méthode non autorisée." }); return false } return true }
