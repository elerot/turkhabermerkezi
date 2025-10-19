// Date helper functions
function getDateKey(date) {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

function getHourKey(date) {
  const iso = date.toISOString();
  return iso.split(":")[0]; // YYYY-MM-DDTHH
}

function getTodayKey() {
  return getDateKey(new Date());
}

module.exports = {
  getDateKey,
  getHourKey,
  getTodayKey,
};

