/**
 * Hyrje pronari HOTEL nga gateway (revolution-restaurant-server).
 * Klientët hotel janë në Supabase të hotel-server — jo në DB të restorantit.
 */
const https = require("https");

const HOTEL_UPSTREAM =
  process.env.HOTEL_UPSTREAM || "revolution-hotel-server-production.up.railway.app";

function hotelHostname() {
  return String(HOTEL_UPSTREAM).replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function hotelOwnerApiRequest(path, { method = "GET", body, token } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body != null ? JSON.stringify(body) : null;
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (payload) headers["Content-Length"] = Buffer.byteLength(payload);

    const req = https.request(
      {
        hostname: hotelHostname(),
        port: 443,
        path,
        method,
        headers,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          let parsed = {};
          try {
            parsed = JSON.parse(data || "{}");
          } catch {
            parsed = { gabim: data || "Përgjigje e pavlefshme nga hotel-server." };
          }
          resolve({ status: res.statusCode || 502, body: parsed });
        });
      },
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function hotelOwnerLogin(email, password) {
  return hotelOwnerApiRequest("/api/auth/owner/login", {
    method: "POST",
    body: { email, password },
  });
}

async function hotelOwnerBranding(email) {
  const q = encodeURIComponent(String(email || "").trim());
  return hotelOwnerApiRequest(`/api/auth/owner/branding?email=${q}`, { method: "GET" });
}

module.exports = {
  hotelOwnerLogin,
  hotelOwnerBranding,
  hotelOwnerApiRequest,
};
