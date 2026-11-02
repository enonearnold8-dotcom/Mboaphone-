import { db, getJSON, send } from "./_lib.js";

export default async function handler(req, res) {
  try {
    const ids = (await db("LRANGE", "photos", 0, 80)) || [];
    const photos = [];
    for (const id of ids) {
      const p = await getJSON(`photo:${id}`);
      if (p && p.pub) photos.push({ id: p.id, name: p.name, city: p.city, item: p.item, date: p.date });
      if (photos.length >= 24) break;
    }
    send(res, 200, { photos });
  } catch (e) { send(res, 200, { photos: [] }) }
}
