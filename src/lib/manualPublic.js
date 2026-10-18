/** Manuali publik — ndiz me MANUAL_PUBLIC=1. */
function isManualPublic() {
  return process.env.MANUAL_PUBLIC === "1";
}

module.exports = { isManualPublic };
