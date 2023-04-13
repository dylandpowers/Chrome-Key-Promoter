import { ShortcutType } from "./ShortcutType";

let previousTab: chrome.tabs.Tab | null = null;

// TABS
chrome.tabs.onActivated.addListener(async (tab) => {
  if (await windowHasOnlyOneTab(tab.windowId)) {
    return;
  }

  const currentTab = await chrome.tabs.get(tab.tabId);
  if (previousTab !== null) {
    let indexDifference = currentTab.index - previousTab.index;
    if (Math.abs(indexDifference) === 1) {
      let shortcutText =
        indexDifference < 0
          ? "Command + Option + Left"
          : "Command + Option + Right";
      let direction = indexDifference < 0 ? "left" : "right";
      createNotificationIfNotSilenced(
        ShortcutType.TAB_LATERAL,
        `To move tabs ${direction}, use ${shortcutText}`
      );
    } else {
      createNotificationIfNotSilenced(
        ShortcutType.TAB_NUMBER,
        "To jump to a specific tab, use Command + 1 through Command + 8"
      );
    }
  }
  previousTab = currentTab;
});

chrome.tabs.onCreated.addListener(async (tab) => {
  // if this is the only tab in the window, do not show a notification
  if (await windowHasOnlyOneTab(tab.windowId)) {
    return;
  }

  createNotificationIfNotSilenced(
    ShortcutType.NEW_TAB,
    "To create a new tab, use Command + t"
  );
});

chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  if (removeInfo.isWindowClosing) {
    // if the window was closed, we will handle this somewhere else
    return;
  }

  createNotificationIfNotSilenced(
    ShortcutType.CLOSE_TAB,
    "To close a tab, use Command + w"
  );
});

// WINDOWS
chrome.windows.onCreated.addListener(() => {
  createNotificationIfNotSilenced(
    ShortcutType.NEW_WINDOW,
    "To create a new window, use Command + n"
  );
});

chrome.notifications.onButtonClicked.addListener((notificationId) => {
  // silence the notification
  chrome.storage.local.set({ [notificationId]: true });
});

async function windowHasOnlyOneTab(windowId: number) {
  let currentWindow = await chrome.windows.get(windowId, {
    populate: true,
  });
  return !currentWindow.tabs || currentWindow.tabs.length <= 1;
}

async function createNotificationIfNotSilenced(
  shortcutType: string,
  message: string
) {
  let silenced = await chrome.storage.local.get(shortcutType);
  if (silenced[shortcutType]) {
    return;
  }
  chrome.notifications.create({
    type: "basic",
    title: "Chrome Key Promoter",
    message,
    iconUrl: "../shrek.jpeg",
    buttons: [{ title: "Silence" }],
  });
}
