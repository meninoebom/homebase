import { createFileRoute, redirect } from "@tanstack/react-router";

/*
 * Root "/" redirects to /morning. There is no landing page by design — opening
 * the app drops Brandon directly inside the ritual (plan §11, interaction agent:
 * "the app's answer to 'what do I do now?' must always be 'the thing in front
 * of you'"). No time-of-day branching; morning is the center of gravity whether
 * it's 7am or 3pm.
 */
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/morning" });
  },
});
