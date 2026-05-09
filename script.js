(function () {
  "use strict";

  const DEFAULT_SETTINGS = {
    gameTitle: "תבנית משחק",
    language: "he",
    direction: "rtl",
    nextButtonText: "הבא",
    endText: "סיום",
    restartButtonText: "התחל מחדש",
    showProgress: true,
    showRestartOnEnd: false
  };

  const els = {
    card: document.getElementById("gameCard"),
    gameTitle: document.getElementById("gameTitle"),
    progressText: document.getElementById("progressText"),
    endBadge: document.getElementById("endBadge"),
    imageWrap: document.getElementById("imageWrap"),
    pageImage: document.getElementById("pageImage"),
    pageTitle: document.getElementById("pageTitle"),
    pageBody: document.getElementById("pageBody"),
    pageNote: document.getElementById("pageNote"),
    nextButton: document.getElementById("nextButton"),
    restartButton: document.getElementById("restartButton")
  };

  let settings = { ...DEFAULT_SETTINGS };
  let pages = [];
  let currentPageIndex = 0;

  function normalizeSettings(rawSettings) {
    return {
      ...DEFAULT_SETTINGS,
      ...(rawSettings && typeof rawSettings === "object" ? rawSettings : {})
    };
  }

  function validatePages(rawPages) {
    if (!Array.isArray(rawPages) || rawPages.length === 0) {
      throw new Error("לא נמצאו עמודים להצגה. בדוק את קובץ התוכן.");
    }

    return rawPages.map((page, index) => {
      if (!page || typeof page !== "object") {
        throw new Error(`עמוד מספר ${index + 1} אינו מוגדר בצורה תקינה.`);
      }

      const title = page.title == null ? "" : String(page.title);
      const body = page.body == null ? "" : String(page.body);

      if (!title.trim() && !body.trim()) {
        throw new Error(`עמוד מספר ${index + 1} ריק. הוסף כותרת או טקסט.`);
      }

      return {
        title,
        body,
        note: page.note == null ? "" : String(page.note),
        image: page.image == null ? "" : String(page.image),
        alt: page.alt == null ? "" : String(page.alt)
      };
    });
  }

  function applyDocumentSettings() {
    document.documentElement.lang = settings.language || DEFAULT_SETTINGS.language;
    document.documentElement.dir = settings.direction || DEFAULT_SETTINGS.direction;
    document.title = settings.gameTitle || DEFAULT_SETTINGS.gameTitle;
    els.gameTitle.textContent = settings.gameTitle || DEFAULT_SETTINGS.gameTitle;
    els.nextButton.textContent = settings.nextButtonText || DEFAULT_SETTINGS.nextButtonText;
    els.restartButton.textContent = settings.restartButtonText || DEFAULT_SETTINGS.restartButtonText;
  }

  function renderPage() {
    const page = pages[currentPageIndex];
    const isFinalPage = currentPageIndex === pages.length - 1;

    els.card.classList.remove("error-state");
    els.card.classList.remove("is-changing");
    void els.card.offsetWidth;
    els.card.classList.add("is-changing");

    els.pageTitle.textContent = page.title;
    els.pageBody.textContent = page.body;

    els.pageNote.textContent = page.note;
    els.pageNote.hidden = !page.note.trim();

    renderImage(page);
    renderProgress();

    els.endBadge.textContent = settings.endText || DEFAULT_SETTINGS.endText;
    els.endBadge.hidden = !isFinalPage;
    els.nextButton.hidden = isFinalPage;
    els.restartButton.hidden = !(isFinalPage && settings.showRestartOnEnd);

    if (!isFinalPage) {
      els.nextButton.focus({ preventScroll: true });
    }
  }

  function renderImage(page) {
    els.pageImage.removeAttribute("src");
    els.pageImage.alt = page.alt || "";
    els.imageWrap.hidden = !page.image.trim();

    if (!page.image.trim()) {
      return;
    }

    els.pageImage.src = page.image;
  }

  function renderProgress() {
    if (!settings.showProgress) {
      els.progressText.hidden = true;
      return;
    }

    els.progressText.textContent = `עמוד ${currentPageIndex + 1} מתוך ${pages.length}`;
    els.progressText.hidden = false;
  }

  function showError(message) {
    applyDocumentSettings();
    els.card.classList.add("error-state");
    els.gameTitle.textContent = settings.gameTitle || DEFAULT_SETTINGS.gameTitle;
    els.progressText.hidden = true;
    els.endBadge.hidden = true;
    els.imageWrap.hidden = true;
    els.pageNote.hidden = true;
    els.pageTitle.textContent = "משהו לא נטען כמו שצריך";
    els.pageBody.textContent = message || "אירעה תקלה בטעינת המשחק. בדוק את קובץ content.json.";
    els.nextButton.hidden = true;
    els.restartButton.hidden = true;
  }

  async function loadContent() {
    const response = await fetch("content.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error("לא הצלחתי לטעון את content.json. בדוק שהקובץ קיים ושאתה מריץ את האתר דרך שרת מקומי או אחסון.");
    }

    return response.json();
  }

  async function init() {
    try {
      const content = await loadContent();
      settings = normalizeSettings(content.settings);
      pages = validatePages(content.pages);
      currentPageIndex = 0;
      applyDocumentSettings();
      renderPage();
    } catch (error) {
      showError(error instanceof Error ? error.message : "");
    }
  }

  els.nextButton.addEventListener("click", () => {
    if (currentPageIndex < pages.length - 1) {
      currentPageIndex += 1;
      renderPage();
    }
  });

  els.restartButton.addEventListener("click", () => {
    currentPageIndex = 0;
    renderPage();
  });

  els.pageImage.addEventListener("error", () => {
    els.imageWrap.hidden = true;
  });

  init();
})();
