class PageHeaderSection extends HTMLElement {
  constructor() {
    super();

    this.isSticky = this.dataset.sticky === "true";
    this.isTransparent = this.dataset.transparent === "true";
    this.isAlwaysMobileMenu = this.dataset.alwaysMobileMenu === "true";

    this.classBodyAlwaysMobileMenu = "mobile-nav";

    this.header = document.querySelector(".page-header");
    this.desktopMenuTrigger = document.querySelector(
      ".wt-header__sticky-menu-trigger",
    );
    this.desktopMenuBar = document.querySelector(".wt-drawer--nav");

    this.enabledClass = "sticky-enabled";
    this.showClass = "sticky-show";
    this.desktopHeaderWithMenuBarClass = "page-header--sticky-show-menubar-lg";
  }

  connectedCallback() {
    this.init();
  }

  disconnectedCallback() {
    this.disableStickyHeader();
  }

  enbleStickyHeader() {
    if (!this.header) {
      console.error("Header element not found for enabling sticky header");
      return;
    }

    document.body.classList.add("page-header-sticky");

    let prevScrollpos = window.pageYOffset;

    const isDesktop = window.matchMedia("(min-width: 1200px)").matches;
    const isMenuBarOpen = () =>
      this.header.classList.contains(this.desktopHeaderWithMenuBarClass);
    const isHeaderWithDesktopNav =
      !document.body.classList.contains("mobile-nav");
    const allLLevelsLinks =
      this.desktopMenuBar?.querySelectorAll("a[data-menu-level]");
    const onlyLevel1Links = this.desktopMenuBar?.querySelectorAll(
      "a[data-menu-level='1']",
    );

    const calculateNavbarTopMargin = () => {
      const header = document.querySelector("#header");
      const navbar = document.querySelector("#wt-drawer-nav");
      let marginTop = 0;

      if (navbar.offsetHeight > header.offsetHeight) {
        marginTop = header.offsetHeight - navbar.offsetHeight;
      } else {
        marginTop = Math.abs(navbar.offsetHeight - header.offsetHeight);
      }

      navbar.style.setProperty("--top-margin", `${marginTop}px`);

      return marginTop;
    };

    calculateNavbarTopMargin();

    const stickyHeader = {
      show: () => {
        if (this.header) this.header.classList.add(this.showClass);
        stickyHeader.visible = true;
        stickyHeader.handleBehavior();
        calculateNavbarTopMargin();
      },
      hide: () => {
        if (this.header) this.header.classList.remove(this.showClass);
        stickyHeader.visible = false;
        stickyHeader.handleBehavior();
      },
      enable: () => {
        if (this.header) this.header.classList.add(this.enabledClass);
        stickyHeader.enabled = true;
        stickyHeader.handleBehavior();
      },
      disable: () => {
        if (this.header)
          this.header.classList.remove(this.enabledClass, this.showClass);
        stickyHeader.enabled = false;
        stickyHeader.handleBehavior();
      },
      enabled: false,
      visible: true,
      handleBehavior: () => {
        if (isHeaderWithDesktopNav && isDesktop && this.header) {
          stickyHeader.log();
          if (!isMenuBarOpen() && stickyHeader.enabled) {
            setTabindex(allLLevelsLinks, "-1");
          }
          if (isMenuBarOpen() && stickyHeader.enabled) {
            setTabindex(allLLevelsLinks, "0");
          }
          if (!stickyHeader.enabled) {
            setTabindex(onlyLevel1Links, "0");
            if (this.desktopMenuTrigger)
              setTabindex([this.desktopMenuTrigger], "-1");
          } else if (this.desktopMenuTrigger)
            setTabindex([this.desktopMenuTrigger], "0");
        }
      },
      log: () => {},
    };

    // Save the scroll handler for later removal
    this.scrollHandler = () => {
      const currentScrollPos = window.pageYOffset;
      if (prevScrollpos > currentScrollPos) {
        stickyHeader.show();
      } else {
        stickyHeader.hide();
      }
      prevScrollpos = currentScrollPos;
    };

    window.addEventListener("scroll", this.scrollHandler);

    this.desktopMenuTrigger?.addEventListener("click", (e) => {
      e.preventDefault();
      this.desktopMenuBar?.classList.toggle("wt-drawer--nav-show");
      this.desktopMenuTrigger?.classList.toggle(
        "wt-header__sticky-menu-trigger--active",
      );
      this.header?.classList.toggle(this.desktopHeaderWithMenuBarClass);
      stickyHeader.handleBehavior();
    });

    const sentinel = document.querySelector(".sticky-header__threshold");
    const handleStickySentinel = (entries) => {
      entries.forEach(({ isIntersecting }) => {
        if (isIntersecting) {
          stickyHeader.disable();
        } else {
          stickyHeader.enable();
        }
      });
    };

    this.stickyHeaderObserver = new IntersectionObserver(handleStickySentinel);
    this.stickyHeaderObserver.observe(sentinel);
  }

  disableStickyHeader() {
    if (this.header) {
      // Remove classes added by sticky header
      this.header.classList.remove(
        this.enabledClass,
        this.showClass,
        this.desktopHeaderWithMenuBarClass,
      );
      document.body.classList.remove("page-header-sticky");
      this.desktopMenuBar?.classList.remove("wt-drawer--nav-show");
      this.desktopMenuTrigger?.classList.remove(
        "wt-header__sticky-menu-trigger--active",
      );
    }

    // Remove the scroll event listener
    if (this.scrollHandler) {
      window.removeEventListener("scroll", this.scrollHandler);
      this.scrollHandler = null;
    }

    // Disconnect the IntersectionObserver
    if (this.stickyHeaderObserver) {
      this.stickyHeaderObserver.disconnect();
      this.stickyHeaderObserver = null;
    }
  }

  init() {
    if (this.isAlwaysMobileMenu) {
      document.body.classList.add(this.classBodyAlwaysMobileMenu);
    } else {
      document.body.classList.remove(this.classBodyAlwaysMobileMenu);
    }

    if (this.isSticky) {
      this.enbleStickyHeader();
    } else {
      this.disableStickyHeader();
    }
  }
}

customElements.define("page-header", PageHeaderSection);
