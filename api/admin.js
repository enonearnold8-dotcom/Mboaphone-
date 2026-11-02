import { db, getJSON, setJSON, same, limit, telegram, newAdminToken, isAdmin, send, postOnly } from "./_lib.js";

export default async function handler(req, res) {
  if (!postOnly(req, res)) return;
  try {
    const b = req.body || {};
    if (b.action === "login") {
      if (!(await limit(req, "login", 8, 900))) return send(res, 429, { ok: false, error: "Trop d'essais. Attendez 15 minutes." });
      const pin = process.env.ADMIN_PIN;
      if (!pin || pin.length < 6) return send(res, 200, { ok: false, error: "Code administrateur non configuré sur Vercel (ADMIN_PIN, 6 caractères minimum)." });
      if (!same(String(b.pin || ""), pin)) { await telegram("⚠️ Tentative de connexion à l'espace gérant avec un mauvais code."); return send(res, 200, { ok: false, error: "Code incorrect." }) }
      return send(res, 200, { ok: true, token: await newAdminToken() });
    }
    if (!(await isAdmin(b.token))) return send(res, 200, { ok: false, error: "Session expirée. Reconnectez-vous." });
    if (b.action === "logout") { await db("DEL", `adm:${b.token}`); return send(res, 200, { ok: true }) }
    if (b.action === "list") {
      const nos = (await db("LRANGE", "orders", 0, 59)) || [];
      const orders = [];
      for (const no of nos) { const o = await getJSON(`order:${no}`); if (o) { delete o.token; orders.push(o) } }
      const ids = (await db("LRANGE", "photos", 0, 59)) || [];
      const photos = [];
      for (const id of ids) { const p = await getJSON(`photo:${id}`); if (p) photos.push(p) }
      return send(res, 200, { ok: true, orders, photos });
    }
    if (b.action === "setPublic") {
      const id = String(b.id || ""), p = /^[0-9a-f-]{36}$/i.test(id) ? await getJSON(`photo:${id}`) : null;
      if (!p) return send(res, 200, { ok: false, error: "Photo introuvable." });
      p.pub = b.pub === true; await setJSON(`photo:${id}`, p);
      return send(res, 200, { ok: true });
    }
    send(res, 400, { ok: false, error: "Action inconnue." });
  } catch (e) { send(res, 500, { ok: false, error: "Serveur indisponible." }) }
}
