# Nota
Submission for Google Chrome Built-in AI Challenge 2025
*Your personal research assistant powered by AI*

## Overview
**Nota** demonstrates the power of Chrome’s new **on-device AI capabilities**.  
It transforms Chrome into a self-contained productivity assistant that helps users work smarter while browsing, reading, or researching online — without ever sending data outside their computer.

---

## Video Demo


## Problem Statement
When researching or browsing online, users often need to:
- Summarize or simplify long articles  
- Translate or proofread selected text  
- Collect structured citation data for references  

Most existing AI tools require switching tabs, copying content, or connecting to external APIs — which slows down workflow and risks exposing private data.

**Nota** solves this by offering a **lightweight, privacy-first AI assistant** that runs entirely **on-device**, using Chrome’s built-in Gemini Nano model.  
It lets users analyze, refine, and reuse information instantly — right from within the browser.

---

## Features & Functionality
### 1. AI-Powered Text Tools
Perform text-based tasks instantly on any selected content:
- **Summarize Selection** – Condense lengthy text into clear, concise summaries  
- **Translate Selection** – Translate selected text into English  
- **Proofread Selection** – Improve grammar, structure, and clarity  
- **Find Related Quotes** – Retrieve relevant or literary quotes  
- **Extract Citation Info** – Identify structured citation data (title, author, date, URL) in JSON format  

All tasks are powered by **Gemini Nano** through the **Prompt API**, ensuring processing happens locally for **low latency and full privacy**.

---

### 2. Context Menu Integration
Right-click on any selected text to open the **Nota AI tools menu**.  
The extension automatically opens its side panel and displays the AI’s response — no copying or pasting required.

---

### 3. Interactive Side Panel Interface
A built-in side panel provides a full-featured AI workspace where users can:
- Enter **custom prompts**  
- Adjust **temperature** and **top-k** parameters to control creativity and output diversity  
- View **Markdown-formatted**, sanitized AI responses  
- **Export** results as plain text for offline use  

---

### 4. Highlight & Citation Management
- Save highlighted text or extracted citation data  
- View and edit saved notes directly in the side panel  
- Export all highlights or citations in one file  
- Data is securely stored using **chrome.storage.local**, keeping it **private and offline**

---

### 5. Customizable & Private
- Users can tweak creativity parameters in real time  
- No external API keys or internet required  
- Built with **HTML**, **CSS**, **JavaScript Modules**, and bundled using **Rollup**

---

## API Usage
| **API / Library** | **Purpose** |
|--------------------|-------------|
| **Chrome Prompt API (LanguageModel)** | Provides local access to Gemini Nano for summarization, translation, proofreading, and citation extraction. |
| **Chrome Side Panel API** | Displays the in-browser AI chat and results interface. |
| **Chrome Context Menus API** | Adds right-click actions (Summarize, Translate, Proofread, etc.) for selected webpage text. |
| **Chrome Scripting API** | Retrieves selected text from active webpages for processing. |
| **Chrome Storage API** | Stores highlights, citations, and settings locally to ensure privacy. |
| **DOMPurify** | Sanitizes AI-generated HTML to prevent XSS vulnerabilities. |
| **Marked.js** | Parses Markdown-formatted responses into safe, styled HTML. |
