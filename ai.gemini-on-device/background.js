chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install' || reason === 'update') {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) => console.error(error));

    // Create all context menu items
    const menuItems = [
      { id: 'summarize', title: 'Summarize Selection' },
      { id: 'translate', title: 'Translate Selection' },
      { id: 'proofread', title: 'Proofread Selection' },
      { id: 'quotes', title: 'Find Related Quotes' },
      { id: 'save-highlight', title: 'Save Highlighted Text' },
      { id: 'extract-citation', title: 'Extract Citation Info' }
    ];

    chrome.contextMenus.removeAll(() => {
      for (const { id, title } of menuItems) {
        chrome.contextMenus.create({
          id,
          title,
          contexts: ['selection']
        }, () => {
          if (chrome.runtime.lastError) {
            console.error('Context menu creation failed:', chrome.runtime.lastError);
          }
        });
      }
    });
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!info.selectionText || !tab?.id) return;
  const selectedText = info.selectionText.trim();
  if (!selectedText) return;

  if (info.menuItemId === 'save-highlight') {
    const savedHighlight = {
      text: selectedText,
      url: tab.url,
      title: tab.title,
      date: new Date().toISOString()
    };

    chrome.storage.local.get({ highlights: [] }, (data) => {
      const highlights = data.highlights;
      highlights.push(savedHighlight);
      chrome.storage.local.set({ highlights }, () => {
        console.log('✅ Highlight saved:', savedHighlight);
      });
    });
    return;
  }

  // Handle extract citation directly in side panel
  if (info.menuItemId === 'extract-citation') {
    await chrome.sidePanel.open({ tabId: tab.id });
    chrome.runtime.sendMessage({
      action: 'extract-citation',
      text: selectedText,
      url: tab.url
    });
    return;
  }

  // Default prompt-based actions
  await chrome.sidePanel.open({ tabId: tab.id });
  chrome.runtime.sendMessage({
    action: info.menuItemId,
    text: selectedText
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!info.selectionText || !tab?.id) return;
  const selectedText = info.selectionText.trim();
  if (!selectedText) return;

  if (info.menuItemId === 'save-highlight') {
    const savedHighlight = {
      text: selectedText,
      url: tab.url,
      title: tab.title,
      date: new Date().toISOString()
    };

    chrome.storage.local.get({ highlights: [] }, (data) => {
      const highlights = data.highlights;
      highlights.push(savedHighlight);
      chrome.storage.local.set({ highlights }, () => {
        console.log('✅ Highlight saved:', savedHighlight);
      });
    });
    return;
  }

  if (info.menuItemId === 'extract-citation') {
    chrome.tabs.sendMessage(tab.id, { action: 'extractCitation', text: selectedText });
    return;
  }

  // For AI prompt actions — open the side panel and send a message
  try {
    await chrome.sidePanel.open({ tabId: tab.id });
    chrome.runtime.sendMessage({
      action: info.menuItemId,
      text: selectedText
    });
  } catch (err) {
    console.error('❌ Failed to open side panel:', err);
  }
});
