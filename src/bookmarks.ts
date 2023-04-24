import { ShortcutType } from "./constants";
import { createNotificationIfNotSilenced } from "./notifications";

export function configureBookmarks() {
  chrome.bookmarks.onCreated.addListener(() => {
    createNotificationIfNotSilenced(
      ShortcutType.CREATE_BOOKMARK,
      "To create a bookmark, use Command + d"
    );
  });
}
