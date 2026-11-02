import { dbReady, db, send } from "./_lib.js";

export default async function handler(req, res) {
  let ok = false;
  if (dbReady()) { try { ok = (await db("PING")) === "PONG" } catch (e) { ok = false } }
  send(res, 200, { ok: true, db: ok, telegram: !!(process.env.TELEGRAM_TOKEN && process.env.TELEGRAM_CHAT_ID) });
}
