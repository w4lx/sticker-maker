const { Stream } = require("stream");
const { spawn } = require("child_process");
const { writeFile, readFile } = require("fs/promises");
const { tmpdir } = require("os");
const embedMetadata = require("./metadata");
const sharp = require("sharp");

async function createSticker(input, options = {}) {
  if (!input) {
    throw new Error("An input file was not provided.");
  }

  // Convertir stream legible a buffer si es necesario
  if (input instanceof Stream) {
    input = await streamToBuffer(input);
  }

  // Validar que options.input sea un buffer
  if (!Buffer.isBuffer(input)) {
    throw new Error("The input file is not a valid buffer.");
  }

  const { fileTypeFromBuffer } = await import("file-type");

  // Determinar el tipo de archivo
  const type = await fileTypeFromBuffer(input);

  // Procesar según el tipo de archivo
  if (type.mime.includes("image")) {
    // Convertir imagen a formato WebP con sharp
    const sticker = await sharp(input).webp().toBuffer();
    return await embedMetadata(sticker, options.metadata);
  } else if (type.mime.includes("video")) {
    // Convertir video a formato WebP con ffmpeg
    if (!options.ffmpeg) {
      throw new Error("The ffmpeg path is not specified.");
    }

    const inputPath = `${tmpdir()}/${Date.now()}.mp4`;
    const outputPath = `${tmpdir()}/${Date.now()}.webp`;

    await writeFile(inputPath, input);

    const ffmpegArgs = [
      "-i",
      inputPath,
      "-vcodec",
      "libwebp",
      "-vf",
      "scale='iw*min(300/iw,300/ih)':'ih*min(300/iw,300/ih)',format=rgba,pad=300:300:'(300-iw)/2':'(300-ih)/2':'#00000000',setsar=1,fps=10",
      "-loop",
      "0",
      "-ss",
      "00:00:00.0",
      "-t",
      "00:00:06",
      "-an",
      "-vsync",
      "0",
      "-s",
      "512:512",
      "-qscale:v",
      "50",
      outputPath,
    ];

    await executeFfmpeg(options.ffmpeg, ffmpegArgs);

    const sticker = await readFile(outputPath);
    return await embedMetadata(sticker, options.metadata);
  } else {
    throw new Error("The file is neither a valid image nor a video.");
  }
}

async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", (err) => reject(err));
  });
}

async function executeFfmpeg(ffmpegPath, args) {
  return new Promise((resolve, reject) => {
    const ffmpegProcess = spawn(ffmpegPath, args);

    ffmpegProcess.on("exit", (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`Ffmpeg exited with code ${code}`));
      }
    });

    ffmpegProcess.on("error", (err) => reject(err));
  });
}

module.exports = createSticker;
