export type Subscription = {
  status?: string;
  expiresAt?: string | Date | null;
};

export function isSubscriptionActive(
  subscription: Subscription | null | undefined,
  isAdmin = false
) {
  if (isAdmin) return true;
  if (!subscription) return false;
  if (subscription.status !== "active") return false;
  if (!subscription.expiresAt) return true;
  const expiresAt =
    typeof subscription.expiresAt === "string"
      ? new Date(subscription.expiresAt)
      : subscription.expiresAt;
  if (!expiresAt || Number.isNaN(expiresAt.getTime())) return false;
  return expiresAt.getTime() > Date.now();
}
