import { ShortcutType } from "./constants";
import { createNotificationIfNotSilenced } from "./notifications";

let previousTab: chrome.tabs.Tab | undefined = undefined;
let hasProcessedWindowCloseOnTab = false;
let recentCloseOrOpenAction = false;

export function configureTabsAndWindows() {
  // TABS
  chrome.tabs.onActivated.addListener(async (tab) => {
    // if a tab is opened, the focus is immediately brought to it, so we don't need to show a
    // notification. Similarly, if a tab is closed, the focus is immediately brought to another tab
    if (recentCloseOrOpenAction) {
      recentCloseOrOpenAction = false;
      return;
    }

    // if this is the only tab in the window, do not show a notification
    if (await windowHasOnlyOneTab(tab.windowId)) {
      return;
    }

    const allTabs = await chrome.tabs.query({ windowId: tab.windowId });
    const currentTab = allTabs.find((t) => t.id === tab.tabId)!;
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
      } else if (currentTab.index === allTabs.length - 1) {
        createNotificationIfNotSilenced(
          ShortcutType.LAST_TAB,
          "To jump to the last tab, use Command + 9"
        );
        // jumping to specific tabs only works up until the eighth tab
      } else if (currentTab.index <= 7) {
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

    if (!tab.active) {
      // this tab was opened in the background
      createNotificationIfNotSilenced(
        ShortcutType.BACKGROUND_TAB,
        "To open a new tab in the background, hold Command when clicking a link"
      );
      return;
    }

    recentCloseOrOpenAction = true;
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

    recentCloseOrOpenAction = true;
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
}

async function windowHasOnlyOneTab(windowId: number) {
  let currentWindow = await chrome.windows.get(windowId, {
    populate: true,
  });
  return !currentWindow.tabs || currentWindow.tabs.length <= 1;
}
