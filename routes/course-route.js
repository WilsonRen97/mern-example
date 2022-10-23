const router = require("express").Router();
const Course = require("../models").courseModel;
const courseValidation = require("../validation").courseValidation;

router.use((req, res, next) => {
  console.log("course-route.js正在接收一個新的請求。");
  next();
});

// 獲得系統中的所有課程
router.get("/", async (req, res) => {
  try {
    let foundCourses = await Course.find({}).populate("instructor", [
      "username",
      "email",
    ]);
    return res.send(foundCourses);
  } catch (e) {
    return res.status(500).send(err);
  }
});

// 用講師的id來找所有跟此講師有關的課程
router.get("/instructor/:_instructor_id", (req, res) => {
  let { _instructor_id } = req.params;
  Course.find({ instructor: _instructor_id })
    .populate("instructor", ["username", "email"])
    .then((data) => {
      res.send(data);
    })
    .catch(() => {
      res.status(500).send("無法獲得課程資訊。請聯絡開發人員。");
    });
});

// 用課程名稱來尋找課程
router.get("/findByName/:name", (req, res) => {
  let { name } = req.params;
  Course.find({ title: name })
    .populate("instructor", ["username", "email"])
    .then((course) => {
      res.status(200).send(course);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

// 用student id來尋找學生註冊過的課程
router.get("/student/:_student_id", (req, res) => {
  let { _student_id } = req.params;
  Course.find({ students: _student_id })
    .populate("instructor", ["username", "email"])
    .then((courses) => {
      res.status(200).send(courses);
    })
    .catch(() => {
      res.status(500).send("Cannot get data.");
    });
});

// 用課程的id來找課程
router.get("/:_id", async (req, res) => {
  let { _id } = req.params;
  try {
    let foundCourse = await Course.findOne({ _id }).populate("instructor", [
      "email",
    ]);
    console.log(foundCourse);
    return res.send(foundCourse);
  } catch (e) {
    return res.send(e);
  }
});

// 創建一個新的課程
router.post("/", async (req, res) => {
  // 在創建新課程之前，驗證所有的值都符合規範
  const { error } = courseValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let { title, description, price } = req.body;
  if (req.user.isStudent()) {
    return res
      .status(400)
      .send("只有講師可以發布新課程。若你已經是講師，請透過講師帳號登入系統。");
  }

  // 創建Course物件
  let newCourse = new Course({
    title,
    description,
    price,
    instructor: req.user._id,
  });

  try {
    await newCourse.save();
    res.status(200).send("新課程已保存。");
  } catch (err) {
    res.status(500).send("系統錯誤。");
  }
});

// 讓學生註冊一個新的課程
router.post("/enroll/:_id", async (req, res) => {
  let { _id } = req.params;
  try {
    let course = await Course.findOne({ _id });
    course.students.push(req.user._id);
    await course.save();
    res.send("註冊完成");
  } catch (err) {
    res.send(err);
  }
});

// 修改現有的課程資料
router.patch("/:_id", async (req, res) => {
  // 驗證所有的值都符合規範
  const { error } = courseValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let { _id } = req.params;
  let course = await Course.findOne({ _id });
  if (!course) {
    return res.status(404).json({
      success: false,
      message: "找不到課程。",
    });
  }

  // 若用戶是課程的老師或是管理員，才能編輯課程
  if (course.instructor.equals(req.user._id) || req.user.isAdmin()) {
    Course.findOneAndUpdate({ _id }, req.body, {
      new: true,
      runValidators: true,
    })
      .then(() => {
        return res.send("課程已被更新。");
      })
      .catch((e) => {
        return res.send({
          success: false,
          message: e,
        });
      });
  } else {
    return res.status(403).json({
      success: false,
      message: "只有本課程的講師或管理員可以編輯本課程。",
    });
  }
});

// 透過課程id來刪除一個現有的課程
router.delete("/:_id", async (req, res) => {
  let { _id } = req.params;
  let course = await Course.findOne({ _id });
  if (!course) {
    return res.status(404).json({
      success: false,
      message: "找不到課程。",
    });
  }

  if (course.instructor.equals(req.user._id) || req.user.isAdmin()) {
    Course.deleteOne({ _id })
      .then(() => {
        return res.send("課程已被刪除。");
      })
      .catch((e) => {
        return res.send({
          success: false,
          message: e,
        });
      });
  } else {
    return res.status(403).json({
      success: false,
      message: "只有本課程的講師或管理員可以刪除本課程。",
    });
  }
});

module.exports = router;
