/**
 * A sidebar group in the rendered reference.
 *
 * Declared by the module it describes, so the name and its description live
 * next to the controller rather than in a distant list that drifts out of date.
 */
export interface ApiTag {
  readonly name: string;

  readonly description: string;
}

export interface ApiAudience {
  readonly key: string;

  readonly title: string;

  readonly description: string;

  readonly version: string;

  readonly securityScheme: string;

  readonly docsPath: string;

  readonly specPath: string;

  readonly tags: readonly ApiTag[];

  readonly includesPath: (path: string) => boolean;
}
