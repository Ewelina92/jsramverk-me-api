const app = require("./app");
const port = process.env.PORT || 1337;

// Start up server
app.listen(port, () => console.log(`Example API listening on port ${port}!`));
