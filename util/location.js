const axios = require("axios");

const HttpError = require('../models/http-error');

// const API_KEY = "AIzaSyC9n2s8l3mXo7a5e1v6z8y9x0w1u2v3t4"; // Replace with your actual API key
// const API_KEY = process.env.GOOGLE_API_KEY; // Use environment variable for API key

async function getCoordsForAddress(address) {
  const response = await axios.get(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
    {
      headers: {
        'User-Agent': 'mern-course-app' // ✅ required by Nominatim
      }
    }
  );

  const data = response.data;

  // ✅ Check if results are empty
  if (!data || data.length === 0) {
    const error = new HttpError(
      'Could not find location for the specified address.',
      422
    );
    throw error;
  }

  // ✅ Nominatim returns lat/lon (not lat/lng like Google)
  const coordinates = {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon), // ← "lon" not "lng", we rename it here
  };

  return coordinates;
  // >>>>>>>>>>>>>
  // return {
  //   lat: 40.7484474,
  //   lng: -73.9871516,
  // };
  //>>>>>>>>>>>>>>>>>>

//   const response = await axios.get(
//     `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`,
//   );
    
//       const data = response.data;
//       if (!data || data.status === "ZERO_RESULTS" || data.status !== "OK") {
//         const error = new HttpError(
//           "Could not find location for the specified address.",
//           422,
//         );
//         throw error;
//       }

//       if (!data.results || data.results.length === 0) {
//         const error = new HttpError(
//           "No results found for the specified address.",
//           422,
//         );
//         throw error;
//       }
//       const coordinates = data.results[0].geometry.location;
//       return coordinates;
}

module.exports = getCoordsForAddress;

// const getCoordsForAddress = async (address) => { 
//     return {
//         lat: 40.7484474,
//         lng: -73.9871516
//     };
//  }