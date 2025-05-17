require("dotenv").config();
const createApp = require("./src/app.js");
const createCommonUser = require("./src/createCommonUser.js").createCommonUser;

const app = createApp();

const PORT = process.env.SERVER_PORT;

///////////////////// BORRAR
const util = require("util");

console.log("🔍 Middleware stack:");
console.log(
  util.inspect(app._router.stack, {
    showHidden: false,
    depth: null,
    colors: true,
  })
);
///////////////////// BORRAR

app.listen(PORT, async () => {
  console.log("Server is listening");

  if (process.env.NODE_ENV === "production") {
    // TODO IMPORTANT FIRST INIT: Login in frontend as common user and manually create common exercises and templates
    await createCommonUser(`http://backend-service:${process.env.SERVER_PORT}`);
  } else {
    await createCommonUser(`http://localhost:${process.env.SERVER_PORT}`);
  }
});
