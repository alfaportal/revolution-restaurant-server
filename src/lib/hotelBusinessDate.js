"use strict";
/** Dita e biznesit — Europe/Belgrade (Kosovë), e njëjtë me desktop KAFENE. */

const BUSINESS_TZ = process.env.REPORT_CRON_TZ || "Europe/Belgrade";

const ymdFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function businessYmd(d = new Date()) {
  return ymdFormatter.format(d);
}

function businessYesterdayYmd(d = new Date()) {
  return addBusinessDays(businessYmd(d), -1);
}

function addBusinessDays(ymd, days) {
  const [y, m, day] = String(ymd || "").slice(0, 10).split("-").map(Number);
  if (!y || !m || !day) return businessYmd();
  const dt = new Date(y, m - 1, day);
  dt.setDate(dt.getDate() + Number(days) || 0);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

module.exports = {
  BUSINESS_TZ,
  businessYmd,
  businessYesterdayYmd,
  addBusinessDays,
};
