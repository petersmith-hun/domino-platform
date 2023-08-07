import * as fs from "fs";

const buildTimeFilePath = "../../dist/build-time.json";
const data = JSON.stringify({
	buildTime: new Date()
});

fs.writeFileSync(buildTimeFilePath, data);
