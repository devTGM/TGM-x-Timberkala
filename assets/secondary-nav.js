if (!customElements.get("secondary-nav")) {
  customElements.define(
    "secondary-nav",
    class SecondaryNav extends HTMLElement {
      constructor() {
        super();
      }

      connectedCallback() {
        this.scrollableElement = this.querySelector(
          ".secondary-navigation__ul",
        );
        this.container = this.querySelector(".secondary-navigation");

        this.checkScroll = this.checkScroll.bind(this);

        if (this.scrollableElement && this.container) {
          this.scrollableElement.addEventListener("scroll", this.checkScroll);
        }
      }

      checkScroll() {
        if (
          this.scrollableElement.scrollWidth -
            this.scrollableElement.clientWidth ===
          this.scrollableElement.scrollLeft
        ) {
          // Scrolled to the right
          this.container.classList.add("at-max-scroll");
        } else {
          // Not scrolled to the right
          this.container.classList.remove("at-max-scroll");
        }

        // Check if scrolled from the left
        if (this.scrollableElement.scrollLeft > 0) {
          this.container.classList.add("not-at-min-scroll");
        } else {
          this.container.classList.remove("not-at-min-scroll");
        }
      }

      disconnectedCallback() {
        if (this.scrollableElement && this.container) {
          this.scrollableElement.removeEventListener(
            "scroll",
            this.checkScroll,
          );
        }
      }
    },
  );
}
