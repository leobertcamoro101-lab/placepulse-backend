require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const Place = require('../models/place');
const User = require('../models/user');

const extractPublicId = (url) => {
  // e.g. https://res.cloudinary.com/xxx/image/upload/v123/placepulse/abc123.jpg
  const match = url.match(/mern\/([^/.]+)/);
  return match ? `mern/${match[1]}` : null;
};

const run = async () => {
  await mongoose.connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.accdk79.mongodb.net/${process.env.DB_NAME}?appName=Cluster0`
  );

  const places = await Place.find({}, 'image');
  const users = await User.find({}, 'image');

  const usedPublicIds = new Set(
    [...places, ...users]
      .map((doc) => extractPublicId(doc.image))
      .filter(Boolean)
  );

  console.log(`Found ${usedPublicIds.size} images referenced in the database.`);

  let nextCursor = undefined;
  let orphanCount = 0;

  do {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'mern/',
      max_results: 100,
      next_cursor: nextCursor,
    });

    for (const resource of result.resources) {
      if (!usedPublicIds.has(resource.public_id)) {
        console.log('Orphan found, deleting:', resource.public_id);
        await cloudinary.uploader.destroy(resource.public_id); // to delete
        // console.log('WOULD DELETE:', resource.public_id); // dry-run mode
        orphanCount++;
      }
    }

    nextCursor = result.next_cursor;
  } while (nextCursor);

  console.log(`Done. Deleted ${orphanCount} orphaned image(s).`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});