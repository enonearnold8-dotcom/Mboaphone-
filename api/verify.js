import { getJSON, setJSON, uuid, same, limit, telegram, send, postOnly } from "./_lib.js";

export default async function handler(req, res) {
  if (!postOnly(req, res)) return;
  try {
    if (!(await limit(req, "verify", 30, 3600))) return send(res, 429, { ok: false, error: "Trop d'essais. Contactez MboaPhone sur WhatsApp." });
    const { no, code } = req.body || {};
    const o = typeof no === "string" && /^MP-\d{8}-\d{4}$/.test(no) ? await getJSON(`order:${no}`) : null;
    if (!o) return send(res, 200, { ok: false, error: "Commande introuvable." });
    if (o.status !== "envoyée") return same(String(code || "").replace(/\D/g, ""), o.code) ? send(res, 200, { ok: true, token: o.token, received: o.received }) : send(res, 200, { ok: false, error: "Code incorrect." });
    if (o.tries >= 5) return send(res, 200, { ok: false, error: "Trop d'essais. Contactez MboaPhone sur WhatsApp." });
    if (!same(String(code || "").replace(/\D/g, ""), o.code)) {
      o.tries++;
      await setJSON(`order:${no}`, o, 60 * 60 * 24 * 120);
      if (o.tries >= 5) await telegram(`🚨 Commande ${no} : 5 codes de livraison faux. Elle est bloquée.`);
      return send(res, 200, { ok: false, error: `Code incorrect. ${5 - o.tries} essai(s) restant(s).` });
    }
    o.status = "reçue"; o.received = new Date().toISOString(); o.token = uuid();
    await setJSON(`order:${no}`, o, 60 * 60 * 24 * 120);
    await telegram(`✅ Commande ${no} reçue par ${o.name} (code de livraison validé).`);
    send(res, 200, { ok: true, token: o.token, received: o.received });
  } catch (e) { send(res, 500, { ok: false, error: "Serveur indisponible. Réessayez dans un instant." }) }
}
