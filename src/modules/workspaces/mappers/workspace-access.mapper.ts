import type { MembershipStatus } from '@prisma/client';

import type { MembershipAccessSnapshot } from '../interfaces/index.js';

export function toMembershipAccessSnapshot(member: {
  id: string;
  status: MembershipStatus;
}): MembershipAccessSnapshot {
  return { memberId: member.id, status: member.status };
}
