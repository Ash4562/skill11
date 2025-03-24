const express = require("express");
const { getbanner, addBanner, updatebanner, deletebanner, } = require("../../controllers/adminController/fileUploadController");
const { protect } = require("../../middlewares/adminAuthProtected");
const router = express.Router();

router.get("/get", getbanner);
router.post("/add", protect, addBanner);

router.put("/update/:bannerId", protect, updatebanner);


router.delete("/delete/:bannerId", protect, deletebanner);


module.exports = router;
