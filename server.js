const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const authRoute = require("./routes").auth;
const courseRoute = require("./routes").course;
const passport = require("passport");
require("./config/passport")(passport);
const cors = require("cors");
// const path = require("path");
const port = process.env.PORT || 8080;

// 連結MongoDB
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log("Connecting to mongodb...");
  })
  .catch((e) => {
    console.log(e);
  });

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
// app.use(express.static(path.join(__dirname, "client", "build")));

// 註冊、登入會員所使用的routes
app.use("/api/user", authRoute);

// course route已經被JWT保護起來。如果request的header當中沒有
// 任何JWT的令牌，那麼請求就會被認定是unauthorized。
app.use(
  "/api/courses",
  passport.authenticate("jwt", { session: false }),
  courseRoute
);

// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "client", "build", "index.html"));
// });

app.listen(port, () => {
  console.log("Server running on port 8080.");
});
