class DrawerSearchSection extends HTMLElement {
  constructor() {
    super();

    this.isOpen = false;
    this.drawerClass = "wt-drawer-search";
    this.drawer = this;
    this.classDrawerActive = `${this.drawerClass}--active`;
    this.pageOverlayClass = "search-overlay";
    this.activeOverlayBodyClass = `${this.pageOverlayClass}-on`;
    this.body = document.body;

    this.cachedResults = {};
    this.isVisibleClearButton = false;
    this.isInitialized = false;

    this.saveSuggestionMenuInDesignMode =
      this.saveSuggestionMenuInDesignMode.bind(this);
  }

  connectedCallback() {
    const init = () => {
      // Safely move drawer to body so it acts as a global modal without breaking HTML parsing
      if (document.body && this.parentElement && this.parentElement !== document.body) {
        document.body.appendChild(this);
      }
      this.setup();
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      setTimeout(init, 0);
    }
  }

  setup() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.body = document.body;
    this.input = this.querySelector('input[name="q"]');
    this.clearButton = this.querySelector(".wt-header__search__clear-button");
    this.closeButton = this.querySelector(".wt-header__search__close");
    this.predictiveSearchResults = this.querySelector(
      "[data-predictive-search]",
    );
    this.mainTrigger = document.querySelector(".wt-header__search-trigger, .inova-search-trigger");
    this.emptyAnnouncement = this.querySelector(".search-empty");
    this.toggleTabindexElements = [this.input, this.closeButton].filter(Boolean);

    this.setupEventListeners();
    this.init();
  }

  getFocusableElements() {
    const focusableElementsSelector =
      "button, [href], input:not([type='hidden']), select, [tabindex]";
    const focusableElements = () =>
      Array.from(this.querySelectorAll(focusableElementsSelector)).filter(
        (el) => !el.hasAttribute("disabled") && el.tabIndex >= 0,
      );

    return {
      focusableElements,
      first: focusableElements()[0],
      last: focusableElements()[focusableElements().length - 1],
    };
  }

  openDrawer() {
    if (!this.isOpen) {
      this.toggleDrawerClasses();
    }
  }

  closeDrawer() {
    if (this.isOpen) {
      this.toggleDrawerClasses();
    }
  }

  onToggle() {
    if (this.hasAttribute("open")) {
      this.removeAttribute("open");
      if (typeof setTabindex === "function") {
        setTabindex(this.toggleTabindexElements, "-1");
        if (this.mainTrigger) setTabindex([this.mainTrigger], "0");
      }
      this.isOpen = false;
      setTimeout(() => {
        if (this.mainTrigger) this.mainTrigger.focus();
      }, 0);
    } else {
      this.setAttribute("open", "");
      if (typeof setTabindex === "function") {
        setTabindex(this.toggleTabindexElements, "0");
        if (this.mainTrigger) setTabindex([this.mainTrigger], "-1");
      }
      if (this.input) {
        setTimeout(() => {
          this.input.focus();
        }, 50);
      }
      this.isOpen = true;
    }
  }

  toggleDrawerClasses() {
    this.onToggle();
    this.classList.toggle(this.classDrawerActive, this.isOpen);
    (this.body || document.body).classList.toggle(this.activeOverlayBodyClass, this.isOpen);
  }

  init() {
    if (this.closeButton) {
      this.closeButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.closeDrawer();
      });
    }

    if (this.clearButton) {
      this.clearButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.input) this.input.value = "";
        this.clearButton.style.display = "none";
        this.isVisibleClearButton = false;
        this.clearResults();
      });
    }

    this.addEventListener("click", (e) => {
      if (this.isOpen && e.target === this) {
        this.closeDrawer();
      }
    });

    this.addEventListener("keydown", (e) => {
      const isTabPressed =
        e.key === "Tab" || e.keyCode === 9 || e.code === "Tab";
      const { first, last } = this.getFocusableElements();

      if (e.key === "Escape" || e.keyCode === 27 || e.code === "Escape") {
        if (this.isOpen) {
          this.closeDrawer();
        }
      }

      if (isTabPressed) {
        if (this.isOpen && first && last) {
          if (e.shiftKey && document.activeElement === first) {
            last.focus();
            e.preventDefault();
          } else if (!e.shiftKey && document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    });

    if (this.input) {
      this.input.addEventListener("input", () => {
        if (this.clearButton) {
          if (this.input.value.length > 0 && !this.isVisibleClearButton) {
            this.clearButton.style.display = "flex";
            this.clearButton.setAttribute("tabindex", "0");
            this.isVisibleClearButton = true;
          } else if (this.input.value.length === 0 && this.isVisibleClearButton) {
            this.clearButton.style.display = "none";
            this.clearButton.setAttribute("tabindex", "-1");
            this.isVisibleClearButton = false;
          }
        }
      });
    }
  }

  // search stuff
  setupEventListeners() {
    const form = this.querySelector("form.store-search-form");
    if (form) {
      form.addEventListener("submit", this.onFormSubmit.bind(this));
    }

    if (this.input) {
      const debounceFn = (typeof debounce === "function")
        ? debounce
        : (fn, wait) => {
            let t;
            return function(...args) {
              clearTimeout(t);
              t = setTimeout(() => fn.apply(this, args), wait);
            };
          };

      this.input.addEventListener(
        "input",
        debounceFn((event) => {
          this.onChange(event);
        }, 300).bind(this),
      );
    }

    if (window.Shopify && Shopify.designMode) {
      document.addEventListener(
        "shopify:section:load",
        this.saveSuggestionMenuInDesignMode,
      );
    }
  }

  saveSuggestionMenuInDesignMode() {
    if (this.body && this.body.classList.contains(this.activeOverlayBodyClass))
      this.drawer.classList.toggle(this.classDrawerActive);
  }

  getQuery() {
    return this.input ? this.input.value.trim() : "";
  }

  onChange() {
    const searchTerm = this.getQuery();

    if (searchTerm.length) {
      this.getSearchResults(searchTerm);
      this.removeAttribute("empty");
    } else {
      this.clearResults();
    }
  }

  onFormSubmit(event) {
    if (
      !this.getQuery().length ||
      this.querySelector('[aria-selected="true"] a')
    )
      event.preventDefault();
  }

  getSearchResults(searchTerm) {
    const queryKey = searchTerm.replace(" ", "-").toLowerCase();
    this.setLiveRegionLoadingState();

    if (this.cachedResults[queryKey]) {
      this.renderSearchResults(this.cachedResults[queryKey]);
      return;
    }

    const predictiveUrl =
      (window.routes && window.routes.predictive_search_url) ||
      (typeof routes !== "undefined" && routes.predictive_search_url) ||
      "/search/suggest";

    fetch(
      `${predictiveUrl}?q=${encodeURIComponent(searchTerm)}&${encodeURIComponent("resources[type]")}=product,page,article,collection,query&${encodeURIComponent("resources[limit_scope]")}=each&${encodeURIComponent("resources[limit]")}=6&section_id=predictive-search`,
    )
      .then((response) => {
        if (!response.ok) {
          let error = new Error(response.status);
          throw error;
        }
        return response.text();
      })
      .then((text) => {
        const resultsMarkup = new DOMParser()
          .parseFromString(text, "text/html")
          .querySelector("#shopify-section-predictive-search")?.innerHTML;
        if (resultsMarkup) {
          this.cachedResults[queryKey] = resultsMarkup;
          this.renderSearchResults(resultsMarkup);
        }
      })
      .catch((error) => {
        console.error("Predictive search error:", error);
      });
  }

  setLiveRegionLoadingState() {
    this.statusElement =
      this.statusElement || this.querySelector(".predictive-search-status");
    this.loadingText =
      this.loadingText || this.getAttribute("data-loading-text");

    if (this.loadingText) {
      this.setLiveRegionText(this.loadingText);
    }
    this.setAttribute("loading", "true");
  }

  setLiveRegionText(statusText) {
    if (!this.statusElement) return;
    this.statusElement.setAttribute("aria-hidden", "false");
    this.statusElement.textContent = statusText;

    setTimeout(() => {
      if (this.statusElement) {
        this.statusElement.setAttribute("aria-hidden", "true");
      }
    }, 1000);
  }

  renderSearchResults(resultsMarkup) {
    if (this.predictiveSearchResults) {
      this.predictiveSearchResults.innerHTML = resultsMarkup;
    }

    this.setAttribute("results", "true");
    this.setLiveRegionResults();
  }

  setLiveRegionResults() {
    this.removeAttribute("loading");
    const countVal = this.querySelector("[data-predictive-search-live-region-count-value]")?.textContent;
    if (countVal) {
      this.setLiveRegionText(countVal);
    }
  }

  clearResults() {
    if (this.input) this.input.value = "";
    this.removeAttribute("results");
    this.setAttribute("empty", "true");
  }
}

if (!customElements.get("search-drawer")) {
  customElements.define("search-drawer", DrawerSearchSection);
}

// Global delegated click listener so any search trigger reliably opens the drawer
document.addEventListener("click", (e) => {
  const trigger = e.target.closest(
    ".wt-header__search-trigger, .inova-search-trigger, [rel='toggle-search']"
  );
  if (trigger) {
    e.preventDefault();
    const drawer = document.querySelector("search-drawer");
    if (drawer) {
      if (typeof drawer.openDrawer === "function") {
        drawer.openDrawer();
      } else if (typeof drawer.setup === "function") {
        drawer.setup();
        if (typeof drawer.openDrawer === "function") {
          drawer.openDrawer();
        }
      }
    }
  }
});
