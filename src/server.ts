import initApp from "./index";
import config from "./configs/envVar";
import fs from "fs";
import https from "https";
import http from "http";

const PORT = config.PORT;
const HTTPS_PORT = config.HTTPS_PORT;

initApp().then((app) => {
  if (process.env.NODE_ENV !== "production") {
    http.createServer(app).listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } else {
    const httpsOptions = {
      key: fs.readFileSync(config.HTTPS_KEY_PATH),
      cert: fs.readFileSync(config.HTTPS_CERT_PATH),
    };

    https.createServer(httpsOptions, app).listen(HTTPS_PORT, () => {
      console.log(`Server is running on https with port ${HTTPS_PORT}`);
    });
  }
});
