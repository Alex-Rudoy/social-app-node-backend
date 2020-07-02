const User = require("../models/User");
const Post = require("../models/Post");
const Follow = require("../models/Follow");

exports.mustBeLoggedIn = async function (req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.flash("errors", "You must be logged in to perform this action");
    await req.session.save();
    res.redirect("/");
  }
};

exports.sharedProfileData = async function (req, res, next) {
  try {
    let isMyProfile = false;
    let isFollowing = false;
    if (req.session.user) {
      isMyProfile = req.profileUser._id.equals(req.session.user._id);
      isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId);
    }
    req.isMyProfile = isMyProfile;
    req.isFollowing = isFollowing;

    //get post and followers counts
    [req.postCount, req.followersCount, req.followingCount] = await Promise.all([
      Post.countPostsByAuthor(req.profileUser._id),
      Follow.countFollowersById(req.profileUser._id),
      Follow.countFollowingById(req.profileUser._id),
    ]);

    next();
  } catch (error) {
    res.send(error);
  }
};

exports.login = async function (req, res) {
  let user = new User(req.body);
  try {
    await user.login();
    req.session.user = {
      username: user.data.username,
      avatar: user.avatar,
      _id: user.data._id,
    };
    req.flash("success", "Successfully logged in");
    await req.session.save();
    res.redirect("/");
  } catch (e) {
    await req.flash("errors", e.message);
    res.redirect("/");
  }
};

exports.logout = async function (req, res) {
  try {
    req.flash("success", "Successfully logged out");
    await req.session.save();
    res.redirect("/");
    await req.session.destroy();
    return true;
  } catch (e) {
    throw e;
  }
};

exports.register = async function (req, res) {
  let user = new User(req.body);
  try {
    await user.register();
    req.session.user = {
      username: user.data.username,
      avatar: user.avatar,
      _id: user.data._id,
    };
    req.flash("success", "Welcome to the website");
    await req.session.save();
    res.redirect("/");
  } catch (e) {
    if (e.regErrors) {
      e.regErrors.forEach((error) => {
        req.flash("regErrors", error);
      });
    } else {
      res.send("Some error occured, please, try later - " + e.message);
    }

    await req.session.save();
    res.redirect("/");
  }
};

exports.home = async function (req, res) {
  try {
    if (req.session.user) {
      let posts = await Post.getFeed(req.session.user._id);
      res.render("home-dashboard", { posts: posts, pageTitle: "Homepage" });
    } else {
      res.render("home-guest", { regErrors: req.flash("regErrors"), pageTitle: "Welcome!" });
    }
  } catch (error) {
    res.send(error);
  }
};

exports.ifUserExists = async function (req, res, next) {
  try {
    req.profileUser = await User.findByUsername(req.params.username);
    next();
  } catch (e) {
    res.render("404", { pageTitle: "Page not found" });
  }
};

exports.profilePosts = async function (req, res) {
  try {
    const posts = await Post.findPostsByAuthorId(req.profileUser._id);
    res.render("profile-posts", {
      currentPage: "posts",
      posts: posts,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isMyProfile: req.isMyProfile,
      counts: {
        postCount: req.postCount,
        followersCount: req.followersCount,
        followingCount: req.followingCount,
      },
      pageTitle: `${req.profileUser.username} profile`,
    });
  } catch (e) {
    res.render("404", { pageTitle: "Page not found" });
  }
};

exports.profileFollowers = async function (req, res) {
  try {
    let followers = await Follow.getFollowersById(req.profileUser._id);
    res.render("profile-followers", {
      currentPage: "followers",
      followers: followers,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isMyProfile: req.isMyProfile,
      counts: {
        postCount: req.postCount,
        followersCount: req.followersCount,
        followingCount: req.followingCount,
      },
      pageTitle: `${req.profileUser.username} profile`,
    });
  } catch (e) {
    res.render("404", { pageTitle: "Page not found" });
    console.log(e);
  }
};

exports.profileFollowing = async function (req, res) {
  try {
    let following = await Follow.getFollowingById(req.profileUser._id);
    res.render("profile-following", {
      currentPage: "following",
      following: following,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isMyProfile: req.isMyProfile,
      counts: {
        postCount: req.postCount,
        followersCount: req.followersCount,
        followingCount: req.followingCount,
      },
      pageTitle: `${req.profileUser.username} profile`,
    });
  } catch (e) {
    res.render("404", { pageTitle: "Page not found" });
    console.log(e);
  }
};
