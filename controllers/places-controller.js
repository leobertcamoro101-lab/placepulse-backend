const fs = require('fs')
const { validationResult } = require("express-validator");
const mongoose = require('mongoose');
// const { default: mongoose } = require("mongoose"); // you can do this also

const HttpError = require("../models/http-error");
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');
const User = require('../models/user');

//arrow function
const getPlaceById = async (req, res, next) => {
  //   console.log("GET Request to places");
  const placeId = req.params.pid; 
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a place",
      500,
    );
    return next(error);
  }
  
  if (!place) {
    const error = new HttpError(
      "Could not find a place for the provided id.",
      404,
    );
    return next(error);
  }
  res.json({ place: place.toObject({getters: true }) }); // => { place } => { place: place } you can shortened it because the key and value are the same
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  // let places;
  // try {
  //   places = await Place.find({ creator: userId });
  // } catch (err) {
  //   const error = new HttpError(
  //     "Fetching places failed, please try again late",
  //     500,
  //   );
  //   return next(error);
  // }

  // get user alternatives with populate
  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate('places')
  } catch (err) {
    const error = new HttpError(
      "Fetching places failed, please try again later",
      500,
    );
    return next(error);
  }

  // if (!places || places.length === 0) {
  //   // Model error
  //   return next(
  //     new HttpError("Could not find a places for the provided user id.", 404),
  //   );

  // get alternatives
  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    // Model error
    return next(
      new HttpError("Could not find a places for the provided user id.", 404),
    );

  }

  // res.json({ places: places.map(place => place.toObject({getters: true})) });
  
  // get alternatives
  res.json({ places: userWithPlaces.places.map(place => place.toObject({getters: true})) });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req); // this will throw an error if there are validation errors, and it will be caught by the error handling middleware in app.js
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs passed, please check your data.", 422));
  }
  const { title, description, address } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch(error) {
    return next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator: req.userData.userId  // better approach // than req.body.creator because we don't want the user to be able to set the creator of the place, we want to get it from the token that we decoded in the check-auth middleware
  });

  let user;
  try{
    user = await User.findById(req.userData.userId )
  } catch (err) {
    const error = new HttpError(
      'Creating place failed, please try again',
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError(
      'Could not find user for for provided id', 
      404
    );
    return next(error);
  }

  console.log(user);

  try {
    // await createdPlace.save(); // replace because of added relation or session and transactions
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({session: sess});
    user.places.push(createdPlace);
    await user.save({session: sess});
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Creating place failed, please try again.",
      500
    );
    return next(error);
  }
  
  res.status(201).json({ place: createdPlace }); // 201 means created, convention for REST APIs, and we send the created place back to the client in the response body
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);  // this will throw an error if there are validation errors, and it will be caught by the error handling middleware in app.js
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422),
    );
  }
  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something wrong, could not update place.",
      500,
    );
    return next(error);
  }
  // security check to make sure that the user who is trying to update the place is the creator of the place
  if (place.creator.toString() !== req.userData.userId) {
    const error = new HttpError("You are not allowed to edit this place.", 401);
    return next(error);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place",
      500,
    );
    return next(error);
  }
 
  res.status(200).json({ place: place.toObject({ getters: true}) });
};
const deletePlace =  async (req, res, next) => {
  const placeId = req.params.pid;
  
  let place;
  try {
    place = await Place.findById(placeId).populate('creator');
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place",
      500,
    );
    return next(error);
  }
  // ✅ Check if place actually exists 
  if (!place) {
    const error = new HttpError('Could not find place for this id.', 404);
    return next(error);
  }
   // security check to make sure that the user who is trying to delete the place is the creator of the place//
  if (place.creator.id !== req.userData.userId) {
    const error = new HttpError('You are not allowed to delete this place.', 401);
    return next(error);
  }

  const imagePath = place.image;

  try {
    // await Place.findByIdAndDelete(placeId);    // ✅ replace place.remove()
    const sess = await mongoose.startSession();
    sess.startTransaction();
    // await place.remove({ session: sess });     // deprecated
    await place.deleteOne({ session: sess });     // ✅ delete the place
    place.creator.places.pull(place);             // ✅ remove from user's places array
    await place.creator.save({ session: sess });  // ✅ save updated user
    await sess.commitTransaction();
    // await place.remove();                      // deprecrated
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place",
      500
    );
    return next(error);
  }

  fs.unlink(imagePath, err => {
    console.log(err);
  });
  
  res.status(200).json({ message: "Deleted place." });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
