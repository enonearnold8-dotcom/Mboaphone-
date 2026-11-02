import { db, setJSON, rnd, fcfa, clean, limit, telegram, siteUrl, newAdminToken, send, postOnly } from "./_lib.js";

export default async function handler(req, res) {
  if (!postOnly(req, res)) return;
  try {
    if (!(await limit(req, "order", 15, 3600))) return send(res, 429, { ok: false, error: "Trop de commandes depuis ce téléphone. Réessayez plus tard ou écrivez-nous sur WhatsApp." });
    const b = req.body || {};
    const items = (Array.isArray(b.items) ? b.items : []).slice(0, 30).map(i => ({
      name: clean(i.name, 80), detail: clean(i.detail, 80),
      q: Math.min(20, Math.max(1, parseInt(i.q) || 1)), price: Math.max(0, Math.round(+i.price || 0))
    })).filter(i => i.name);
    if (!items.length) return send(res, 400, { ok: false, error: "Panier vide." });
    const o = {
      items, ship: Math.max(0, Math.min(10000, Math.round(+b.ship || 0))),
      name: clean(b.name, 60), phone: clean(b.phone, 25), city: clean(b.city, 40), area: clean(b.area, 60), note: clean(b.note, 120),
      mode: b.mode === "online" ? "online" : "cash", op: b.op === "Orange" ? "Orange" : "MTN", payer: clean(b.payer, 15), txid: clean(b.txid, 40)
    };
    if (!o.name || o.phone.replace(/\D/g, "").length < 8 || !o.city || !o.area) return send(res, 400, { ok: false, error: "Informations incomplètes." });
    if (o.mode === "online" && o.txid.replace(/\W/g, "").length < 6) return send(res, 400, { ok: false, error: "ID de transaction manquant." });
    o.total = items.reduce((s, i) => s + i.price * i.q, 0) + o.ship;

    const d = new Date(), p = x => String(x).padStart(2, "0");
    let no;
    for (let k = 0; k < 5; k++) {
      no = `MP-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${rnd(4)}`;
      if (!(await db("EXISTS", `order:${no}`))) break;
    }
    Object.assign(o, { no, hand: rnd(4), code: rnd(6), tries: 0, status: "envoyée", createdAt: d.toISOString() });
    await setJSON(`order:${no}`, o, 60 * 60 * 24 * 120);
    await db("LPUSH", "orders", no);
    await db("LTRIM", "orders", 0, 299);

    const adm = await newAdminToken();
    const lines = items.map(i => `• ${i.q} x ${i.name}${i.detail ? ` (${i.detail})` : ""} : ${fcfa(i.price * i.q)}`).join("\n");
    await telegram(
`🛒 Nouvelle commande ${no}
${lines}
Livraison : ${fcfa(o.ship)}
TOTAL : ${fcfa(o.total)}

👤 ${o.name} · ${o.phone}
📍 ${o.city}, ${o.area}${o.note ? ` (${o.note})` : ""}
💳 ${o.mode === "online" ? `Payé en ligne (${o.op}) · payeur ${o.payer} · ID ${o.txid}\n⚠️ Vérifiez que l'argent est bien arrivé avant d'expédier.` : "Espèces à la livraison"}
⚠️ Vérifiez aussi que les prix correspondent à votre catalogue.

🔑 Code client : ${o.hand} (le client le montre au livreur)
🔒 Code de livraison : ${o.code}
→ à donner au livreur seulement, jamais au client.

Espace gérant : ${siteUrl(req)}/?admin=${adm}#gerant`);
    send(res, 200, { ok: true, no, hand: o.hand });
  } catch (e) { send(res, 500, { ok: false, error: "Serveur indisponible. Réessayez dans un instant." }) }
}
