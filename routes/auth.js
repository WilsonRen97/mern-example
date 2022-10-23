const router = require("express").Router();
const registerValidation = require("../validation").registerValidation;
const loginValidation = require("../validation").loginValidation;
const User = require("../models").userModel;
const jwt = require("jsonwebtoken");

// 只要有請求，就會在伺服器上出現
router.use((req, res, next) => {
  console.log("auth.js正在接收一個請求...");
  next();
});

// 用來測試能不能夠連上/auth/user這個route
router.get("/testAPI", (req, res) => {
  const msgObj = {
    message: "Test API 正在正常運作中。。。",
  };
  return res.json(msgObj);
});

// 用來處理註冊新的使用者的route
router.post("/register", async (req, res) => {
  // 確認註冊用的數據符合規範
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // 確認信箱是不是有被註冊過
  const emailExist = await User.findOne({ email: req.body.email });
  if (emailExist) return res.status(400).send("此信箱已經被註冊過了。");

  // 先製作出一個使用者物件
  const newUser = new User({
    email: req.body.email,
    username: req.body.username,
    password: req.body.password,
    role: req.body.role,
  });
  try {
    // 在save之前，schema的middleware會先把密碼做Bcrypt加密，算出雜湊值
    const savedUser = await newUser.save();
    return res.status(200).send({
      msg: "success",
      savedObject: savedUser,
    });
  } catch (err) {
    return res.status(500).send("無法註冊使用者。請聯絡開發人員...");
  }
});

router.post("/login", async (req, res) => {
  // 確認登入用的數據是否符合規範
  const { error } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let foundUser = await User.findOne({ email: req.body.email });
  if (!foundUser) {
    return res
      .status(401)
      .send("無法找到使用者。請再次確認填寫的電子信箱是否正確。");
  }

  foundUser.comparePassword(req.body.password, (err, isMatch) => {
    if (err) return res.status(500).send(err);

    if (isMatch) {
      const tokenObject = { _id: foundUser._id, email: foundUser.email };
      const token = jwt.sign(tokenObject, process.env.PASSPORT_SECRET);
      return res
        .status(200)
        .send({ success: true, token: "JWT " + token, user: foundUser });
    } else {
      return res.status(401).send("密碼錯誤");
    }
  });
});

module.exports = router;
