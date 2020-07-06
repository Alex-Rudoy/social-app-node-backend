const Follow = require("../models/Follow");
const { NoEmitOnErrorsPlugin } = require("webpack");

exports.addFollow = async function (req, res) {
  let follow = new Follow(req.params.username, req.visitorId);
  try {
    await follow.create();
    req.flash("success", `Successfully followed ${req.params.username}`);
    await req.session.save();
    res.redirect(`/profile/${req.params.username}`);
  } catch (error) {
    error.errors.forEach((error) => {
      req.flash("errors", error);
    });
    await req.session.save();
    res.redirect("/");
  }
};

exports.removeFollow = async function (req, res) {
  let follow = new Follow(req.params.username, req.visitorId);
  try {
    await follow.delete();
    req.flash("success", `Successfully unfollowed ${req.params.username}`);
    await req.session.save();
    res.redirect(`/profile/${req.params.username}`);
  } catch (error) {
    error.errors.forEach((error) => {
      req.flash("errors", error);
    });
    await req.session.save();
    res.redirect("/");
  }
};
