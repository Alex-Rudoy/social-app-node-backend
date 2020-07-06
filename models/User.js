const bcrypt = require("bcryptjs");
const validator = require("validator");
const usersCollection = require("../db").db().collection("users");
const md5 = require("md5");

let User = function (data, getAvatar) {
  this.data = data;
  this.errors = [];
  if (getAvatar == undefined) {
    getAvatar = false;
  }
  if (getAvatar) {
    this.getAvatar();
  }
};

// input cleanup
User.prototype.cleanup = function () {
  if (typeof this.data.username != "string") {
    this.data.username = "";
  }
  if (typeof this.data.email != "string") {
    this.data.email = "";
  }
  if (typeof this.data.password != "string") {
    this.data.password = "";
  }
  // get rid of other properties
  this.data = {
    username: this.data.username.trim().toLowerCase(),
    email: this.data.email.trim().toLowerCase(),
    password: this.data.password,
  };
};

// registration validation
User.prototype.validate = async function () {
  try {
    // username validation
    if (this.data.username == "") {
      this.errors.push("You must provide a username");
    }
    if (this.data.username.length > 0 && this.data.username.length < 3) {
      this.errors.push("Username should be at least 3 characters");
    }
    if (this.data.username.length > 30) {
      this.errors.push("Username can't exceed 30 characters");
    }
    if (!this.data.username == "" && !validator.isAlphanumeric(this.data.username)) {
      this.errors.push("Username can only contain letters and numbers");
    }
    if (
      this.data.username.length > 2 &&
      this.data.username.length < 31 &&
      validator.isAlphanumeric(this.data.username)
    ) {
      let usernameExists = await usersCollection.findOne({ username: this.data.username });
      if (usernameExists) {
        this.errors.push("This username is already taken");
      }
    }

    // email validation
    if (!validator.isEmail(this.data.email)) {
      this.errors.push("You must provide a valid email address");
    }
    if (this.data.email.length > 100) {
      this.errors.push("Email can't exceed 100 characters");
    }
    if (this.data.email.length < 101 && validator.isEmail(this.data.email)) {
      let emailExists = await usersCollection.findOne({ email: this.data.email });
      if (emailExists) {
        this.errors.push("This email is already registered");
      }
    }

    // password validation
    if (this.data.password == "") {
      this.errors.push("You must provide a password");
    }
    if (this.data.password.length > 0 && this.data.password.length < 8) {
      this.errors.push("Password should be at least 8 characters");
    }
    if (this.data.password.length > 50) {
      this.errors.push("Password can't exceed 50 characters");
    }

    return true;
  } catch (error) {
    throw error;
  }
};

User.prototype.login = async function () {
  try {
    this.cleanup();
    const user = await usersCollection.findOne({ username: this.data.username });
    if (user && bcrypt.compareSync(this.data.password, user.password)) {
      this.data = user;
      this.getAvatar();
      return true;
    } else {
      throw Error("invalid username/password");
    }
  } catch (error) {
    throw error;
  }
};

User.prototype.register = async function () {
  try {
    //validate user data
    this.cleanup();
    await this.validate();

    // if no errors, save to db
    if (!this.errors.length) {
      let salt = bcrypt.genSaltSync(10);
      this.data.password = bcrypt.hashSync(this.data.password, salt);
      usersCollection.insertOne(this.data);
      this.getAvatar();
      return true;
    } else {
      let error = new Error();
      error.regErrors = this.errors;
      throw error;
    }
  } catch (error) {
    throw error;
  }
};

User.prototype.getAvatar = function () {
  this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`;
};

User.findByUsername = async function (username) {
  try {
    if (typeof username != "string") {
      throw Error("Invalid username");
    }
    let user = await usersCollection.findOne({ username: username });
    if (user) {
      user = new User(user, true);
      user = {
        _id: user.data._id,
        username: user.data.username,
        avatar: user.avatar,
      };
      return user;
    } else {
      throw Error("User not found");
    }
  } catch (error) {
    throw error;
  }
};

User.doesEmailExist = async function (email) {
  if (typeof email != "string") {
    return false;
  }
  let user = await usersCollection.findOne({ email: email });
  if (user) {
    return true;
  }
  return false;
};

module.exports = User;
