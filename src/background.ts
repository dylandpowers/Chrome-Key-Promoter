import { ShortcutType } from "./ShortcutType";

const DEFAULT_SHORTCUT_PROPERTIES = { silenced: false, timesMissed: 1 };

let previousTab: chrome.tabs.Tab | undefined = undefined;
let hasProcessedWindowCloseOnTab = false;

// TABS
chrome.tabs.onActivated.addListener(async (tab) => {
  if (await windowHasOnlyOneTab(tab.windowId)) {
    return;
  }

  const currentTab = await chrome.tabs.get(tab.tabId);
  if (previousTab) {
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
  // the tab removal is always fired before the window removal, regardless of which one was closed.
  // isWindowClosing will be true if the window was closed, meaning we should create the
  // notification once and then wait until the window event fires before considering this again
  if (removeInfo.isWindowClosing && !hasProcessedWindowCloseOnTab) {
    hasProcessedWindowCloseOnTab = true;
    createNotificationIfNotSilenced(
      ShortcutType.CLOSE_WINDOW,
      "To close a window, use Command + Shift + w"
    );
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

chrome.windows.onRemoved.addListener(() => {
  hasProcessedWindowCloseOnTab = false;
});

chrome.notifications.onButtonClicked.addListener((notificationId) => {
  // silence the notification
  chrome.storage.local.get(notificationId).then((result) => {
    result[notificationId].silenced = true;
    chrome.storage.local.set({ [notificationId]: result[notificationId] });
  });
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
