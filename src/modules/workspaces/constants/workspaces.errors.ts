export const WORKSPACE_ERROR_MESSAGE = {
  SLUG_TAKEN: 'That workspace URL is already taken. Please choose another.',

  PENDING_REVIEW_EXISTS:
    'You already have a workspace awaiting review. You can create another once it is reviewed.',

  OWNED_LIMIT_REACHED: 'You have reached the maximum number of workspaces you can own.',

  CREATE_CONFLICT: 'The workspace could not be created. Please try again.',

  WORKSPACE_NOT_FOUND: 'Workspace not found.',

  NOT_AWAITING_REVIEW: 'This workspace is not awaiting review.',

  LOGO_CHANGED: 'The logo was changed somewhere else at the same time. Please try again.',
} as const;
