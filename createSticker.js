const { readFile, unlink } = require("fs/promises");
const { Stream, Readable } = require("stream");
const { spawn } = require("child_process");
const { tmpdir } = require("os");
const { resolve } = require("path");
const embedMetadata = require("./metadata");
const sharp = require("sharp");

async function createSticker(input, options = {}) {
  if (!input) {
    throw new Error("An input file was not provided.");
  }

  if (input instanceof Stream) {
    input = await streamToBuffer(input);
  }

  if (!Buffer.isBuffer(input)) {
    throw new Error("The input file is not a valid buffer.");
  }

  const { fileTypeFromBuffer } = await import("file-type");

  const type = await fileTypeFromBuffer(input);

  if (type.mime.includes("image")) {
    const sticker = await sharp(input).webp().toBuffer();
    return await embedMetadata(sticker, options.metadata);
  } else if (type.mime.includes("video")) {
    if (!options.ffmpeg) {
      throw new Error("The ffmpeg path is not specified.");
    }

    const stream = new Readable();
    stream.push(input);
    stream.push(null);

    const output = resolve(tmpdir(), `${Date.now()}.webp`);

    try {
      const args = [
        "-i",
        "-",
        "-vcodec",
        "libwebp",
        "-vf",
        "scale='iw*min(300/iw,300/ih)':'ih*min(300/iw,300/ih)',format=rgba,pad=300:300:'(300-iw)/2':'(300-ih)/2':'#00000000',setsar=1,fps=10",
        "-loop",
        "0",
        "-ss",
        "00:00:00.0",
        "-t",
        "00:00:05.0",
        "-an",
        "-vsync",
        "0",
        "-s",
        "512:512",
        "-qscale:v",
        "50",
        output,
      ];

      await new Promise((resolve, reject) => {
        const ffmpeg = spawn(options.ffmpeg, args);
        stream.pipe(ffmpeg.stdin);

        ffmpeg.stdin.on("error", () => null);

        ffmpeg.on("exit", (code) => {
          if (code === 0) {
            resolve(true);
          } else {
            reject(`FFmpeg exited with code ${code}`);
          }
        });
      });

      const sticker = await readFile(output);

      return await embedMetadata(sticker, options.metadata);
    } catch (error) {
      throw error;
    } finally {
      unlink(output).catch(() => null);
    }
  } else {
    throw new Error("The file is neither a valid image nor a video.");
  }
}

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", (error) => reject(error));
  });
}

module.exports = createSticker;
