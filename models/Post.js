const postsCollection = require("../db").db().collection("posts");
const ObjectID = require("mongodb").ObjectID;
const User = require("./User");
const sanitizeHTML = require("sanitize-html");

let Post = function (data, userid, requestedPostId) {
  this.data = data;
  this.errors = [];
  this.userid = userid;
  this.requestedPostId = requestedPostId;
};

Post.findPostById = async function (id, visitorId) {
  try {
    if (typeof id != "string" || !ObjectID.isValid(id)) {
      throw Error("Invalid post id");
    }
    let posts = await Post.reusablePostsQuery([{ $match: { _id: new ObjectID(id) } }], visitorId);
    if (posts.length) {
      return posts[0];
    } else {
      throw Error("Can't find this post");
    }
  } catch (e) {
    throw e;
  }
};

Post.findPostsByAuthorId = function (authorId) {
  return Post.reusablePostsQuery([{ $match: { author: authorId } }, { $sort: { createdDate: -1 } }]);
};

Post.reusablePostsQuery = async function (operations, visitorId) {
  try {
    let aggOperations = operations.concat([
      { $lookup: { from: "users", localField: "author", foreignField: "_id", as: "authorData" } },
      {
        $project: {
          title: 1,
          body: 1,
          createdDate: 1,
          authorId: "$author",
          author: { $arrayElemAt: ["$authorData", 0] },
        },
      },
    ]);
    let posts = await postsCollection.aggregate(aggOperations).toArray();
    posts = posts.map((post) => {
      post.isVisitorOwner = post.authorId.equals(visitorId);
      post.authorId = undefined;
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
    title: sanitizeHTML(this.data.title.trim(), { allowedTags: [], allowedAttributes: {} }),
    body: sanitizeHTML(this.data.body.trim(), { allowedTags: [], allowedAttributes: {} }),
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
      let post = await postsCollection.insertOne(this.data);
      return post.insertedId;
    } else {
      let e = new Error();
      e.errors = this.errors;
      throw e;
    }
  } catch (e) {
    throw e;
  }
};

Post.prototype.update = async function () {
  try {
    let post = await Post.findPostById(this.requestedPostId, this.userid);
    if (post.isVisitorOwner) {
      this.cleanup();
      this.validate();
      if (!this.errors.length) {
        await postsCollection.findOneAndUpdate(
          { _id: new ObjectID(this.requestedPostId) },
          { $set: { title: this.data.title, body: this.data.body } }
        );
        return true;
      } else {
        let e = new Error();
        e.errors = this.errors;
        throw e;
      }
    } else {
      throw Error;
    }
  } catch (e) {
    throw e;
  }
};

Post.delete = async function (postId, visitorId) {
  try {
    let post = await Post.findPostById(postId, visitorId);
    if (post.isVisitorOwner) {
      await postsCollection.deleteOne({ _id: new ObjectID(postId) });
      return true;
    } else {
      throw Error();
    }
  } catch (e) {
    throw e;
  }
};

Post.search = async function (searchTerm) {
  try {
    if (typeof searchTerm == "string") {
      let posts = await Post.reusablePostsQuery([
        { $match: { $text: { $search: searchTerm } } },
        { $sort: { score: { $meta: "textScore" } } },
      ]);
      return posts;
    } else {
      throw Error("Invalid search");
    }
  } catch (error) {
    throw error;
  }
};

module.exports = Post;
