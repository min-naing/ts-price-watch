# Price Watch

E-commerce price tracker that monitors product prices and sends Telegram alerts when prices drop.

## How It Works

```
GitHub Actions (every 6 hours)
         ↓ triggers
Playwright scraper (188 products, 12 pages)
         ↓ saves to               ↓ price dropped?
MongoDB Atlas                Telegram Bot alert
(time series)
```

## Demo

### Scraper Running on GitHub Actions
![GitHub Actions](assets/github-actions.png)

### Telegram Price Drop Alert
![Telegram Alert](assets/telegram-alert.png)

## Features

- Scrapes 188 products across 12 pages
- Detects sale prices vs normal prices
- Identifies variant vs simple products
- Stores price history in MongoDB time series collection
- Sends Telegram alert when price drops
- Runs automatically every 6 hours via GitHub Actions

## Tech Stack

- Node.js 24 + TypeScript
- Playwright (browser automation)
- MongoDB Atlas (time series collection)
- Telegram Bot API
- GitHub Actions (scheduling)

## Local Setup

1. Clone the repo
2. Install dependencies
   ```bash
   npm install
   ```
3. Install Playwright browser
   ```bash
   npx playwright install chromium
   ```
4. Copy `.env.example` to `.env` and fill in your values
   ```bash
   cp .env.example .env
   ```
5. Run the scraper once
   ```bash
   node src/scraper/run-once.ts
   ```

## Deployment (GitHub Actions)

1. Push the repository to GitHub
2. Go to **Settings → Secrets and variables → Actions**
3. Add the following repository secrets:
   - `MONGODB_URI`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `ATLAS_PUBLIC_KEY`
   - `ATLAS_PRIVATE_KEY`
   > **Note:** `ATLAS_PUBLIC_KEY` and `ATLAS_PRIVATE_KEY` are MongoDB Atlas Organization API key.\
   > Go to **Organization → Applications → API Keys → Create API Key** and set the permission to **Organization Member** role.\
   > To grant the API key access to your Project, go to **Users page in Project Identity & Access → Invite to Project** with the **Project Network Access Manager** role.
4. Add the following repository variable:
   - `ATLAS_GROUP_ID`
   > **Note:** `ATLAS_GROUP_ID` is your Project ID, found under your **Project Settings**.
5. Go to the **Actions** tab and trigger manually via **"Run workflow"**

The scraper will then run automatically every 6 hours.