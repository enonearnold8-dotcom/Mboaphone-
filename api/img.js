import { db, getJSON, isAdmin } from "./_lib.js";

export default async function handler(req, res) {
  try {
    const id = String(req.query.id || "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(404).end();
    const p = await getJSON(`photo:${id}`);
    if (!p) return res.status(404).end();
    if (!p.pub && !(await isAdmin(String(req.query.t || "")))) return res.status(403).end();
    const b64 = await db("GET", `img:${id}`);
    if (!b64) return res.status(404).end();
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", p.pub ? "public, max-age=3600" : "private, no-store");
    res.status(200).send(Buffer.from(b64, "base64"));
  } catch (e) { res.status(500).end() }
}
