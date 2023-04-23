import { ShortcutType } from "./constants";
import { createNotificationIfNotSilenced } from "./notifications";

export function configureNavigation() {
  chrome.webNavigation.onCommitted.addListener((details) => {
    let qualifiers = new Set(details.transitionQualifiers);
    console.log(qualifiers);
    if (qualifiers.has("forward_back") && qualifiers.has("from_address_bar")) {
      createNotificationIfNotSilenced(
        ShortcutType.FORWARD_BACK,
        "To navigate back, use Command + [ or Command + left"
      );
    }
  });
}
