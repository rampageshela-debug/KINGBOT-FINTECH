# KINGBOT FINTECH · BOT KING 2.0

KINGBOT FINTECH is a controlled trading-technology operating system for strategy research, market visualization, AI-assisted analysis, risk governance, broker connectivity and auditable automation.

## Product surface

### Customer workspace
- Command Dashboard
- Bot Generator with 13 strategy engines
- KING AI Agent (server-side Gemini integration)
- Live Markets and Watchlist using TradingView chart widgets
- Analytics from recorded trade ledger data only
- Risk Center with independent drawdown / position controls
- Trading Accounts / broker connector registry
- Subscription & payment-approval workflow
- Security Center
- Notifications / audit activity
- Support ticket desk
- Profile and Settings
- Five visual themes: Obsidian, Matrix, Royal Violet, Arctic, Ember

### Private control planes
- **Admin Control**: only users whose email is in `ADMIN_EMAILS` receive the admin role. Payment approvals and support operations live here.
- **Developer OS**: only users whose email is in `DEVELOPER_EMAILS` receive the developer role. Runtime application settings and engineering inventory live here.

## Access model

Protected actions are enforced server-side:

1. Account registration requires email + country-coded phone.
2. Email and phone verification must complete before broker-account registration.
3. Bot creation requires an active, admin-approved subscription.
4. Broker connector registration requires an active, admin-approved subscription.
5. Live execution remains disabled by default through `TRADING_ENABLED=false`.
6. Strategy modules never place broker orders directly.

The current payment flow is an approval workflow: a user submits a payment method + transaction reference, and an authorized admin approves or rejects it. Automatic M-Pesa/card settlement is a separate provider integration step.

## Premium plan model

| Plan | Monthly | Bot capacity | Accounts | AI allowance |
| --- | ---: | ---: | ---: | ---: |
| Foundation | $149 | 1 | 1 | 50 |
| Professional Desk | $399 | 5 | 3 | 300 |
| Quant Command | $1,250 | 20 | 10 | 1,500 |
| Institutional OS | $3,500 | 9,999 | 25 | 5,000 |

These are product-design prices for this platform, not a claim about market-standard pricing.

## AI

The KING AI endpoint uses Google's current JavaScript GenAI SDK and the configured Gemini model. The API key stays server-side. AI responses are explicitly instructed not to execute, authorize or fabricate broker trades.

Required variables:
- `GEMINI_API_KEY`
- `GEMINI_MODEL`

## Identity verification

Production verification providers:
- **Resend** for email verification
- **Twilio Verify** for SMS verification

Required variables:
`RESEND_API_KEY`, `RESEND_FROM`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`

## Render

The repo contains a Blueprint that:
- deploys the API service as `kingbot-fintech-api`
- deploys the frontend as `kingbot-fintech-ui`
- wires `DATABASE_URL` from the existing Postgres resource `kingbot-fintech-db`
- generates `SESSION_SECRET`
- leaves third-party secrets as dashboard-supplied values

For a clean multi-resource setup, sync the Blueprint in the Render Dashboard and provide the secret environment variables.

## Bot template images

Add preferred bot images under:

`public/assets/bots/`

Expected filenames are listed in `public/assets/bots/README.md`.

## Engineering truth

The project does **not** claim that any strategy is profitable or guaranteed. Trading performance pages intentionally calculate from recorded trade rows. The market page uses TradingView's embedded charting interface. Live broker execution is a separate verification and connector phase.

## Local development

Requires Node.js 20+.

```bash
npm install
NODE_ENV=development SESSION_SECRET=local-secret DATABASE_URL=postgres://... npm start
```

Tests:

```bash
npm test
```
