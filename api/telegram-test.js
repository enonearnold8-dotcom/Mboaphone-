// Diagnostic Telegram : /api/telegram-test?pin=TON_ADMIN_PIN
import { same, send } from "./_lib.js";

export default async function handler(req, res) {
  const pin = (process.env.ADMIN_PIN || "").trim();
  if (!pin || !same(String(req.query.pin || "").trim(), pin)) return send(res, 403, { ok: false, erreur: "Ajoute ?pin=TON_ADMIN_PIN à la fin de l'adresse." });
  const t = (process.env.TELEGRAM_TOKEN || "").trim(), chat = (process.env.TELEGRAM_CHAT_ID || "").trim();
  const out = { token_present: !!t, chat_id_enregistre: chat || "(vide)" };
  if (!t) return send(res, 200, { ...out, conseil: "TELEGRAM_TOKEN manque sur Vercel." });
  const call = async (m, body) => { try { const r = await fetch(`https://api.telegram.org/bot${t}/${m}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) }); return await r.json() } catch (e) { return { ok: false, description: String(e) } } };
  const me = await call("getMe");
  out.bot = me.ok ? "@" + me.result.username : "TOKEN INVALIDE : " + me.description;
  if (!me.ok) return send(res, 200, { ...out, conseil: "Recopie le token exact de BotFather dans TELEGRAM_TOKEN, puis redéploie." });
  const s = chat ? await call("sendMessage", { chat_id: chat, text: "✅ Test MboaPhone : ton bot peut t'écrire." }) : { ok: false, description: "chat id vide" };
  out.message_envoye = s.ok;
  if (!s.ok) out.erreur_telegram = s.description;
  const u = await call("getUpdates", { limit: 20 });
  const ids = [...new Set((u.result || []).map(x => x.message && x.message.chat && `${x.message.chat.id} (${x.message.chat.first_name || x.message.chat.title || ""})`).filter(Boolean))];
  if (ids.length) out.chat_id_correct_probable = ids;
  out.conseil = s.ok ? "Tout marche : regarde ton Telegram." : ids.length ? "Mets le nombre de chat_id_correct_probable dans TELEGRAM_CHAT_ID sur Vercel, puis redéploie." : "Envoie un message à ton bot sur Telegram, puis recharge cette page.";
  send(res, 200, out);
}
