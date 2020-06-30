const Post = require("../models/Post");

exports.viewSinglePost = async function (req, res) {
  try {
    let post = await Post.findPostById(req.params.id, req.visitorId);
    res.render("single-post", { post: post });
  } catch (e) {
    res.render("404");
  }
};

exports.viewCreateScreen = function (req, res) {
  res.render("create-post");
};

exports.create = async function (req, res) {
  let post = new Post(req.body, req.session.user._id);
  try {
    postId = await post.create();
    await req.flash("success", "New post created");
    res.redirect(`/post/${postId}`);
  } catch (e) {
    if (e.errors) {
      e.errors.forEach((error) => {
        req.flash("errors", error);
      });
      await req.session.save();
      res.redirect("/create-post");
    } else {
      res.send("Some error occured, please, try later - " + e.message);
    }
  }
};

exports.viewEditScreen = async function (req, res) {
  try {
    let post = await Post.findPostById(req.params.id, req.visitorId);
    if (post.isVisitorOwner) {
      res.render("edit-post", { post: post });
    } else {
      throw Error();
    }
  } catch (e) {
    res.render("404");
  }
};

exports.edit = async function (req, res) {
  let post = new Post(req.body, req.visitorId, req.params.id);
  try {
    await post.update();
    await req.flash("success", "Post successfully updated");
    res.redirect(`/post/${req.params.id}`);
  } catch (e) {
    if (e.errors) {
      // if some validation errors occured
      e.errors.forEach((error) => {
        req.flash("errors", error);
      });
      await req.session.save();
      res.redirect(`/post/${req.params.id}/edit`);
    } else {
      // if post id doesnt exist
      // if visitor != owner
      req.flash("errors", "You do not have permission to perform this action");
      console.log(e);
      await req.session.save();
      res.redirect("/");
    }
  }
};

exports.delete = async function (req, res) {
  try {
    await Post.delete(req.params.id, req.visitorId);
    await req.flash("success", "Post successfully deleted");
    res.redirect(`/profile/${req.session.user.username}`);
  } catch (e) {
    await req.flash("errors", "You have no permission to delete this post");
    res.redirect("/");
  }
};
