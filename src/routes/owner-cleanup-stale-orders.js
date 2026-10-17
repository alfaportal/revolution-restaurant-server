const { authOwner, ownerOnly } = require("../middleware/auth");
const { cleanupStaleOwnerOrders } = require("../services/salesService");

async function handleCleanupStaleOwnerOrders(req, res) {
  try {
    const clientId = req.user?.client_id;
    if (!clientId) {
      return res.status(401).json({ ok: false, gabim: "Mungon klienti." });
    }
    const result = await cleanupStaleOwnerOrders(clientId, { force: true });
    res.json(result);
  } catch (e) {
    res.status(500).json({ ok: false, gabim: e.message });
  }
}

module.exports = {
  authOwner,
  ownerOnly,
  handleCleanupStaleOwnerOrders,
};
