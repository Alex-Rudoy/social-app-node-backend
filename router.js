const express = require("express");
const router = express.Router();
const userController = require("./controllers/userController");
const postController = require("./controllers/postController");
const followController = require("./controllers/followController");

// user related routes
router.get("/", userController.home);
router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/logout", userController.logout);

// profile related routes
router.get("/profile/:username", userController.ifUserExists, userController.profilePosts);

// post related routes
router.get("/post/:id", postController.viewSinglePost);
router.get("/create-post", userController.mustBeLoggedIn, postController.viewCreateScreen);
router.post("/create-post", userController.mustBeLoggedIn, postController.create);
router.get("/post/:id/edit", userController.mustBeLoggedIn, postController.viewEditScreen);
router.post("/post/:id/edit", userController.mustBeLoggedIn, postController.edit);
router.post("/post/:id/delete", userController.mustBeLoggedIn, postController.delete);
router.post("/search", postController.search);

// follow related routes
router.post("/follow/:username", userController.mustBeLoggedIn, followController.addFollow);

module.exports = router;
