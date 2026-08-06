/**
 * A Swagger sidebar group.
 *
 * Declared by the module it belongs to, so the name and its description live
 * with the code they describe rather than in a distant list that drifts.
 */
export interface ApiTag {
  readonly name: string;

  readonly description: string;
}
