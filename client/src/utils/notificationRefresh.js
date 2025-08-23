import { store } from "../app/store";
import { fetchNotifications } from "../features/notification/notificationsSlice";

// Refresh notifications after actions
export const refreshNotificationsAfterAction = () => {
  try {
    store.dispatch(fetchNotifications());
  } catch (error) {
    console.error("Error refreshing notifications:", error);
  }
};

// Refresh notifications with a delay
export const refreshNotificationsWithDelay = (delayMs = 1000) => {
  setTimeout(() => {
    refreshNotificationsAfterAction();
  }, delayMs);
};

// Refresh notifications immediately and then again after a delay

export const refreshNotificationsImmediateAndDelayed = (delayMs = 2000) => {
  refreshNotificationsAfterAction();
  refreshNotificationsWithDelay(delayMs);
};
