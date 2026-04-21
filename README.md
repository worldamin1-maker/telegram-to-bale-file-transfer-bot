# Telegram to Bale File Transfer Bot

This is a Cloudflare Worker script that acts as a bridge to forward files from a Telegram bot to a Bale bot securely. Only authorized users defined in the configuration can use this bot.

## Features
- **File Forwarding**: Forwards Documents, Photos, Videos, and Audio files from Telegram to Bale.
- **Authorization**: Restricts usage to specific mapped users, preventing abuse.
- **Max File Size**: Supports transferring files up to 20 MB (Telegram API limit for bots).
- **Serverless**: Runs on Cloudflare Workers (No need for a VPS).

---

## Prerequisites
1. **Cloudflare Account**: [Sign up here](https://dash.cloudflare.com/sign-up).
2. **Telegram Bot Token**: Get it from [@BotFather](https://t.me/BotFather).
3. **Bale Bot Token**: Get it from [@BotFather](https://ble.ir/botfather) in the Bale messenger.
4. **User IDs**: 
   - Get the Telegram User ID (e.g., using [@userinfobot](https://t.me/userinfobot))
   - Get the Bale User ID (e.g., using [@userinfo_idbot](https://ble.ir/userinfo_idbot))

---

## Configuration

Before deploying, you must configure your bot credentials and authorized users in `index.js`.

Open `index.js` and edit the following variables at the top of the file:

```javascript
const BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN"; // Replace with your Telegram bot token
const BALE_BOT_TOKEN = "YOUR_BALE_BOT_TOKEN"; // Replace with your Bale bot token
const BOT_WEBHOOK = "/endpoint"; // You can change this or leave it as is

// User Mapping: Telegram Sender → Bale Recipient
const USER_MAPPING = {
  "tg_user_id": "bale_user_id", // e.g., "123456789": "987654321"
};
```

---

## Deployment

You can deploy this worker using two methods: utilizing `npm` (Wrangler CLI) or manually via the Cloudflare Dashboard.

### Method 1: Using npm (Wrangler) - Recommended

This method requires [Node.js](https://nodejs.org/) installed on your machine.

1. **Install dependencies:**
   Open your terminal in the project directory and run:
   ```bash
   npm install
   ```

2. **Login to Cloudflare:**
   Authenticate Wrangler with your Cloudflare account:
   ```bash
   npx wrangler login
   ```

3. **Deploy the Worker:**
   Upload the code to Cloudflare Workers:
   ```bash
   npm run deploy
   ```
   *(This runs `wrangler deploy` as defined in `package.json`)*.

4. Once the deployment is complete, Wrangler will output your worker's live URL (e.g., `https://telegram-file-transfer.<your-subdomain>.workers.dev`).

### Method 2: Manual Deployment via Cloudflare Dashboard

If you prefer not to use `.npm`, you can copy and paste the code directly in the browser:

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. On the left sidebar, navigate to **Workers & Pages**.
3. Click the **Create Worker** button.
4. Name your worker (e.g., `telegram-file-transfer`) and click **Deploy**.
5. Once created, click on **Edit Code** in the upper right corner.
6. Delete the default generated code.
7. Open `index.js` on your computer, copy all the contents, and paste them into the Cloudflare editor.
8. Make sure you have updated the configuration (`BOT_TOKEN`, `BALE_BOT_TOKEN`, `USER_MAPPING`) directly in the editor.
9. Click **Save and Deploy**.
10. Note your worker's final URL (e.g., `https://telegram-file-transfer.<your-subdomain>.workers.dev`).

---

## Setting Up the Webhook

After deploying the worker via either method, Telegram does not yet know to send messages to your Cloudflare Worker. You must register the webhook.

1. Open a web browser.
2. Go to the following URL format based on your worker's domain:
   ```
   https://YOUR_WORKER_DOMAIN.workers.dev/registerWebhook
   ```
   *(Example: `https://telegram-file-transfer.myusername.workers.dev/registerWebhook`)*

3. The page should return a JSON response similar to `{"ok":true,"result":true,"description":"Webhook was set"}`.

## Usage
1. Open your Telegram bot.
2. Send `/start` to verify the bot is responding.
3. Send any file, photo, video, or audio (under 20MB). 
4. The bot will download it and automatically upload it to the corresponding Bale user.
