/// <reference types="chrome" />
import { createBookmark, getSession } from '@/lib/api';
import { LOGIN_URL } from '@/lib/config';

const CONTEXT_MENU_PAGE = 'pocket-save-page';
const CONTEXT_MENU_LINK = 'pocket-save-link';

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
