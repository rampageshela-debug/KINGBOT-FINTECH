export const PLANS = {
  FOUNDATION: {
    code: "FOUNDATION",
    name: "Foundation",
    monthlyUsd: 149,
    bots: 1,
    accounts: 1,
    aiMessages: 50,
    features: ["Live TradingView market suite", "1 bot deployment slot", "1 broker/account connection", "Risk Center", "Core analytics", "AI Agent · 50 requests/month"]
  },
  PROFESSIONAL: {
    code: "PROFESSIONAL",
    name: "Professional Desk",
    monthlyUsd: 399,
    bots: 5,
    accounts: 3,
    aiMessages: 300,
    features: ["Everything in Foundation", "5 bot deployment slots", "3 broker/account connections", "Advanced analytics", "Bot Generator templates", "AI Agent · 300 requests/month", "Priority support"]
  },
  QUANT: {
    code: "QUANT",
    name: "Quant Command",
    monthlyUsd: 1250,
    bots: 20,
    accounts: 10,
    aiMessages: 1500,
    features: ["Everything in Professional", "20 bot deployment slots", "10 broker/account connections", "Cross-engine analytics", "AI trade intelligence", "AI Agent · 1,500 requests/month", "Enhanced operational controls"]
  },
  INSTITUTIONAL: {
    code: "INSTITUTIONAL",
    name: "Institutional OS",
    monthlyUsd: 3500,
    bots: 9999,
    accounts: 25,
    aiMessages: 5000,
    features: ["Everything in Quant Command", "Institutional bot capacity", "25 broker/account connections", "Executive analytics", "AI Agent · 5,000 requests/month", "Dedicated support channel", "Advanced governance controls"]
  }
};
export const PLAN_LIST = Object.values(PLANS);
export function getPlan(code) { return PLANS[String(code || "").toUpperCase()] || null; }
