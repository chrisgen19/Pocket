/// <reference types="chrome" />
import { createBookmark, getSession } from '@/lib/api';
import { API_BASE_URL, LOGIN_URL } from '@/lib/config';
import { isSavedStateMessage } from '@/lib/messages';
import { refreshSavedUrls, setSaved, updateActionForTab, updateAllTabs } from './saved-urls';

const CONTEXT_MENU_PAGE = 'pocket-save-page';
const CONTEXT_MENU_LINK = 'pocket-save-link';

// Saves and deletes made in the web app reach the toolbar icon within this period.
const REFRESH_ALARM = 'refresh-saved-urls';
const REFRESH_MINUTES = 15;

const API_HOST = new URL(API_BASE_URL).hostname;

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_PAGE,
    title: 'Save page to Pocket',
    contexts: ['page'],
  });
  chrome.contextMenus.create({
    id: CONTEXT_MENU_LINK,
    title: 'Save link to Pocket',
    contexts: ['link'],
  });
  void startSavedUrlSync();
});

chrome.runtime.onStartup.addListener(() => {
  void startSavedUrlSync();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== REFRESH_ALARM) return;
  await refreshSavedUrls();
  await updateAllTabs();
});

// Sign-in and sign-out change the Better Auth session cookie on the API origin.
// A session refresh overwrites it (removed, then set), so skip the removal half.
chrome.cookies.onChanged.addListener(async ({ cookie, removed, cause }) => {
  if (!cookie.name.endsWith('better-auth.session_token')) return;
  if (!API_HOST.endsWith(cookie.domain.replace(/^\./, ''))) return;
  if (removed && cause === 'overwrite') return;
  await refreshSavedUrls();
  await updateAllTabs();
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === 'complete') {
    await updateActionForTab(tabId, tab.url);
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    await updateActionForTab(tabId, tab.url);
  } catch {
    // The tab closed before we could read it.
  }
});

// The popup reports what it learned (a save, or its lookup) so the cache and icon
// match without waiting for the next refresh.
chrome.runtime.onMessage.addListener((message: unknown) => {
  if (!isSavedStateMessage(message)) return;
  void (async () => {
    await setSaved(message.url, message.saved);
    await updateTabsWithUrl(message.url);
  })();
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_PAGE && tab?.url) {
    await saveOrPromptLogin(tab.id, tab.url);
  } else if (info.menuItemId === CONTEXT_MENU_LINK && info.linkUrl) {
    await saveOrPromptLogin(tab?.id, info.linkUrl);
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'save-current-tab') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url) await saveOrPromptLogin(tab.id, tab.url);
});

async function startSavedUrlSync() {
  const existing = await chrome.alarms.get(REFRESH_ALARM);
  if (!existing) {
    await chrome.alarms.create(REFRESH_ALARM, { periodInMinutes: REFRESH_MINUTES });
  }
  await refreshSavedUrls();
  await updateAllTabs();
}

async function updateTabsWithUrl(url: string) {
  const tabs = await chrome.tabs.query({});
  await Promise.all(
    tabs
      .filter((tab) => tab.id != null && tab.url === url)
      .map((tab) => updateActionForTab(tab.id as number, url)),
  );
}

async function saveOrPromptLogin(tabId: number | undefined, url: string) {
  if (!/^https?:/.test(url)) return;

  const session = await getSession();
  if (!session?.user) {
    await chrome.tabs.create({ url: LOGIN_URL });
    await flashBadge(tabId, '!', '#dc2626');
    return;
  }

  try {
    await createBookmark({ url, tags: [] });
    await setSaved(url, true);
    await updateTabsWithUrl(url);
    await flashBadge(tabId, '✓', '#16a34a');
  } catch {
    await flashBadge(tabId, '!', '#dc2626');
  }
}

async function flashBadge(tabId: number | undefined, text: string, color: string) {
  if (tabId == null) return;
  await chrome.action.setBadgeBackgroundColor({ tabId, color });
  await chrome.action.setBadgeText({ tabId, text });
  setTimeout(() => {
    chrome.action.setBadgeText({ tabId, text: '' }).catch(() => {});
  }, 2000);
}
