/** What processing makes of an uploaded image: the stored copy and its thumbnail. */
export interface ProcessedImage {
  readonly image: EncodedImage;

  readonly thumbnail: EncodedImage;
}

export interface EncodedImage {
  readonly data: Buffer;

  readonly width: number;

  readonly height: number;
}
