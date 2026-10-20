/** An id, not a document: the job reads the file's current state when it runs. */
export interface ProcessFilePayload {
  readonly fileId: string;
}
