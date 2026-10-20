import { FileRejectReason } from '@prisma/client';
import sharp, { type Sharp } from 'sharp';

import { MAX_INPUT_PIXELS, WEBP_QUALITY } from '../constants/file-jobs.constants.js';
import { FileRejectedError } from '../errors/index.js';
import type { EncodedImage, FileImagePolicy, ProcessedImage } from '../interfaces/index.js';

const DECODABLE_FORMATS: ReadonlySet<string> = new Set(['jpeg', 'png', 'webp']);

sharp.cache(false);
sharp.concurrency(1);

export async function processImage(
  input: Buffer,
  policy: FileImagePolicy,
): Promise<ProcessedImage> {
  const format = await decodedFormat(input);

  if (format === undefined || !DECODABLE_FORMATS.has(format)) {
    throw new FileRejectedError(
      FileRejectReason.TYPE_NOT_ALLOWED,
      `Decoded as ${format ?? 'nothing'}, not an allowed image format.`,
    );
  }

  try {
    const { data: pixels, info } = await open(input)
      .resize({
        width: policy.maxDimension,
        height: policy.maxDimension,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const fromPixels = (): Sharp =>
      sharp(pixels, { raw: { width: info.width, height: info.height, channels: info.channels } });

    const [image, thumbnail] = await Promise.all([
      encode(fromPixels()),
      encode(
        fromPixels().resize({
          width: policy.thumbnailDimension,
          height: policy.thumbnailDimension,
          fit: policy.thumbnailFit,
          withoutEnlargement: policy.thumbnailFit === 'inside',
        }),
      ),
    ]);

    return { image, thumbnail };
  } catch (error) {
    throw new FileRejectedError(FileRejectReason.UNREADABLE, 'The image could not be decoded.', {
      cause: error,
    });
  }
}

async function decodedFormat(input: Buffer): Promise<string | undefined> {
  try {
    return (await open(input).metadata()).format;
  } catch (error) {
    throw new FileRejectedError(FileRejectReason.UNREADABLE, 'The image could not be read.', {
      cause: error,
    });
  }
}

function open(input: Buffer): Sharp {
  return sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'error' }).rotate();
}

async function encode(pipeline: Sharp): Promise<EncodedImage> {
  const { data, info } = await pipeline
    .webp({ quality: WEBP_QUALITY })
    .toBuffer({ resolveWithObject: true });

  return { data, width: info.width, height: info.height };
}
