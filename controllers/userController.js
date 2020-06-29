const User = require("../models/User");

exports.mustBeLoggedIn = async function (req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.flash("errors", "You must be logged in to perform this action");
    await req.session.save();
    res.redirect("/");
  }
};

exports.login = async function (req, res) {
  let user = new User(req.body);
  try {
    await user.login();
    req.session.user = { username: user.data.username, avatar: user.avatar, _id: user.data._id };
    await req.session.save();
    res.redirect("/");
  } catch (e) {
    await req.flash("errors", e.message);
    res.redirect("/");
  }
};

exports.logout = async function (req, res) {
  try {
    await req.session.destroy();
    res.redirect("/");
    return true;
  } catch (e) {
    throw e;
  }
};

exports.register = async function (req, res) {
  let user = new User(req.body);
  try {
    await user.register();
    req.session.user = { username: user.data.username, avatar: user.avatar, _id: user.data._id };
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

exports.home = function (req, res) {
  if (req.session.user) {
    res.render("home-dashboard");
  } else {
    res.render("home-guest", { errors: req.flash("errors"), regErrors: req.flash("regErrors") });
  }
};
