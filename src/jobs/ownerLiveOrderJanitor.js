const {
  janitorCancelStaleOpenOrdersAllClients,
} = require("../services/salesService");

const INTERVAL_MS = 5 * 60 * 1000;

function startOwnerLiveOrderJanitor() {
  const run = () => {
    janitorCancelStaleOpenOrdersAllClients().catch((err) => {
      console.warn("[owner-live-janitor]", err.message || err);
    });
  };
  run();
  setInterval(run, INTERVAL_MS);
}

module.exports = { startOwnerLiveOrderJanitor };
