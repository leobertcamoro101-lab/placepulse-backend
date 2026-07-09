const express = require("express");
// const {Router} = require("express");
const { check } = require("express-validator");

const placesControllers = require("../controllers/places-controller");
// const fileUpload = require('../middleware/file-upload');
const fileUpload = require('../middleware/cloudinary');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

// GET /api/places/pid
router.get("/:pid", placesControllers.getPlaceById);
// GET /api/places/user/:uid
router.get("/user/:uid", placesControllers.getPlacesByUserId);
// middleware for without valid token
router.use(checkAuth);

router.post(
  "/",
  fileUpload.single('image'),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  placesControllers.createPlace,
);

router.patch(
  "/:pid",
  [
    check("title").not().isEmpty(), 
    check("description").isLength({ min: 5 })
  ],
  placesControllers.updatePlace,
);

router.delete("/:pid", placesControllers.deletePlace);

module.exports = router;
