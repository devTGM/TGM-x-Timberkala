class DrawerNavSection extends HTMLElement {
  constructor() {
    super();

    this.headerParentLinkClass = "wt-header__nav-teaser__link--parent";
    this.pageOverlayClass = "menu-drawer-overlay";
    this.triggerQuery = [
      ".wt-header__menu-trigger",
      `.${this.headerParentLinkClass}`,
      ".wt-drawer__close",
      `.${this.pageOverlayClass}`,
    ].join(", ");
    this.triggers = () => document.querySelectorAll(this.triggerQuery);
    this.getHeaderHeight = () =>
      getStyleProperty(document.querySelector(".wt-header"), "height");
    this.headerMenu = document.querySelector(".wt-header--v3");
    this.menuToggleButton = document.querySelector(".wt-header__menu-trigger");
    this.closeButton = this.querySelector(".wt-drawer__close");
    this.isOpen = false;
    this.triggerElement = null;
    this.isAlwaysMobile = () => document.body.classList.contains("mobile-nav");
    this.desktopBreakpoint = 990;
    this.isDesktop = () =>
      window.matchMedia(`(min-width: ${this.desktopBreakpoint}px)`).matches;
  }

  connectedCallback() {
    this.init();
  }

  openMobileSubmenu(linkValue) {
    const menuParentLinks = document.querySelectorAll(
      ".wt-page-nav-mega__link--parent",
    );
    const classParentActiveMobile = "submenu-opened";

    menuParentLinks.forEach((link) => {
      link.classList.remove(classParentActiveMobile);

      if (link.attributes?.href?.value === linkValue) {
        link.classList.add(classParentActiveMobile);
        const subMenuLinks = link.nextElementSibling.querySelectorAll(
          'a[data-menu-level="2"]',
        );
        setTabindex(subMenuLinks, "0");
      }
    });
  }

  handleTabindex() {
    const linksLvl1 = this.querySelectorAll('a[data-menu-level="1"]');

    if (!this.isAlwaysMobile()) {
      setTabindex(linksLvl1, this.isDesktop() ? "0" : "-1");
    }
  }

  updateAriaStateForTriggers() {
    const triggers = document.querySelectorAll(
      "[aria-controls='wt-drawer-nav']",
    );
    triggers.forEach((trigger) => {
      const isOpen = this.isOpen;
      trigger.setAttribute("aria-expanded", isOpen);
    });
  }

  temporaryHideFocusVisible() {
    document.body.classList.add("no-focus-visible");
  }

  openMenu(e) {
    this.isOpen = true;
    this.triggerElement = e.currentTarget;
    this.closeButton.setAttribute("tabindex", "0");
    this.closeButton.focus();
    this.temporaryHideFocusVisible();
  }

  closeSubmenus() {
    const openSubmenus = this.querySelectorAll(".submenu-opened");
    openSubmenus.forEach((submenu) => {
      submenu.classList.remove("submenu-opened");

      // Deactivate level 2 links
      const subMenuLinksLevel2 = submenu.nextElementSibling.querySelectorAll(
        'a[data-menu-level="2"]',
      );
      setTabindex(subMenuLinksLevel2, "-1");

      // Deactivate level 3 links
      const subMenuLinksLevel3 = submenu.nextElementSibling.querySelectorAll(
        'a[data-menu-level="3"]',
      );
      setTabindex(subMenuLinksLevel3, "-1");
    });
  }

  closeMenu() {
    this.isOpen = false;
    this.triggerElement.focus();
    this.triggerElement = null;
    this.closeButton.setAttribute("tabindex", "-1");
    this.closeSubmenus();
    this.temporaryHideFocusVisible();
  }

  toggleMenu(e) {
    e.preventDefault();

    if (this.isOpen) {
      this.closeMenu(e);
    } else {
      this.openMenu(e);
    }

    this.updateAriaStateForTriggers();

    const linksLvl1 = this.querySelectorAll('a[data-menu-level="1"]');
    const menuMobileFooterLinks = this.querySelectorAll(
      "a.wt-page-nav-mega__aside-list__link",
    );

    toggleTabindex(linksLvl1);
    toggleTabindex(menuMobileFooterLinks);
    this.toggleMenuButtonAttr();

    // this.handleFocus();

    const isFullHeightDrawer = () =>
      document.querySelectorAll("body.nav-drawer-big").length;
    const drawerTopPadding = isFullHeightDrawer() ? 0 : this.getHeaderHeight();
    const drawerBodeEl = document.querySelector(".wt-drawer__content");
    const activeNavBodyClass = "menu-open";
    const activeOverlayBodyClass = "menu-drawer-overlay-on";
    const headerMenuParentLinkClass = "wt-header__nav-teaser__link--parent";

    if (e.currentTarget.classList.contains(headerMenuParentLinkClass)) {
      this.openMobileSubmenu(e.currentTarget.attributes?.href?.value);
    }

    document.body.classList.toggle(activeNavBodyClass);
    document.body.classList.toggle(activeOverlayBodyClass);
    drawerBodeEl.style.setProperty("padding-top", drawerTopPadding);
  }

  toggleMenuButtonAttr() {
    const dataOpen =
      this.menuToggleButton.dataset.open === "true" ? "false" : "true";
    this.menuToggleButton.dataset.open = dataOpen;
  }

  toggleThirdOptionMenu() {
    const menuButton = document.querySelector(
      ".wt-header__icon.wt-header__menu-trigger.wt-icon",
    );

    if (this.headerMenu) {
      const dataOpen = menuButton.dataset.open === "true" ? "false" : "true";
      menuButton.dataset.open = dataOpen;
    }
  }

  getFocusableElements() {
    const focusableElementsSelector =
      "button, [href], input, select, [tabindex]";
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

  init() {
    if (!document.querySelector(`.${this.pageOverlayClass}`)) {
      const overlay = document.createElement("div");
      overlay.classList.add(this.pageOverlayClass);

      document.body.appendChild(overlay);
    }

    this.handleTabindex();

    window.addEventListener("resize", this.handleTabindex.bind(this));

    this.addEventListener("keydown", (e) => {
      const isTabPressed =
        e.key === "Tab" || e.keyCode === 9 || e.code === "Tab";
      const { first, last, focusableElements } = this.getFocusableElements();

      if (e.key === "Escape" || e.keyCode === 27 || e.code === "Escape") {
        if (this.isOpen) {
          this.toggleMenu(e);
        }
      }

      if (!this.isDesktop() || this.isAlwaysMobile()) {
        if (isTabPressed) {
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

    this.triggers().forEach((trigger) => {
      trigger.addEventListener("click", (e) => {
        this.toggleMenu(e);
        this.toggleThirdOptionMenu();
      });
    });
  }
}

customElements.define("drawer-nav", DrawerNavSection);

class MegaMenuSection extends HTMLElement {
  constructor() {
    super();

    this.classParentActiveMobile = "submenu-opened";
    this.classParentActiveDesk = "dropdown-opened";
    this.classBodyActiveDesk = "dropdown-open-desk";

    this.isAlwaysMobile = () =>
      document.querySelector("page-header")?.dataset.alwaysMobileMenu === "true";
    this.desktopBreakpoint = 990;
    this.isDesktop = () =>
      window.matchMedia(`(min-width: ${this.desktopBreakpoint}px)`).matches;

    this.currentlyActiveSubmenu = null;
  }

  connectedCallback() {
    if (this.children.length === 0) {
      requestAnimationFrame(() => this.init());
    } else {
      this.init();
    }
  }

  toggleParentMob(el) {
    const { menuParentLinks, classParentActiveMobile } = this;
    const subMenuWrapper = el.nextElementSibling;
    const subMenuLinksLevel2 = subMenuWrapper.querySelectorAll(
      "[data-menu-level='2']",
    );

    toggleTabindex(subMenuLinksLevel2);

    menuParentLinks.forEach((link) => {
      if (link !== el) {
        link.classList.remove(classParentActiveMobile);

        // Ensure all submenus are closed and tabindex is set to -1
        const otherSubMenuWrapper = link.nextElementSibling;
        const otherSubMenuLinksLevel2 = otherSubMenuWrapper.querySelectorAll(
          "[data-menu-level='2']",
        );
        const otherSubMenuLinksLevel3 = otherSubMenuWrapper.querySelectorAll(
          "[data-menu-level='3']",
        );

        link.classList.remove(classParentActiveMobile);
        setTabindex(otherSubMenuLinksLevel2, "-1");
        setTabindex(otherSubMenuLinksLevel3, "-1");
      } else {
        el.classList.toggle(classParentActiveMobile);

        if (!el.classList.contains(classParentActiveMobile)) {
          const openedSubmenu =
            el.nextElementSibling.querySelectorAll(".submenu-opened");

          openedSubmenu.forEach((submenuLink) => {
            submenuLink.classList.remove("submenu-opened");
            const nestedSubMenuLinks =
              submenuLink.nextElementSibling.querySelectorAll(
                'a[data-menu-level="3"]',
              );
            setTabindex(nestedSubMenuLinks, "-1");
          });
        }
      }
    });
  }

  toggleSubmenuMob(el) {
    const { menuSubmenuParentLinks, classParentActiveMobile } = this;
    const subMenuLinksLevel3 = el.nextElementSibling.querySelectorAll(
      "[data-menu-level='3']",
    );

    toggleTabindex(subMenuLinksLevel3);

    menuSubmenuParentLinks.forEach((link) => {
      if (link !== el) {
        link.classList.remove(classParentActiveMobile);

        // Ensure all third-level submenus are closed and tabindex is set to -1
        const otherSubMenuLinksLevel3 =
          link.nextElementSibling.querySelectorAll("[data-menu-level='3']");

        link.classList.remove(classParentActiveMobile);
        setTabindex(otherSubMenuLinksLevel3, "-1");
      } else {
        el.classList.toggle(classParentActiveMobile);
      }
    });
  }

  hasClassMobileNav() {
    return document.body.classList.contains("mobile-nav");
  }

  isMobileMenu() {
    return (
      !window.matchMedia("(min-width: 990px)").matches ||
      this.hasClassMobileNav()
    );
  }

  initTabindex() {
    if (this.isDesktop() && !this.isAlwaysMobile()) {
      const parentLinks = this.querySelectorAll('a[data-menu-level="1"]');
      setTabindex(parentLinks, "0");
    }
  }

  init() {
    this.menuParentItems = this.querySelectorAll(
      ".wt-page-nav-mega__item--parent",
    );
    this.menuParentLinks = this.querySelectorAll(
      ".wt-page-nav-mega__link--parent",
    );
    this.menuSubmenuParentLinks = this.querySelectorAll(
      ".wt-page-nav-mega__sublist__link--parent",
    );
    const submenuParents = this.querySelectorAll(
      ".wt-page-nav-mega__sublist--parent",
    );

    const {
      menuParentLinks,
      menuSubmenuParentLinks,
      menuParentItems,
      classBodyActiveDesk,
      classParentActiveDesk,
    } = this;

    menuParentLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        if (this.isMobileMenu()) {
          e.preventDefault();
          this.toggleParentMob(link);
        }
      });
    });

    menuSubmenuParentLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        if (this.isMobileMenu()) {
          e.preventDefault();
          this.toggleSubmenuMob(link);
        } else {
          // On desktop, if the arrow icon specifically is clicked, toggle the flyout
          const isArrowClick = e.target.closest(".svg-icon--arrow-right") || e.target.closest(".svg-icon--plus");
          const parentLi = link.closest(".wt-page-nav-mega__sublist--parent");
          if (isArrowClick && parentLi && parentLi.querySelector(".wt-page-nav-mega__sublist--nested")) {
            e.preventDefault();
            e.stopPropagation();
            const isOpen = parentLi.classList.contains("submenu-opened");
            if (parentLi.parentElement) {
              parentLi.parentElement
                .querySelectorAll(".wt-page-nav-mega__sublist--parent")
                .forEach((sibling) => {
                  if (sibling !== parentLi) {
                    sibling.classList.remove("submenu-opened");
                    const sibNested = sibling.querySelector(".wt-page-nav-mega__sublist--nested");
                    if (sibNested) {
                      sibNested.style.removeProperty("display");
                      sibNested.style.removeProperty("opacity");
                      sibNested.style.removeProperty("visibility");
                      sibNested.style.removeProperty("pointer-events");
                      sibNested.style.removeProperty("transform");
                    }
                  }
                });
            }
            const makeOpen = !isOpen;
            parentLi.classList.toggle("submenu-opened", makeOpen);
            const nested = parentLi.querySelector(".wt-page-nav-mega__sublist--nested");
            if (nested) {
              if (makeOpen) {
                nested.style.setProperty("display", "flex", "important");
                nested.style.setProperty("opacity", "1", "important");
                nested.style.setProperty("visibility", "visible", "important");
                nested.style.setProperty("pointer-events", "auto", "important");
                nested.style.setProperty("transform", "translateX(0)", "important");
              } else {
                nested.style.removeProperty("display");
                nested.style.removeProperty("opacity");
                nested.style.removeProperty("visibility");
                nested.style.removeProperty("pointer-events");
                nested.style.removeProperty("transform");
              }
            }
          }
          // When the category link itself (e.g. Table Decor) is clicked on desktop,
          // allow standard browser navigation to link.href so the link is fully clickable!
        }
      });
    });

    this.initTabindex();

    const toggleSubmenuDesk = (item) => {
      const parentLink = item.querySelector('a[data-menu-level="1"]');
      if (!parentLink || !parentLink.nextElementSibling) return;
      const submenuLinks = parentLink.nextElementSibling.querySelectorAll(
        'a[data-menu-level="2"],a[data-menu-level="3"]',
      );
      if (this.isDesktop() && !this.isAlwaysMobile()) {
        setTabindex(
          submenuLinks,
          item.classList.contains(classParentActiveDesk) ? "0" : "-1",
        );
      }
    };

    const leftSubmenuClass = "submenu--left";
    menuParentItems.forEach((item, idx) => {
      addEventListeners(item, ["mouseover", "focusin"], (e) => {
        document.body.classList.add(classBodyActiveDesk);
        item.classList.add(classParentActiveDesk);

        // Ensure wrapper and sublist have unconstrained height and visible overflow
        const wrappers = item.querySelectorAll(".wt-page-nav-mega__sublist__wrapper");
        wrappers.forEach((wrapper) => {
          wrapper.style.setProperty("overflow", "visible", "important");
          wrapper.style.setProperty("max-height", "none", "important");
          wrapper.style.setProperty("height", "auto", "important");
        });
        const sublists = item.querySelectorAll(".wt-page-nav-mega__sublist");
        sublists.forEach((sublist) => {
          sublist.style.setProperty("overflow", "visible", "important");
          sublist.style.setProperty("max-height", "none", "important");
          sublist.style.setProperty("height", "auto", "important");
        });

        const xCoords = item.getBoundingClientRect().x;
        const windowWidth = window.innerWidth;
        const isElementInSecondHalfOfWindow = xCoords > windowWidth / 2;

        item.classList.toggle(leftSubmenuClass, isElementInSecondHalfOfWindow);

        toggleSubmenuDesk(item);
      });

      addEventListeners(item, ["mouseout", "focusout"], (e) => {
        if (e.type === "mouseout" && item.contains(e.relatedTarget)) return;
        if (e.type === "focusout" && item.contains(e.relatedTarget)) return;

        document.body.classList.remove(classBodyActiveDesk);
        item.classList.remove(classParentActiveDesk);

        const xCoords = item.getBoundingClientRect().x;
        const windowWidth = window.innerWidth;
        const isElementInSecondHalfOfWindow = xCoords > windowWidth / 2;

        item.classList.remove(leftSubmenuClass);

        item.querySelectorAll(".submenu-opened").forEach((sub) => {
          sub.classList.remove("submenu-opened");
        });
        item.querySelectorAll(".wt-page-nav-mega__sublist--nested").forEach((nested) => {
          nested.style.removeProperty("display");
          nested.style.removeProperty("opacity");
          nested.style.removeProperty("visibility");
          nested.style.removeProperty("pointer-events");
          nested.style.removeProperty("transform");
        });

        toggleSubmenuDesk(item);
      });
    });

    // Level 2 Submenu Parents (Wall Decor, Table Decor, Figurines, Furniture, Hangings)
    if (submenuParents) {
      submenuParents.forEach((parent) => {
        let leaveTimer;
        const showFlyout = () => {
          clearTimeout(leaveTimer);
          if (parent.parentElement) {
            parent.parentElement
              .querySelectorAll(".wt-page-nav-mega__sublist--parent")
              .forEach((sibling) => {
                if (sibling !== parent) {
                  sibling.classList.remove("submenu-opened");
                  const sibNested = sibling.querySelector(".wt-page-nav-mega__sublist--nested");
                  if (sibNested) {
                    sibNested.style.removeProperty("display");
                    sibNested.style.removeProperty("opacity");
                    sibNested.style.removeProperty("visibility");
                    sibNested.style.removeProperty("pointer-events");
                    sibNested.style.removeProperty("transform");
                  }
                }
              });
          }
          parent.classList.add("submenu-opened");

          // Ensure container does not clip
          const wrapper = parent.closest(".wt-page-nav-mega__sublist__wrapper");
          if (wrapper) {
            wrapper.style.setProperty("overflow", "visible", "important");
            wrapper.style.setProperty("max-height", "none", "important");
            wrapper.style.setProperty("height", "auto", "important");
          }
          const sublist = parent.closest(".wt-page-nav-mega__sublist");
          if (sublist) {
            sublist.style.setProperty("overflow", "visible", "important");
            sublist.style.setProperty("max-height", "none", "important");
            sublist.style.setProperty("height", "auto", "important");
          }

          // Force nested flyout to appear
          const nested = parent.querySelector(".wt-page-nav-mega__sublist--nested");
          if (nested) {
            nested.style.setProperty("display", "flex", "important");
            nested.style.setProperty("opacity", "1", "important");
            nested.style.setProperty("visibility", "visible", "important");
            nested.style.setProperty("pointer-events", "auto", "important");
            nested.style.setProperty("transform", "translateX(0)", "important");
            nested.style.setProperty("position", "absolute", "important");
            nested.style.setProperty("left", "100%", "important");
            nested.style.setProperty("top", "-8px", "important");
            nested.style.setProperty("z-index", "10005", "important");
            nested.style.setProperty("background-color", "#ffffff", "important");
          }
        };

        const hideFlyout = () => {
          leaveTimer = setTimeout(() => {
            parent.classList.remove("submenu-opened");
            const nested = parent.querySelector(".wt-page-nav-mega__sublist--nested");
            if (nested) {
              nested.style.removeProperty("display");
              nested.style.removeProperty("opacity");
              nested.style.removeProperty("visibility");
              nested.style.removeProperty("pointer-events");
              nested.style.removeProperty("transform");
            }
          }, 250);
        };

        parent.addEventListener("mouseenter", showFlyout);
        parent.addEventListener("mouseleave", hideFlyout);

        const nestedFlyout = parent.querySelector(".wt-page-nav-mega__sublist--nested");
        if (nestedFlyout) {
          nestedFlyout.addEventListener("mouseenter", () => clearTimeout(leaveTimer));
          nestedFlyout.addEventListener("mouseleave", hideFlyout);
        }
      });
    }
  }
}

customElements.define("mega-menu-section", MegaMenuSection);

class CollapsibleSection extends HTMLElement {
  constructor() {
    super();
    this.extractOptionsFromURL();

    // Property Initializations
    this.selectorInteractiveElements =
      "button, [href], input, select, [tabindex]";
    this.triggerClass = ".wt-collapse__trigger";
    this.classActiveTrigger = "wt-collapse__trigger--active";
    this.openAttr = this.dataset.open;
    this.accordionSet = this.dataset.accordionSet;
    this.mobileOnly = this.hasAttribute("data-mobile-only");
    this.breakpoint = 900;

    // Element References
    this.trigger = this.querySelector(this.triggerClass);
    this.content = this.querySelector(".wt-collapse__target");
    this.triggers = this.querySelectorAll(this.triggerClass);

    // Bind the resize handler
    this.handleResize = this.handleResize.bind(this);
  }

  static get observedAttributes() {
    return ["data-open"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "data-open" && oldValue !== newValue) {
      this.handleAriaAndTabindex();
    }
  }

  connectedCallback() {
    this.initialize();
    // Add resize event listener if mobileOnly is true
    if (this.mobileOnly) {
      window.addEventListener("resize", this.handleResize);
    }
  }

  disconnectedCallback() {
    if (this.mobileOnly) {
      window.removeEventListener("resize", this.handleResize);
    }
  }

  // Methods
  isOpen() {
    return this.dataset.open === "true";
  }

  isMobileView() {
    return window.innerWidth < this.breakpoint;
  }

  getInteractiveElements(container) {
    return Array.from(
      container.querySelectorAll(this.selectorInteractiveElements),
    ).filter((el) => !el.hasAttribute("disabled"));
  }

  handleAriaAndTabindex() {
    if (this.isOpen()) {
      this.trigger.setAttribute("aria-expanded", "true");
      this.setTabindex(this.getInteractiveElements(this.content), "0");
    } else {
      this.trigger.setAttribute("aria-expanded", "false");
      this.setTabindex(this.getInteractiveElements(this.content), "-1");
    }

    // Additional logic for mobile-only sections in desktop view
    if (this.mobileOnly && !this.isMobileView()) {
      // In desktop view, ensure content is accessible and trigger is not focusable
      this.setTabindex(this.getInteractiveElements(this.content), "0");
      this.trigger.setAttribute("tabindex", "-1");
    } else {
      // In mobile view, make sure the trigger is focusable
      this.trigger.setAttribute("tabindex", "0");
    }
  }

  setTabindex(elements, value) {
    elements.forEach((el) => el.setAttribute("tabindex", value));
  }

  extractOptionsFromURL() {
    const currentURL = window.location.href;
    const pattern = /option\.([^&]+)/g;

    const matches = currentURL?.match(pattern);
    const result = {};

    matches?.forEach((item) => {
      const [key, value] = item.split("=");
      const decodedValue = decodeURIComponent(value).replace("+", " ");

      const option = key.split(".")[1];

      if (result.hasOwnProperty(option)) {
        result[option].push(decodedValue);
      } else {
        result[option] = [decodedValue];
      }
    });

    activeOptions = result;
  }

  toggleState() {
    const isOpen = this.isOpen();
    this.dataset.open = isOpen ? "false" : "true";
    this.trigger.classList.toggle(this.classActiveTrigger);
  }

  toggleAccordion() {
    const accordionPanels = document.querySelectorAll(
      `collapsible-section[data-accordion-set="${this.accordionSet}"]`,
    );

    if (this.isOpen()) {
      this.toggleState();
    } else {
      accordionPanels.forEach((panelEl) => {
        if (panelEl !== this) {
          panelEl.dataset.open = "false";
          const panelTrigger = panelEl.querySelector(this.triggerClass);
          if (panelTrigger) {
            panelTrigger.classList.remove(this.classActiveTrigger);
          }
        }
      });
      this.dataset.open = "true";
      this.trigger.classList.add(this.classActiveTrigger);
    }
  }

  handleTriggers(e) {
    e.preventDefault();
    if (this.accordionSet) {
      this.toggleAccordion();
    } else {
      this.toggleState();
    }
  }

  handleResize() {
    if (this.isMobileView()) {
      this.enableCollapsible();
    } else {
      this.disableCollapsible();
    }
  }

  enableCollapsible() {
    // If the section is supposed to be open by default, respect that
    if (this.openAttr === "true") {
      this.dataset.open = "true";
      this.trigger.classList.add(this.classActiveTrigger);
    } else {
      this.dataset.open = "false";
      this.trigger.classList.remove(this.classActiveTrigger);
    }

    // Add event listeners to triggers
    this.triggers.forEach((el) => {
      el.addEventListener("click", (e) => this.handleTriggers(e));
    });

    // Make trigger focusable
    this.trigger.setAttribute("tabindex", "0");

    this.handleAriaAndTabindex();
  }

  disableCollapsible() {
    // Remove collapsible behavior
    this.dataset.open = "true";
    this.trigger.classList.remove(this.classActiveTrigger);

    // Remove event listeners from triggers
    this.triggers.forEach((el) => {
      el.removeEventListener("click", (e) => this.handleTriggers(e));
    });

    // Ensure all interactive elements are accessible
    this.trigger.setAttribute("aria-expanded", "false");
    this.setTabindex(this.getInteractiveElements(this.content), "0");

    // Make trigger unfocusable
    this.trigger.setAttribute("tabindex", "-1");
  }

  initialize() {
    if (this.mobileOnly) {
      // Handle initial state based on current viewport
      if (this.isMobileView()) {
        this.enableCollapsible();
      } else {
        this.disableCollapsible();
      }
    } else {
      // Non-mobile-only sections initialize as before
      if (this.openAttr === "true") {
        this.trigger.classList.add(this.classActiveTrigger);
      }

      this.triggers.forEach((el) => {
        el.addEventListener("click", (e) => this.handleTriggers(e));
      });

      // Make sure trigger is focusable
      this.trigger.setAttribute("tabindex", "0");

      this.handleAriaAndTabindex();
    }
  }
}

customElements.define("collapsible-section", CollapsibleSection);

class JsLink extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.handleClickOrEnter = this.handleClickOrEnter.bind(this);
    this.worksOnlyForMobile = Boolean(this.dataset.mobile);
    this.initialize();
  }

  initialize() {
    this.addEventListener("click", this.handleClickOrEnter);
  }

  handleClickOrEnter(e) {
    if (this.worksOnlyForMobile && window.innerWidth > 600) return;
    const href = this.getAttribute("href");
    const target = this.getAttribute("target");
    if (e.type === "click") {
      if (target === "_blank") {
        window.open(href, target);
      } else {
        window.location = href;
      }
    }
  }
}

customElements.define("js-link", JsLink);

class ModalDialog extends HTMLElement {
  constructor() {
    super();
    // Event handler bindings
    this._onModalCloseClick = this._onModalCloseClick.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._onClick = this._onClick.bind(this);
    this.getFocusableElements = this.getFocusableElements.bind(this);
  }

  connectedCallback() {
    if (!this.moved) {
      this.moved = true;
      document.body.appendChild(this);
    }

    // Add event listeners
    const modalCloseButton = this.querySelector('[id^="ModalClose-"]');
    if (modalCloseButton) {
      modalCloseButton.addEventListener("click", this._onModalCloseClick);
    }

    this.addEventListener("keyup", this._onKeyUp);
    this.addEventListener("keydown", this._onKeyDown);

    if (this.classList.contains("media-modal")) {
      this.addEventListener("pointerup", this._onPointerUp);
    } else {
      this.addEventListener("click", this._onClick);
    }
  }

  disconnectedCallback() {
    // Remove event listeners
    const modalCloseButton = this.querySelector('[id^="ModalClose-"]');
    if (modalCloseButton) {
      modalCloseButton.removeEventListener("click", this._onModalCloseClick);
    }

    this.removeEventListener("keyup", this._onKeyUp);
    this.removeEventListener("keydown", this._onKeyDown);

    if (this.classList.contains("media-modal")) {
      this.removeEventListener("pointerup", this._onPointerUp);
    } else {
      this.removeEventListener("click", this._onClick);
    }
  }

  temporaryHideFocusVisible() {
    document.body.classList.add("no-focus-visible");
  }

  show(opener) {
    this.openedBy = opener;
    const popup = this.querySelector(".template-popup");
    document.body.classList.add("overflow-hidden");
    this.setAttribute("open", "");
    if (popup) popup.loadContent();

    // Focus management
    const modalCloseButton = this.querySelector('[id^="ModalClose-"]');
    if (modalCloseButton) {
      modalCloseButton.setAttribute("tabindex", "0");
      modalCloseButton.focus();

      this.temporaryHideFocusVisible();
    }

    // Update tabindex of focusable elements inside modal
    const { focusableElements } = this.getFocusableElements();
    focusableElements.forEach((el) => el.setAttribute("tabindex", "0"));

    window.pauseAllMedia?.();
  }

  hide() {
    document.body.classList.remove("overflow-hidden");
    document.body.dispatchEvent(new CustomEvent("modalClosed"));
    this.removeAttribute("open");

    // Focus management
    if (this.openedBy && typeof this.openedBy.focus === "function") {
      this.openedBy.focus();

      this.temporaryHideFocusVisible();
    }
    this.openedBy = null;

    // Reset tabindex of focusable elements inside modal
    const { focusableElements } = this.getFocusableElements();
    focusableElements.forEach((el) => el.setAttribute("tabindex", "-1"));

    window.pauseAllMedia?.();
  }

  getFocusableElements() {
    const focusableElementsSelector =
      'button, [href], [role="button"], a, input, select, textarea';
    const focusableElements = Array.from(
      this.querySelectorAll(focusableElementsSelector),
    ).filter(
      (el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"),
      // && el.tabIndex >= 0,
    );

    return {
      focusableElements,
      first: focusableElements[0],
      last: focusableElements[focusableElements.length - 1],
    };
  }

  // Event handler methods
  _onModalCloseClick(event) {
    this.hide(false);
  }

  _onKeyUp(event) {
    if (event.code.toUpperCase() === "ESCAPE") {
      this.hide();
    }
  }

  _onKeyDown(event) {
    const isTabPressed =
      event.key === "Tab" || event.keyCode === 9 || event.code === "Tab";
    const { first, last } = this.getFocusableElements();

    if (
      event.key === "Escape" ||
      event.keyCode === 27 ||
      event.code === "Escape"
    ) {
      this.hide();
    }

    if (isTabPressed) {
      if (event.shiftKey) {
        if (
          document.activeElement === first ||
          document.activeElement === this
        ) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  _onPointerUp(event) {
    if (
      event.pointerType === "mouse" &&
      !event.target.closest("deferred-media, product-model")
    ) {
      this.hide();
    }
  }

  _onClick(event) {
    if (event.target === this) {
      this.hide();
    }
  }
}
customElements.define("modal-dialog", ModalDialog);

class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button = this.querySelector("button");

    if (!button) return;
    button.addEventListener("click", () => {
      const modal = document.querySelector(this.getAttribute("data-modal"));
      if (modal) modal.show(button);
    });
  }
}
customElements.define("modal-opener", ModalOpener);

class CartNotification extends HTMLElement {
  constructor() {
    super();

    this.notification = document.getElementById("cart-notification");
    this.header = document.querySelector("sticky-header");
    this.onBodyClick = this.handleBodyClick.bind(this);

    this.notification.addEventListener(
      "keyup",
      (evt) => evt.code === "Escape" && this.close(),
    );
    this.querySelectorAll('button[type="button"]').forEach((closeButton) =>
      closeButton.addEventListener("click", this.close.bind(this)),
    );
  }

  open() {
    this.notification.classList.add("animate", "active");

    this.notification.addEventListener(
      "transitionend",
      () => {
        this.notification.focus();
        trapFocus(this.notification);
      },
      { once: true },
    );

    document.body.addEventListener("click", this.onBodyClick);
  }

  close() {
    this.notification.classList.remove("active");
    document.body.removeEventListener("click", this.onBodyClick);

    removeTrapFocus(this.activeElement);
  }

  renderContents(parsedState) {
    this.cartItemKey = parsedState.key;
    this.getSectionsToRender().forEach((section) => {
      document.getElementById(section.id).innerHTML = this.getSectionInnerHTML(
        parsedState.sections[section.id],
        section.selector,
      );
    });

    if (this.header) this.header.reveal();
    this.open();
  }

  getSectionsToRender() {
    return [
      {
        id: "cart-notification-product",
        selector: `[id="cart-notification-product-${this.cartItemKey}"]`,
      },
      {
        id: "cart-notification-button",
      },
      {
        id: "cart-icon-bubble",
      },
    ];
  }

  getSectionInnerHTML(html, selector = ".shopify-section") {
    return new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector(selector).innerHTML;
  }

  handleBodyClick(evt) {
    const target = evt.target;
    if (target !== this.notification && !target.closest("cart-notification")) {
      const disclosure = target.closest("details-disclosure, header-menu");
      this.activeElement = disclosure
        ? disclosure.querySelector("summary")
        : null;
      this.close();
    }
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define("cart-notification", CartNotification);

function fetchConfig(type = "json") {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: `application/${type}`,
    },
  };
}

document.body.addEventListener("keydown", function (e) {
  const target = e.target;

  const isThumbnail = target.getAttribute("role") === "thumbnail";

  const isEnter = e.code === "Enter" || e.key === "Enter" || e.keyCode === 13;
  const isTab = e.code === "Tab" || e.key === "Tab" || e.keyCode === 9;
  const isSpace = e.code === "Space" || e.key === " " || e.keyCode === 32;
  const isSearch = target.dataset.search;

  if (isTab) {
    document.body.classList.remove("no-focus-visible");
  }

  const isButtonLike =
    target.getAttribute("role") === "button" ||
    target.getAttribute("role") === "option" ||
    target.tagName === "A" ||
    target.tagName === "INPUT" ||
    target.tagName === "LABEL" ||
    target.tagName === "JS-LINK" ||
    isThumbnail;
  const keyboardSupport = isButtonLike && (isEnter || isSpace);

  if (keyboardSupport && !isThumbnail) {
    if (isEnter) {
      if (!isSearch) e.preventDefault();
      e.stopPropagation();
    }

    if (isSpace) {
      if (!isSearch) e.preventDefault();
    }
    target.click();
  } else if (keyboardSupport && isThumbnail) {
    let slideNumber;
    const mainSliderElement = document.querySelector("[data-gallery]");
    const mainSlides = mainSliderElement.querySelectorAll("li");

    const thumbSlideMediaId = e.target.dataset.slideMediaId;

    mainSlides.forEach((slide, id) => {
      if (slide.dataset.mediaId === thumbSlideMediaId) {
        slideNumber = id;
      }
    });

    if (mainSliderElement) {
      const swiperInstance = mainSliderElement.swiper;

      if (swiperInstance) {
        swiperInstance.slideTo(slideNumber);
        swiperInstance.slideReset();
        const currentSlide = mainSlides[slideNumber];
        const currentSlideBtn = currentSlide?.querySelector("button");
        const currentSlideVideo = currentSlide?.querySelector("video");
        const currentSlideImg = currentSlide?.querySelector("a");
        currentSlideBtn?.focus();
        currentSlideVideo?.focus();
        // if (currentSlideImg && !currentSlideBtn && !currentSlideVideo)
        currentSlideImg?.click();
      } else {
        console.error("Swiper instance not found on the element");
      }
    } else {
      console.error("Swiper element not found");
    }
  }
});

// for debug only TODO: remove this in final version
// document.addEventListener("focusin", function (event) {
//   console.log(`Current focused element: [${event.target.textContent}]`);
//   console.log(event.target);
// });

// document.addEventListener("shopify:section:load", (event) => {
//   console.log("Shopify section load:");
//   console.log(event);
// });
//
// document.addEventListener("shopify:section:select", (event) => {
//   console.log("Shopify section select:");
//   console.log(event);
// });
//
// document.addEventListener("shopify:section:reorder", (event) => {
//   console.log("Shopify section reorder:");
//   console.log(event);
// });







