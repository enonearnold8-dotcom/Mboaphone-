import { db, getJSON, setJSON, uuid, same, telegram, send, postOnly } from "./_lib.js";

export default async function handler(req, res) {
  if (!postOnly(req, res)) return;
  try {
    const { no, token, image, publish } = req.body || {};
    const o = typeof no === "string" && /^MP-\d{8}-\d{4}$/.test(no) ? await getJSON(`order:${no}`) : null;
    if (!o || !o.token || !same(String(token || ""), o.token)) return send(res, 200, { ok: false, error: "Commande non confirmée." });
    if (o.photoId) return send(res, 200, { ok: true, pub: !!o.photoPub });
    const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(image || ""));
    if (!m || m[1].length > 1_400_000) return send(res, 200, { ok: false, error: "Photo invalide ou trop lourde. Reprenez-la." });
    const id = uuid(), pub = publish === true;
    await db("SET", `img:${id}`, m[1]);
    const first = o.name.split(" ")[0];
    const item = o.items[0] ? o.items[0].name : "commande";
    const date = new Date().toLocaleDateString("fr-FR", { timeZone: "Africa/Douala" });
    await setJSON(`photo:${id}`, { id, no, name: first, city: o.city, item, date, pub });
    await db("LPUSH", "photos", id);
    await db("LTRIM", "photos", 0, 299);
    Object.assign(o, { photoId: id, photoPub: pub, status: "terminée" });
    await setJSON(`order:${no}`, o, 60 * 60 * 24 * 120);
    await telegram(`📷 Photo de livraison reçue pour ${no} (${pub ? "publication acceptée" : "privée"}). Voir dans l'espace gérant.`);
    send(res, 200, { ok: true, pub });
  } catch (e) { send(res, 500, { ok: false, error: "Envoi impossible. Réessayez." }) }
}
