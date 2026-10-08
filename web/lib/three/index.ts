export { hasWebGL, canRunHeavy3D } from "./webgl";
export type { MountOpts, InvitationHandle } from "./invitation";
// mountInvitation is intentionally NOT re-exported here so `three` only loads via
// the dynamic import in InvitationCanvas (keeps it out of the initial bundle).
