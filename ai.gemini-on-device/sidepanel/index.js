/* global LanguageModel */

import DOMPurify from 'dompurify';
import { marked } from 'marked';

const inputPrompt = document.querySelector('#input-prompt');
const buttonPrompt = document.querySelector('#button-prompt');
const buttonReset = document.querySelector('#button-reset');
const elementResponse = document.querySelector('#response');
const elementLoading = document.querySelector('#loading');
const elementError = document.querySelector('#error');
const sliderTemperature = document.querySelector('#temperature');
const sliderTopK = document.querySelector('#top-k');
const labelTemperature = document.querySelector('#label-temperature');
const labelTopK = document.querySelector('#label-top-k');

const buttonSummarizeSelection = document.querySelector('#button-summarize-selection');
const buttonTranslateSelection = document.querySelector('#button-translate-selection');
const buttonProofreadSelection = document.querySelector('#button-proofread-selection');
const buttonFindQuotes = document.querySelector('#button-find-quotes-selection');
const buttonExtractCitation = document.querySelector('#button-extract-citation');
const buttonExportResponse = document.querySelector('#button-export-response');

const buttonToggleHighlights = document.querySelector('#button-toggle-highlights');
const highlightsSection = document.querySelector('#highlights-section');
const highlightsTextbox = document.querySelector('#highlights-textbox');
const buttonSaveHighlights = document.querySelector('#button-save-highlights');
const buttonExportHighlights = document.querySelector('#button-export-highlights');

let session;

// hide export buttons initially
buttonExportResponse.classList.add('hidden');

chrome.runtime.onMessage.addListener(async (message) => {
  const { action, text, url } = message;
  if (!action || !text) return;

  // Show loading animation
  showLoading();

  try {
    let prompt, params;

    switch (action) {
      case 'summarize':
        prompt = `Summarize the following text:\n\n${text}`;
        params = {
          initialPrompts: [{ role: 'system', content: 'You are an expert summarizer.' }],
          temperature: sliderTemperature.value,
          topK: sliderTopK.value,
        };
        break;
      case 'translate':
        prompt = `Translate this text into English:\n\n${text}`;
        params = {
          initialPrompts: [{ role: 'system', content: 'You are a multilingual translator.' }],
          temperature: sliderTemperature.value,
          topK: sliderTopK.value,
        };
        break;
      case 'proofread':
        prompt = `Proofread and improve clarity:\n\n${text}`;
        params = {
          initialPrompts: [{ role: 'system', content: 'You are a professional editor.' }],
          temperature: sliderTemperature.value,
          topK: sliderTopK.value,
        };
        break;
      case 'quotes':
        prompt = `Find 3 relevant quotes related to this text:\n"${text}"`;
        params = {
          initialPrompts: [{ role: 'system', content: 'You are a literary expert providing meaningful quotes.' }],
          temperature: sliderTemperature.value,
          topK: sliderTopK.value,
        };
        break;
      case 'extract-citation':
        const citation = await getCitationInfo(text, url || location.href);
        showResponse(formatCitation(citation));
        return;

      default:
        return;
    }

    const response = await runPrompt(prompt, params);
    showResponse(response);
  } catch (e) {
    showError(e.message || e);
  }
});

// === Helper functions ===
function show(el) { el.removeAttribute('hidden'); }
function hide(el) { el.setAttribute('hidden', ''); }

function showLoading() {
  buttonReset.removeAttribute('disabled');
  hide(elementError);
  hide(elementResponse);
  show(elementLoading);
}

function showResponse(response) {
  hide(elementLoading);
  show(elementResponse);
  elementResponse.innerHTML = DOMPurify.sanitize(marked.parse(response));
  buttonExportResponse.classList.remove('hidden');
}

function showError(error) {
  show(elementError);
  hide(elementResponse);
  hide(elementLoading);
  elementError.textContent = error;
}

function exportTextAsFile(text, filename = 'export.txt') {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// === Language Model ===
async function runPrompt(prompt, params) {
  try {
    if (!session) session = await LanguageModel.create(params);
    return session.prompt(prompt);
  } catch (e) {
    console.error(e);
    reset();
    throw e;
  }
}

async function reset() {
  if (session) session.destroy();
  session = null;
}

async function initDefaults() {
  const defaults = await LanguageModel.params();
  sliderTemperature.value = defaults.defaultTemperature;
  sliderTopK.value = Math.min(defaults.defaultTopK, 3);
  labelTemperature.textContent = sliderTemperature.value;
  labelTopK.textContent = sliderTopK.value;
  sliderTopK.max = defaults.maxTopK;
}
initDefaults();

// === Prompt actions ===
buttonReset.addEventListener('click', () => {
  hide(elementLoading);
  hide(elementError);
  hide(elementResponse);
  reset();
  buttonReset.setAttribute('disabled', '');
});

sliderTemperature.addEventListener('input', e => {
  labelTemperature.textContent = e.target.value;
  reset();
});

sliderTopK.addEventListener('input', e => {
  labelTopK.textContent = e.target.value;
  reset();
});

inputPrompt.addEventListener('input', () => {
  if (inputPrompt.value.trim()) buttonPrompt.removeAttribute('disabled');
  else buttonPrompt.setAttribute('disabled', '');
});

buttonPrompt.addEventListener('click', async () => {
  const prompt = inputPrompt.value.trim();
  if (!prompt) return;
  showLoading();
  try {
    const params = {
      initialPrompts: [{ role: 'system', content: 'You are a helpful assistant.' }],
      temperature: sliderTemperature.value,
      topK: sliderTopK.value,
      outputLanguage: 'en',
    };
    const response = await runPrompt(prompt, params);
    showResponse(response);
  } catch (e) {
    showError(e.message || e);
  }
});

// === Selection helper ===
async function getSelectedText() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const [{ result: selectedText }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.getSelection().toString(),
  });
  if (!selectedText || !selectedText.trim()) throw new Error('No text selected.');
  return { selectedText, tab };
}

// === Selection-based tools ===
buttonSummarizeSelection.addEventListener('click', async () => {
  showLoading();
  try {
    const { selectedText } = await getSelectedText();
    const prompt = `Summarize the following text:\n\n${selectedText}`;
    const params = {
      initialPrompts: [{ role: 'system', content: 'You are an expert summarizer.' }],
      temperature: sliderTemperature.value,
      topK: sliderTopK.value,
    };
    const summary = await runPrompt(prompt, params);
    showResponse(summary);
  } catch (e) { showError(e.message || e); }
});

buttonTranslateSelection.addEventListener('click', async () => {
  showLoading();
  try {
    const { selectedText } = await getSelectedText();
    const prompt = `Translate this text into English:\n\n${selectedText}`;
    const params = {
      initialPrompts: [{ role: 'system', content: 'You are a multilingual translator.' }],
      temperature: sliderTemperature.value,
      topK: sliderTopK.value,
    };
    const translation = await runPrompt(prompt, params);
    showResponse(translation);
  } catch (e) { showError(e.message || e); }
});

buttonProofreadSelection.addEventListener('click', async () => {
  showLoading();
  try {
    const { selectedText } = await getSelectedText();
    const prompt = `Proofread and improve clarity:\n\n${selectedText}`;
    const params = {
      initialPrompts: [{ role: 'system', content: 'You are a professional editor.' }],
      temperature: sliderTemperature.value,
      topK: sliderTopK.value,
    };
    const proofread = await runPrompt(prompt, params);
    showResponse(proofread);
  } catch (e) { showError(e.message || e); }
});

buttonFindQuotes.addEventListener('click', async () => {
  showLoading();
  try {
    const { selectedText } = await getSelectedText();
    const prompt = `
Find 3 relevant quotes for this text:
"${selectedText}"

Format:
- "Quote" — Author
    `;
    const params = {
      initialPrompts: [{ role: 'system', content: 'You are a literary expert providing meaningful quotes.' }],
      temperature: sliderTemperature.value,
      topK: sliderTopK.value,
    };
    const quotes = await runPrompt(prompt, params);
    showResponse(quotes);
  } catch (e) { showError(e.message || e); }
});

buttonExtractCitation.addEventListener('click', async () => {
  showLoading();
  try {
    const { selectedText, tab } = await getSelectedText();
    const citation = await getCitationInfo(selectedText, tab.url);
    showResponse(formatCitation(citation));
  } catch (e) { showError(e.message || e); }
});

async function getCitationInfo(selectedText, pageUrl) {
  const prompt = `
Extract structured citation info for this text:
"${selectedText}"

Return JSON with:
- title
- author
- date
- url (use this page URL if not available)
JSON only.
`;
  const params = {
    initialPrompts: [{ role: 'system', content: 'You are an assistant that extracts citation metadata.' }],
    temperature: 0,
    topK: 1,
  };
  const response = await runPrompt(prompt, params);
  try {
    return JSON.parse(response);
  } catch {
    return { raw: response, url: pageUrl };
  }
}
function formatCitation(c) {
  if (c.raw) return c.raw;
  return `Title: ${c.title || 'N/A'}\nAuthor: ${c.author || 'N/A'}\nDate: ${c.date || 'N/A'}\nURL: ${c.url || 'N/A'}`;
}

// Ensure hidden initially
highlightsSection.hidden = true;
highlightsTextbox.readOnly = true;
buttonSaveHighlights.hidden = true;

// --- Toggle highlights section ---
buttonToggleHighlights.addEventListener('click', async () => {
  const isVisible = !highlightsSection.hidden;
  if (isVisible) {
    highlightsSection.hidden = true;
    buttonToggleHighlights.textContent = 'Show Saved Highlights';
  } else {
    await renderConsolidatedHighlights();
    highlightsSection.hidden = false;
    buttonToggleHighlights.textContent = 'Hide Saved Highlights';
  }
});

// --- Render all highlights in a single textarea ---
async function renderConsolidatedHighlights() {
  return new Promise((resolve) => {
    chrome.storage.local.get({ highlights: [] }, (data) => {
      const highlights = data.highlights || [];
      if (highlights.length === 0) {
        highlightsTextbox.value = 'No saved highlights yet.';
        highlightsTextbox.readOnly = true;
        buttonSaveHighlights.hidden = true;
      } else {
        highlightsTextbox.value = highlights.map(h => h.text).join('\n\n');
        highlightsTextbox.readOnly = false;
        buttonSaveHighlights.hidden = false;
      }
      resolve();
    });
  });
}

// --- Save edited highlights ---
buttonSaveHighlights.addEventListener('click', () => {
  const newText = highlightsTextbox.value.trim();
  if (!newText) return alert('Text cannot be empty.');

  const newHighlights = newText.split(/\n{2,}/).map(text => ({
    text,
    date: new Date().toISOString(),
  }));

  chrome.storage.local.set({ highlights: newHighlights }, () => {
    alert('All highlights saved!');
    console.log('✅ Highlights updated:', newHighlights);
  });
});

// --- Export highlights ---
buttonExportHighlights.addEventListener('click', () => {
  const text = highlightsTextbox.value.trim();
  if (!text) return alert('No highlights to export.');
  exportTextAsFile(text, 'highlights.txt');
});

// --- Export prompt response ---
buttonExportResponse.addEventListener('click', () => {
  const text = elementResponse.textContent.trim();
  if (!text) return alert('No prompt result to export.');
  exportTextAsFile(text, 'prompt-result.txt');
});
