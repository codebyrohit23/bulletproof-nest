import { SetMetadata, type CustomDecorator } from '@nestjs/common';

import { TENANCY_NO_WORKSPACE_METADATA } from '../constants/index.js';

/**
 * Marks a user route that acts on the caller rather than inside a workspace —
 * their profile, their list of workspaces, creating one. Every other user
 * route requires `x-workspace-id`; forgetting this marker fails the route's
 * first call with a 400, which is the safe way round.
 */
export const NoWorkspace = (): CustomDecorator => SetMetadata(TENANCY_NO_WORKSPACE_METADATA, true);
