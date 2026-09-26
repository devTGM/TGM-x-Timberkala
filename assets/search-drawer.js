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
    if (document.body && this.parentElement && this.parentElement !== document.body) {
      document.body.appendChild(this);
      return;
    }

    if (!this.isInitialized) {
      this.isInitialized = true;
      this.input = this.querySelector('input[name="q"]');
      this.clearButton = this.querySelector(".wt-header__search__clear-button");
      this.closeButton = this.querySelector(".wt-header__search__close");
      this.predictiveSearchResults = this.querySelector(
        "[data-predictive-search]",
      );
      this.mainTrigger = document.querySelector(".wt-header__search-trigger");
      this.emptyAnnouncement = this.querySelector(".search-empty");
      this.toggleTabindexElements = [this.input, this.closeButton].filter(Boolean);

      this.setupEventListeners();
      this.init();
    }
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
    this.drawer.classList.toggle(this.classDrawerActive);
    this.body.classList.toggle(this.activeOverlayBodyClass);
  }

  init() {
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest(".wt-header__search-trigger");
      if (trigger) {
        e.preventDefault();
        this.openDrawer();
      }
    });

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
        if (this.isOpen) {
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

    this.input.addEventListener("input", () => {
      if (this.input.value.length > 0 && !this.isVisibleClearButton) {
        this.clearButton.style.display = "flex";
        this.clearButton.setAttribute("tabindex", "0");
        this.isVisibleClearButton = true;
      } else if (this.input.value.length === 0 && this.isVisibleClearButton) {
        this.clearButton.style.display = "none";
        this.clearButton.setAttribute("tabindex", "-1");
        this.isVisibleClearButton = false;
      }
    });
  }

  // search stuff
  setupEventListeners() {
    const form = this.querySelector("form.store-search-form");
    form.addEventListener("submit", this.onFormSubmit.bind(this));
    this.input.addEventListener(
      "input",
      debounce((event) => {
        this.onChange(event);
      }, 300).bind(this),
    );

    if (Shopify.designMode) {
      document.addEventListener(
        "shopify:section:load",
        this.saveSuggestionMenuInDesignMode,
      );
    }
  }

  saveSuggestionMenuInDesignMode() {
    if (this.body.classList.contains(this.activeOverlayBodyClass))
      this.drawer.classList.toggle(this.classDrawerActive);
  }

  getQuery() {
    return this.input.value.trim();
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

    fetch(
      `${routes.predictive_search_url}?q=${encodeURIComponent(searchTerm)}&${encodeURIComponent("resources[type]")}=product,page,article,collection,query&${encodeURIComponent("resources[limit_scope]")}=each&${encodeURIComponent("resources[limit]")}=6&section_id=predictive-search`,
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
          .querySelector("#shopify-section-predictive-search").innerHTML;
        this.cachedResults[queryKey] = resultsMarkup;
        this.renderSearchResults(resultsMarkup);
      })
      .catch((error) => {
        throw error;
      });
  }

  setLiveRegionLoadingState() {
    this.statusElement =
      this.statusElement || this.querySelector(".predictive-search-status");
    this.loadingText =
      this.loadingText || this.getAttribute("data-loading-text");

    this.setLiveRegionText(this.loadingText);
    this.setAttribute("loading", true);
  }

  setLiveRegionText(statusText) {
    this.statusElement.setAttribute("aria-hidden", "false");
    this.statusElement.textContent = statusText;

    setTimeout(() => {
      this.statusElement.setAttribute("aria-hidden", "true");
    }, 1000);
  }

  renderSearchResults(resultsMarkup) {
    this.predictiveSearchResults.innerHTML = resultsMarkup;

    this.setAttribute("results", true);

    this.setLiveRegionResults();
  }

  setLiveRegionResults() {
    this.removeAttribute("loading");
    this.setLiveRegionText(
      this.querySelector("[data-predictive-search-live-region-count-value]")
        ?.textContent,
    );
  }

  clearResults() {
    this.input.value = "";
    this.removeAttribute("results");
    this.setAttribute("empty", true);
  }
}

customElements.define("search-drawer", DrawerSearchSection);
