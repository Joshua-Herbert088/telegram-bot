const fs = require("fs");

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function loadData(filePath) {
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  }
}

export function saveData(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
