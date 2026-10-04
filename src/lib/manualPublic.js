/** Manuali publik — ndiz me MANUAL_PUBLIC=1 ose ndrysho default kur Naseri thotë. */
function isManualPublic() {
  return process.env.MANUAL_PUBLIC === "1";
}

module.exports = { isManualPublic };
