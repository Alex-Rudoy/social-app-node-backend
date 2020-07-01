const Follow = require("../models/Follow");
const { NoEmitOnErrorsPlugin } = require("webpack");

exports.addFollow = async function (req, res) {
  let follow = new Follow(req.params.username, req.visitorId);
  try {
    await follow.create();
    await req.flash("success", `Successfully followed ${req.params.username}`);
    res.redirect(`/profile/${req.params.username}`);
  } catch (error) {
    error.forEach((error) => {
      req.flash("errors", error);
    });
    await req.session.save();
    res.redirect("/");
  }
};
