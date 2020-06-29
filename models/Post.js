const postsCollection = require("../db").db().collection("posts");
const ObjectID = require("mongodb").ObjectID;
const User = require("./User");

let Post = function (data, userid) {
  this.data = data;
  this.errors = [];
  this.userid = userid;
};

Post.findPostById = async function (id) {
  try {
    if (typeof id != "string" || !ObjectID.isValid(id)) {
      throw Error("Invalid post id");
    }
    let posts = await Post.findPosts([{ $match: { _id: new ObjectID(id) } }]);
    if (posts.length) {
      console.log(posts[0]);
      return posts[0];
    } else {
      throw Error("Can't find this post");
    }
  } catch (e) {
    throw e;
  }
};

Post.findPosts = async function (operations) {
  try {
    let aggOperations = operations.concat([
      { $lookup: { from: "users", localField: "author", foreignField: "_id", as: "authorData" } },
      {
        $project: {
          title: 1,
          body: 1,
          createdDate: 1,
          author: { $arrayElemAt: ["$authorData", 0] },
        },
      },
    ]);
    let posts = await postsCollection.aggregate(aggOperations).toArray();
    posts = posts.map((post) => {
      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).avatar,
      };
      return post;
    });
    return posts;
  } catch (e) {
    throw e;
  }
};

Post.prototype.cleanup = function () {
  if (typeof this.data.title != "string") {
    this.data.title = "";
  }
  if (typeof this.data.body != "string") {
    this.data.body = "";
  }
  this.data = {
    title: this.data.title.trim(),
    body: this.data.body.trim(),
    createdDate: new Date(),
    author: ObjectID(this.userid),
  };
};

Post.prototype.validate = function () {
  if (this.data.title == "") {
    this.errors.push("You must provide a title");
  }
  if (this.data.body == "") {
    this.errors.push("You must provide a content");
  }
};

Post.prototype.create = async function () {
  try {
    this.cleanup();
    this.validate();
    if (!this.errors.length) {
      await postsCollection.insertOne(this.data);
      return true;
    } else {
      let e = new Error();
      e.regErrors = this.errors;
      throw e;
    }
  } catch (e) {
    throw e;
  }
};

Post.findByAuthorId = function (authorId) {
  return Post.findPosts([{ $match: { author: authorId } }, { $sort: { createdDate: -1 } }]);
};

module.exports = Post;
