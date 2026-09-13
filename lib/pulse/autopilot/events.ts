/**
 * The fixed catalogue of in-app events an automation can react to instantly.
 *
 * Deliberately closed, not free-form: `emitEvent` only ever fires one of
 * these names, the automation planner is only ever taught this exact list
 * (see the `{{events}}` variable in planAutomation), and the Rules page only
 * ever offers these in its dropdown. An automation cannot ask to react to
 * something Pulse never actually announces.
 *
 * Only things Pulse itself writes belong here. Anything on MSG91's side
 * (payments, ms_trans, …) can only be *polled* — Pulse has SELECT there and
 * nothing pushes it a change — so those stay `schedule` automations with a
 * find_sql and a watermark, same as before this feature existed.
 */

export type EventName =
  | "account.tag_added"
  | "account.tag_removed"
  | "account.reassigned"
  | "member.invited"
  | "member.removed"
  | "connection.connected"
  | "connection.disconnected"
  | "trigger.fired";

export const EVENTS: Record<EventName, { label: string; payload: string; example: Record<string, unknown> }> = {
  "account.tag_added": {
    label: "A tag is added to an account",
    payload: "{ accountId, accountName, tag, addedBy }",
    example: { accountId: "12345", accountName: "Acme Co", tag: "at-risk", addedBy: "rhea@msg91.com" },
  },
  "account.tag_removed": {
    label: "A tag is removed from an account",
    payload: "{ accountId, accountName, tag, removedBy }",
    example: { accountId: "12345", accountName: "Acme Co", tag: "at-risk", removedBy: "rhea@msg91.com" },
  },
  "account.reassigned": {
    label: "An account is reassigned to a different owner",
    payload: "{ accountId, accountName, ownerId, ownerName, previousOwnerId, assignedBy }",
    example: {
      accountId: "12345", accountName: "Acme Co",
      ownerId: "889", ownerName: "Farhan Ali", previousOwnerId: "112", assignedBy: "rhea@msg91.com",
    },
  },
  "member.invited": {
    label: "Someone is invited to Pulse",
    payload: "{ email, invitedBy, role }",
    example: { email: "new.rep@msg91.com", invitedBy: "rhea@msg91.com", role: "member" },
  },
  "member.removed": {
    label: "A member is removed from Pulse",
    payload: "{ email, removedBy }",
    example: { email: "old.rep@msg91.com", removedBy: "rhea@msg91.com" },
  },
  "connection.connected": {
    label: "Someone connects Gmail, Calendar or Slack",
    payload: "{ memberEmail, service }",
    example: { memberEmail: "rhea@msg91.com", service: "gmail" },
  },
  "connection.disconnected": {
    label: "Someone disconnects Gmail, Calendar or Slack",
    payload: "{ memberEmail, service }",
    example: { memberEmail: "rhea@msg91.com", service: "gmail" },
  },
  /* ViaSocket's actual watch — a Gmail message, a calendar change, a Slack
   * message — landing at app/api/pulse/viasocket/hook/[key]/route.ts. That
   * handler recorded the event for the Connections tab and stopped there by
   * design ("no fan-out, no agent call" — its own docstring), which meant a
   * rule written against "the ViaSocket trigger" had nothing to react to:
   * the catalogue offered only the two connect/disconnect housekeeping
   * events, and the planner either invented an event name or tried to poll a
   * table that does not exist for something that only ever arrives by push.
   *
   * One generic event rather than one per service: `summary` is ViaSocket's
   * own one-line description of what happened (already what the Connections
   * tab shows), and a rule judges that text rather than the service needing
   * its own event name and payload shape before it can be reacted to at all.
   */
  "trigger.fired": {
    label: "A connected ViaSocket trigger fires (a new email, a calendar change, a Slack message)",
    payload: "{ service, label, summary, memberEmail }",
    example: {
      service: "gmail", label: "New email in inbox",
      summary: "From: prospect@acme.com — Re: pricing for 50k SMS/month",
      memberEmail: "rhea@msg91.com",
    },
  },
};

/** What the planner is shown, so it can only ever name a real event. */
export function eventsCatalogueForPlanner(): string {
  return Object.entries(EVENTS)
    .map(([name, e]) => `- "${name}": ${e.label}. Payload shape: ${e.payload}`)
    .join("\n");
}

export function isEventName(v: string): v is EventName {
  return Object.prototype.hasOwnProperty.call(EVENTS, v);
}
