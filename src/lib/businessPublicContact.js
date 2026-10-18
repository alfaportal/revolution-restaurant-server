/** Kontakt publik i biznesit — vetëm nga pos_settings (jo env Revolution). */

const { getSupabase } = require("../db");
const { getClientBySlugOrId } = require("./kitchenAccess");

function businessContactFromPosSettings(settings) {
  if (!settings) {
    return {
      biz_phone: "",
      biz_email: "",
      biz_address: "",
      biz_phone_digits: "",
    };
  }
  const biz_phone = String(settings.biz_phone ?? settings.phone ?? "").trim();
  const biz_address = String(settings.biz_address ?? settings.address ?? "").trim();
  const biz_email = String(settings.biz_email ?? settings.email ?? "").trim();
  const biz_phone_digits = biz_phone.replace(/\D/g, "");
  return { biz_phone, biz_email, biz_address, biz_phone_digits };
}

async function loadBusinessContactForSlug(slug) {
  const s = String(slug || "").trim();
  if (!s) return businessContactFromPosSettings(null);
  const client = await getClientBySlugOrId(s);
  if (!client) return businessContactFromPosSettings(null);
  const db = getSupabase();
  const { data, error } = await db
    .from("pos_settings")
    .select("*")
    .eq("client_id", client.id)
    .maybeSingle();
  if (error) throw error;
  return businessContactFromPosSettings(data);
}

module.exports = {
  businessContactFromPosSettings,
  loadBusinessContactForSlug,
};
