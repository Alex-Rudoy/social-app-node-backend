const apiRouter = require("express").Router();
const cors = require("cors");
const userController = require("./controllers/userController");
const postController = require("./controllers/postController");
const followController = require("./controllers/followController");

apiRouter.use(cors());
apiRouter.post("/login", userController.apiLogin);
apiRouter.post("/create-post", userController.apiMustBeLoggedIn, postController.apiCreatePost);
apiRouter.delete("/post/:id", userController.apiMustBeLoggedIn, postController.apiDeletePost);
apiRouter.get("/postsByAuthor/:username", userController.apiGetPostsByUsername);

module.exports = apiRouter;
