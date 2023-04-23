import { ShortcutType } from "./constants";
import { createNotificationIfNotSilenced } from "./notifications";

export function configureNavigation() {
  chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.transitionQualifiers.includes("forward_back")) {
      createNotificationIfNotSilenced(
        ShortcutType.FORWARD_BACK,
        "To navigate back or forward, use Command + [ or ], or Command + left or right"
      );
    }
  });
}
