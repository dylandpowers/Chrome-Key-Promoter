import { ShortcutType } from "./ShortcutType";

let previousTab: chrome.tabs.Tab | null = null;

chrome.tabs.onActivated.addListener(async (tab) => {
  let silenced = await chrome.storage.local.get([ShortcutType.TAB_LATERAL]);
  if (silenced[ShortcutType.TAB_LATERAL]) {
    return;
  }
  const currentTab = await chrome.tabs.get(tab.tabId);
  if (previousTab !== null) {
    let indexDifference = currentTab.index - previousTab.index;
    if (Math.abs(indexDifference) === 1) {
      let shortcutText =
        indexDifference < 0 ? "Command+Option+Left" : "Command+Option+Right";
      let direction = indexDifference < 0 ? "left" : "right";
      createNotification(
        ShortcutType.TAB_LATERAL,
        `To move tabs ${direction}, use ${shortcutText}`
      );
    } else {
      createNotification(
        ShortcutType.TAB_LATERAL,
        "To jump to a specific tab, use Command+1 through Command+9"
      );
    }
  }
  previousTab = currentTab;
});

chrome.notifications.onButtonClicked.addListener(
  (notificationId, buttonIndex) => {
    // there is only one button, so we don't need to check the index
    chrome.storage.local.set({ [notificationId]: true });
  }
);

function createNotification(notificationId: string, message: string) {
  chrome.notifications.clear(notificationId);
  chrome.notifications.create(notificationId, {
    type: "basic",
    title: "Chrome Key Promoter",
    message,
    iconUrl: "../shrek.jpeg",
    buttons: [{ title: "Silence" }],
  });
}
