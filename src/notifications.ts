import { DEFAULT_SHORTCUT_PROPERTIES } from "./constants";

export async function createNotificationIfNotSilenced(
  shortcutType: string,
  message: string
) {
  let result = await chrome.storage.local.get({
    [shortcutType]: DEFAULT_SHORTCUT_PROPERTIES,
  });
  let shortcutProperties = result[shortcutType];
  if (shortcutProperties.silenced) {
    return;
  }

  shortcutProperties.timesMissed += 1;
  chrome.storage.local.set({ [shortcutType]: shortcutProperties });

  let fullMessage = `${message} (missed ${shortcutProperties.timesMissed} times)`;
  chrome.notifications.clear(shortcutType);
  chrome.notifications.create(shortcutType, {
    type: "basic",
    title: "Chrome Key Promoter",
    message: fullMessage,
    iconUrl: "../shrek.jpeg",
    buttons: [{ title: "Silence" }],
  });
}
