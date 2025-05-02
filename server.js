require("dotenv").config();
const createApp = require("./src/app.js");
const createCommonUser = require("./src/createCommonUser.js").createCommonUser;

const app = createApp();
const PORT = process.env.SERVER_PORT;
app.listen(PORT, async () => {
  console.log("Server is listening");

  if (process.env.NODE_ENV === "production") {
    // TODO IMPORTANT FIRST INIT: MAKE cookies insecure and sameSite: lax in app.js for initial setup, then
    // make them secure again
    await createCommonUser(`http://backend-service:${process.env.SERVER_PORT}`);
  } else {
    await createCommonUser(`http://localhost:${process.env.SERVER_PORT}`);
  }
});
