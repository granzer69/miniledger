import { createApp } from "./app";
import { config } from "./config";
import { ensureUploadDir } from "./lib/uploads";

ensureUploadDir();

const app = createApp();
app.listen(config.port, "0.0.0.0", () => {
  console.log(`MiniLedger API listening on http://localhost:${config.port}`);
  console.log("Mock OTP codes are printed in this log. The API never returns them.");
});
