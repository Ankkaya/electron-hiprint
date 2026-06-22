const fs = require("fs");
const path = require("path");

const projectRoot = path.join(__dirname, "..");
const runtimeArtifacts = [
  path.join(projectRoot, "tools", "database.sqlite"),
  path.join(projectRoot, "tools", "database.sqlite-shm"),
  path.join(projectRoot, "tools", "database.sqlite-wal"),
];

for (const filePath of runtimeArtifacts) {
  if (!fs.existsSync(filePath)) continue;
  fs.rmSync(filePath, { force: true });
  console.log(`Removed runtime artifact: ${path.relative(projectRoot, filePath)}`);
}
