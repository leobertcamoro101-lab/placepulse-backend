const { validationResult } = require("express-validator");
const bcrypt =require('bcryptjs');
const jwt = require('jsonwebtoken');

const HttpError = require("../models/http-error");
const User = require('../models/user')

const getUsers = async (req, res, next) => {
  
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (err) {
    const error = new HttpError(
      "Fetching failed, please try again later", 
      500
    );
    return next(error)
  }
  res.json({users: users.map(user =>user.toObject({getters: true}))})
};

const signup = async (req, res, next) => {
  const errors = validationResult(req); // this will throw an error if there are validation errors, and it will be caught by the error handling middleware in app.js
  if (!errors.isEmpty()) {
    //console.log(errors);
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422),
    );
  }
  const { name, email, password } = req.body;

  let existingUser;
  //udemy code here>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later",
      500,
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "User exists already, please login instead",
      422
    );
    return next(error);
  }
  // >>>>>>>>>>>>>>>>to here

// >>>>>> claude code here>>>>>>>>>>>>>>>>>>>>
  // try {
  //   existingUser = await User.findOne({ email: email });
  // } catch (err) {
  //   return next(new HttpError("Signing up failed, please try again later.", 500));
  // }

  // if (existingUser) {
  //   return next(new HttpError("User exists already, please login instead.", 422));
  // }
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>> to here

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      "Could not create user, please try again.",
      500
    );
    return next(error);
  }
  

  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
    places: [],
  });
  // udemy code >>>> from here
  try {
      await createdUser.save();
    } catch (err) {
      const error = new HttpError(
        "Signing Up failed, please try again.",
        500,
      );
      return next(error);
    }

    let token;
    try {
      token = jwt.sign(
        { userId: createdUser.id, email: createdUser.email },
        process.env.JWT_KEY,
        { expiresIn: "1h" },
      );
    } catch (err) {
      const error = new HttpError(
        "Signing Up failed, please try again.", 
        500
      );
      return next(error);
    }
    

    //>>>>>>>>>>>>>>>>>>>>>>>to here

    //claude code do not erase >>>>>>>> from here
    // try {
    //   await createdUser.save();
    // } catch (err) {
    //   // ✅ MongoDB duplicate key error code
    //   if (err.code === 11000) {
    //     return next(
    //       new HttpError("Email already exists, please login instead.", 422),
    //     );
    //   }
    //   return next(new HttpError("Signing up failed, please try again.", 500));
    // }
    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> to here

  res.status(201).json({ userId: createdUser.id, email: createdUser.email, token: token }); // <<<<<<<<<<<<<<<< remove from that because of added token "createdUser.toObject({ getters: true })"
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500,
    );
    return next(error);
  }

  if(!existingUser) {                         // <<<<<<<< remove from that because of added hash "|| existingUser.password !== password"
    const error = new HttpError(
      'Invalid credentials, could not log you in', 
      403
    );
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      "Could not log in, please check your credentials and try again",
      500,
    );
    return next(error);
  }

  if(!isValidPassword){
    const error = new HttpError(
      'Invalid credentials, could not log you in', 
      403
    );
    return next(error);
  }
  
  let token;
    try {
      token = jwt.sign(
        { userId: existingUser.id, email: existingUser.email },
        process.env.JWT_KEY,
        { expiresIn: "1h" },
      );
    } catch (err) {
      const error = new HttpError(
        "Signing Up failed, please try again.", 
        500
      );
      return next(error);
    }

  res.json({
    // message: "Logged in!", // <<<<<<<<<<<<<<<< remove from that because of added token
    // user: existingUser.toObject({ getters: true }),
    userId: existingUser.id,
    email: existingUser.email,
    token: token
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
