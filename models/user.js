const mongoose = require('mongoose');
// const uniqueValidator = require('mongoose-unique-validator') // not needed in Mongoose 9 

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    image: {type: String, required: true},
    // places: {type: String, required: true}, //deprecated
    // places: [{ type: mongoose.Types.ObjectId, ref: 'Place' }], //without relation to place
    places: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Place' }], //with relation to place
});

// userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema)