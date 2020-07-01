const usersCollection = require("../db").db().collection("users");
const followsCollection = require("../db").db().collection("follows");
const User = require("./User");
const ObjectID = require("mongodb").ObjectID;

let Follow = function (followedUsername, authorId) {
  this.followedUsername = followedUsername;
  this.authorId = authorId;
  this.errors = [];
};

Follow.prototype.cleanup = function () {
  if (typeof this.followedUsername != "string") {
    this.followedUsername = "";
  }
};

Follow.prototype.validate = async function (action) {
  try {
    let followedAccount = await usersCollection.findOne({
      username: this.followedUsername,
    });
    if (followedAccount) {
      this.followedId = followedAccount._id;
    } else {
      this.errors.push("You can't follow user that doesn't exist");
    }

    let doesFollowExist = await followsCollection.findOne({
      followedId: this.followedId,
      authorId: new ObjectID(this.authorId),
    });
    if (action == "create") {
      if (doesFollowExist) {
        this.errors.push("You are already following this user");
      }
    }
    if (action == "delete") {
      if (!doesFollowExist) {
        this.errors.push("You are not following this user");
      }
    }
    if (this.followedId == this.authorId) {
      this.errors.push("You can't follow yourself");
    }
  } catch (error) {
    throw error;
  }
};

Follow.prototype.create = async function () {
  try {
    this.cleanup();
    await this.validate("create");
    if (!this.errors.length) {
      await followsCollection.insertOne({
        followedId: this.followedId,
        authorId: new ObjectID(this.authorId),
      });
    } else {
      error = new Error();
      error.errors = this.errors;
      throw error;
    }
  } catch (error) {
    throw error;
  }
};

Follow.prototype.delete = async function () {
  try {
    this.cleanup();
    await this.validate("delete");
    if (!this.errors.length) {
      await followsCollection.deleteOne({
        followedId: this.followedId,
        authorId: new ObjectID(this.authorId),
      });
    } else {
      error = new Error();
      error.errors = this.errors;
      throw error;
    }
  } catch (error) {
    throw error;
  }
};

Follow.isVisitorFollowing = async function (followedId, visitorId) {
  try {
    let followDoc = await followsCollection.findOne({
      followedId: followedId,
      authorId: new ObjectID(visitorId),
    });
    if (followDoc) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    throw error;
  }
};

Follow.getFollowersById = async function (id) {
  try {
    let followers = await followsCollection
      .aggregate([
        { $match: { followedId: id } },
        {
          $lookup: {
            from: "users",
            localField: "authorId",
            foreignField: "_id",
            as: "userData",
          },
        },
        {
          $project: {
            username: { $arrayElemAt: ["$userData.username", 0] },
            email: { $arrayElemAt: ["$userData.email", 0] },
          },
        },
      ])
      .toArray();
    followers = followers.map((follower) => {
      follower.username = follower.username;
      follower.avatar = new User(follower, true).avatar;
      return follower;
    });
    return followers;
  } catch (error) {
    throw error;
  }
};

Follow.getFollowingById = async function (id) {
  try {
    let following = await followsCollection
      .aggregate([
        { $match: { authorId: id } },
        {
          $lookup: {
            from: "users",
            localField: "followedId",
            foreignField: "_id",
            as: "userData",
          },
        },
        {
          $project: {
            username: { $arrayElemAt: ["$userData.username", 0] },
            email: { $arrayElemAt: ["$userData.email", 0] },
          },
        },
      ])
      .toArray();
    following = following.map((follower) => {
      follower.username = follower.username;
      follower.avatar = new User(follower, true).avatar;
      return follower;
    });
    return following;
  } catch (error) {
    throw error;
  }
};

Follow.countFollowersById = async function (id) {
  try {
    let followersCount = await followsCollection.countDocuments({ followedId: id });
    return followersCount;
  } catch (error) {
    throw error;
  }
};

Follow.countFollowingById = async function (id) {
  try {
    let followingCount = await followsCollection.countDocuments({ authorId: id });
    return followingCount;
  } catch (error) {
    throw error;
  }
};

module.exports = Follow;
