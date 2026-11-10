const { processDailySupplySuggestions } = require("../services/supplySuggestionService");
const { getZonedParts } = require("../services/aiDailyReportService");

const REPORT_TZ = process.env.REPORT_CRON_TZ || "Europe/Belgrade";
let lastRunKey = "";

function startSupplySuggestionCron() {}

module.exports = {
  startSupplySuggestionCron,
  processDailySupplySuggestions,
};
