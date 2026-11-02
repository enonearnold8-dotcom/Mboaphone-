# MboaPhone

Boutique iPhone et accessoires (Douala, Yaoundé), avec commande sécurisée :
code client à 4 chiffres, code de livraison à 6 chiffres envoyé au gérant sur Telegram,
signature, photo de livraison et reçu PDF.

## Contenu

- `index.html` : tout le site (pages, catalogue, panier, reçu, espace gérant `#gerant`)
- `images/` : photos des produits et logo
- `api/` : le serveur (commandes, codes, photos, espace gérant, messages Telegram)

## Réglages sur Vercel (Settings > Environment Variables)

| Nom | Valeur |
| --- | --- |
| `TELEGRAM_TOKEN` | le token donné par @BotFather |
| `TELEGRAM_CHAT_ID` | ton Id donné par @userinfobot |
| `ADMIN_PIN` | ton code secret pour l'espace gérant (6 caractères minimum) |

La base de données : Vercel > Storage > Upstash (Redis) > Connect.
Elle ajoute seule `KV_REST_API_URL` et `KV_REST_API_TOKEN`.

Important : envoie d'abord `/start` à ton bot sur Telegram, sinon il ne peut pas t'écrire.

## Modifier le site

Modifie un fichier sur GitHub (ou dans VS Code puis Commit et Push) : Vercel remet le site à jour tout seul.
Les prix sont dans `index.html`, dans la liste `IPHONES` et la liste `ACCS`.
