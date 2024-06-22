const webp = require("node-webpmux");
const cryto = require("crypto");

async function embedMetadata(sticker, metadata = {}) {
  if (!metadata.author) metadata.author = "";
  if (!metadata.packname) metadata.packname = "";
  if (!metadata.categories) metadata.categories = [""];

  const img = new webp.Image();

  const hash = cryto.randomBytes(32).toString("hex");

  const json = {
    emojis: metadata.categories,
    "sticker-pack-id": hash,
    "sticker-pack-name": metadata.packname,
    "sticker-pack-publisher": metadata.author,
  };

  const exifAttr = Buffer.from([
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
    0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
  ]);

  const jsonBuffer = Buffer.from(JSON.stringify(json), "utf8");

  const exif = Buffer.concat([exifAttr, jsonBuffer]);
  exif.writeUIntLE(jsonBuffer.length, 14, 4);

  await img.load(Buffer.from(sticker, "base64"));
  img.exif = exif;

  return await img.save(null);
}

module.exports = embedMetadata;
