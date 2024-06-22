# Sticker Maker

Create WhatsApp stickers from images or videos, with optional metadata embedding for use with Baileys.

## Installation

Ensure you have Node.js installed, then install the necessary package:

```bash
npm install sticker-maker
```

## Usage

```javascript
const { createSticker } = require("sticker-maker");
const { readFile } = require("fs/promises");

async function main() {
  const imagePath = "./path/your_image.png";

  const image = await readFile(imagePath);

  const sticker = await createSticker(image, {
    metadata: {
      packname: "Pack Name",
      author: "Author Name",
    },
  });

  socket.sendMessage(jid, { sticker });
}

main();
```

### Animated Sticker Creation

If you are creating animated stickers (video to WebP), make sure you have ffmpeg installed on your system. Here's how to use the createSticker function (also works for static stickers):

```bash
npm install ffmpeg-static
```

```javascript
const { createSticker } = require("sticker-maker");
const { readFile } = require("fs/promises");
const ffmpegPath = require("ffmpeg-static");

async function main() {
  const videoPath = "./path/your_video.mp4";

  const video = await readFile(videoPath);

  const sticker = await createSticker(video, {
    ffmpeg: ffmpegPath,
    metadata: {
      packname: "Pack Name",
      author: "Author Name",
    },
  });

  socket.sendMessage(jid, { sticker });
}

main();
```

## Function Details

### `createSticker(input, options)`

#### Parameters

- **input**: `Buffer | Readable`
  - The input file, either an image or a video.
- **options**: `Object` (optional)
  - **ffmpeg**: `string` (required in case you want it to be an animated sticker)
  - **metadata**: `Object` (optional)
    - **packname**: `string`
      - Sticker pack name.
    - **author**: `string`
      - Sticker author.

#### Returns

- **Promise<Buffer>**
  - Resolves to a Buffer containing the sticker image in WebP format with embedded metadata (if provided).
