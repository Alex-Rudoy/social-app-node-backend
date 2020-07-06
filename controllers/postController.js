const Post = require("../models/Post");
const sendgrid = require("@sendgrid/mail");
sendgrid.setApiKey(process.env.SENDGRIDAPIKEY);

exports.viewSinglePost = async function (req, res) {
  try {
    let post = await Post.findPostById(req.params.id, req.visitorId);
    res.render("single-post", { post: post, pageTitle: post.title });
  } catch (error) {
    res.render("404", { pageTitle: "Page not found" });
  }
};

exports.viewCreateScreen = function (req, res) {
  res.render("create-post", { pageTitle: "Create post" });
};

exports.create = async function (req, res) {
  let post = new Post(req.body, req.session.user._id);
  try {
    postId = await post.create();
    await sendgrid.send({
      to: "rudoy4ik@gmail.com",
      from: "rudoy4ik@gmail.com",
      subject: "New post created",
      text: "Yeeey some1 created a post",
      html: "Yeeey some1 created a <strong>new post</strong>",
    });
    req.flash("success", "New post created");
    await req.session.save();
    res.redirect(`/post/${postId}`);
  } catch (error) {
    if (error.errors) {
      error.errors.forEach((error) => {
        req.flash("errors", error);
      });
      await req.session.save();
      res.redirect("/create-post");
    } else {
      res.send("Some error occured, please, try later - " + error.message);
    }
  }
};

exports.apiCreatePost = async function (req, res) {
  let post = new Post(req.body, req.apiUser._id);
  try {
    postId = await post.create();
    res.json("congratz");
  } catch (error) {
    if (error.errors) {
      res.json(error.errors);
    } else {
      res.json(error);
    }
  }
};

exports.viewEditScreen = async function (req, res) {
  try {
    let post = await Post.findPostById(req.params.id, req.visitorId);
    if (post.isVisitorOwner) {
      res.render("edit-post", { post: post, pageTitle: "Edit post" });
    } else {
      throw Error();
    }
  } catch (error) {
    res.render("404", { pageTitle: "Page not found" });
  }
};

exports.edit = async function (req, res) {
  let post = new Post(req.body, req.visitorId, req.params.id);
  try {
    await post.update();
    req.flash("success", "Post successfully updated");
    await req.session.save();
    res.redirect(`/post/${req.params.id}`);
  } catch (error) {
    if (error.errors) {
      // if some validation errors occured
      error.errors.forEach((error) => {
        req.flash("errors", error);
      });
      await req.session.save();
      res.redirect(`/post/${req.params.id}/edit`);
    } else {
      // if post id doesnt exist
      // if visitor != owner
      req.flash("errors", "You do not have permission to perform this action");
      console.log(error);
      await req.session.save();
      res.redirect("/");
    }
  }
};

exports.delete = async function (req, res) {
  try {
    await Post.delete(req.params.id, req.visitorId);
    req.flash("success", "Post successfully deleted");
    await req.session.save();
    res.redirect(`/profile/${req.session.user.username}`);
  } catch (error) {
    req.flash("errors", "You have no permission to delete this post");
    await req.session.save();
    res.redirect("/");
  }
};

exports.apiDeletePost = async function (req, res) {
  try {
    await Post.delete(req.params.id, req.apiUser._id);
    res.json("Success");
  } catch (error) {
    res.json("You have no permission to perform this action");
  }
};

exports.search = async function (req, res) {
  try {
    const posts = await Post.search(req.body.searchTerm);
    res.json(posts);
  } catch (error) {
    res.json([]);
  }
};
