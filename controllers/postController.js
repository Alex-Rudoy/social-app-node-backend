const Post = require("../models/Post");

exports.viewSinglePost = async function (req, res) {
  try {
    postData = await Post.findPostById(req.params.id);
    res.render("single-post", { postData: postData });
  } catch (e) {
    console.log(e);
    res.render("404");
  }
};

exports.viewCreateScreen = function (req, res) {
  res.render("create-post");
};

exports.create = async function (req, res) {
  let post = new Post(req.body, req.session.user._id);
  try {
    await post.create();
    res.send("new post created");
  } catch (e) {
    res.send(e);
  }
};
