if (!customElements.get("color-swatch")) {
  customElements.define(
    "color-swatch",
    class ColorSwatch extends HTMLElement {
      constructor() {
        super();
      }

      connectedCallback() {
        this.initialize();
      }

      initialize() {
        this.initProperites();
        this.initButtons();
        this.initCounter();
      }

      initProperites() {
        const node = this;
        this.container = node.querySelector(".card__container");
        this.adnotation = node.querySelector(".card");
        this.color_swatcher_container = this.container.querySelector(
          ".card__color-swatcher--container",
        );
        this.color_swatcher_wrappers = this.container.querySelectorAll(
          ".color-swatcher--wrapper",
        );
        this.color_swatcher_counter = this.container.querySelector(
          ".color-swatcher--counter",
        );
        [this.img, this.hover_img] =
          this.container.querySelectorAll(".card__img");
        this.video = this.querySelector("video");
        this.clicked_href = this.adnotation.getAttribute("href");
        this.clicked_img = this.img?.getAttribute("src");
        this.clicked_srcset = this.img?.getAttribute("srcset");
        this.clicked_hover_img = this.hover_img?.getAttribute("src");

        this.loader = this.querySelector(".card__loader");
      }

      initCounter() {
        if (this.color_swatcher_wrappers?.length > 4) {
          this.color_swatcher_counter.innerHTML += `+ ${this.color_swatcher_wrappers.length - 4}`;
          this.color_swatcher_container.addEventListener("mouseover", () =>
            this.showAllWrappers(),
          );
        }
      }

      showAllWrappers() {
        this.color_swatcher_wrappers.forEach((wrapper) =>
          wrapper.classList.remove("hidden"),
        );
        this.color_swatcher_counter.classList.add("hidden");
      }

      initButtons() {
        this.isCheckedOption = 0;
        if (this.color_swatcher_wrappers) {
          this.sortButtons();
          this.color_swatcher_wrappers.forEach((wrapper, index) => {
            const button = wrapper.querySelector(".color-swatcher");
            const attributes = this.getButtonAttributes(button);
            const tooltip = wrapper.querySelector(".color-swatcher--tooltip");

            if (this.isCheckedOption === 0)
              this.checkFilterOption(wrapper, attributes);

            if (index > 3) {
              wrapper.classList.add("hidden");
            }

            this.assignWrapperEvents(wrapper, attributes, tooltip);
          });

          if (this.isCheckedOption == 0) {
            this.setFirstOptionActive();
          }
        }

        if (this.color_swatcher_container) {
          this.color_swatcher_container.addEventListener("mouseleave", () =>
            this.restoreAttributes(),
          );
        }
      }

      getButtonAttributes(button) {
        return {
          dataColor: button.getAttribute("data-color"),
          button_href: button.getAttribute("data-href"),
          button_img: button.getAttribute("data-img"),
          button_srcset: button.getAttribute("data-srcset"),
          button_hover: button.getAttribute("data-hover"),
        };
      }

      checkFilterOption(
        wrapper,
        { dataColor, button_href, button_img, button_hover, button_srcset },
      ) {
        const filtersArray = Object.entries(activeOptions);

        if (this.isCheckedOption === 0) {
          for (const [key, value] of filtersArray) {
            if (value.indexOf(dataColor) !== -1) {
              this.setAttributes(this.adnotation, { href: button_href });
              this.setAttributes(this.img, { src: button_img });
              this.checkHoverImage(button_hover);
              this.clicked_href = button_href;
              this.clicked_img = button_img;
              this.clicked_srcset = button_srcset;
              this.clicked_hover_img = button_hover;
              wrapper.classList.add("active");
              this.isCheckedOption = 1;
              break;
            }
          }
        }
      }

      assignWrapperEvents(wrapper, attributes, tooltip) {
        wrapper.addEventListener("click", () =>
          this.handleClickEvent(wrapper, attributes),
        );
        wrapper.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            this.handleClickEvent(wrapper, attributes);
          }
        });
        wrapper.addEventListener("mouseover", () =>
          this.handleMouseOverEvent(wrapper, attributes, tooltip),
        );
        wrapper.addEventListener("mouseout", () =>
          this.handleMouseOutEvent(tooltip),
        );
      }

      handleClickEvent(
        wrapper,
        { button_href, button_img, button_hover, button_srcset },
      ) {
        this.showLoader();

        this.setAttributes(this.adnotation, { href: button_href });
        this.setAttributes(this.img, { src: button_img });
        this.setAttributes(this.img, { srcset: button_srcset });
        this.checkHoverImage(button_hover);
        this.color_swatcher_wrappers.forEach((wrap) => {
          wrap.classList.remove("active");
        });
        this.clicked_href = button_href;
        this.clicked_img = button_img;
        this.clicked_srcset = button_srcset;
        this.clicked_hover_img = button_hover;
        wrapper.classList.add("active");

        this.video?.classList.add("hidden");
        this.isVideoHidden = true;
        this.img.classList.remove("hidden");
        this.img.onload = () => {
          this.hideLoader();
          this.img.onload = null;
        };
      }

      showLoader() {
        this.loader.classList.remove("hidden");
        this.loader.innerHTML = '<div class="spinner-ring"></div>';
        if (!this.img) return;
        this.img.style.opacity = 0;
      }

      hideLoader() {
        this.loader.classList.add("hidden");
        this.loader.innerHTML = "";
        if (!this.img) return;
        this.img.style.opacity = 1;
      }

      handleMouseOverEvent(
        wrapper,
        { button_href, button_img, button_hover, button_srcset },
        tooltip,
      ) {
        this.setAttributes(this.adnotation, { href: button_href });
        this.setAttributes(this.img, { src: button_img });
        this.setAttributes(this.img, { srcset: button_srcset });
        this.checkHoverImage(button_hover);
        tooltip.classList.remove("hidden");
        this.setTooltipPosition(tooltip);
      }

      handleMouseOutEvent(tooltip) {
        tooltip.classList.add("hidden");
        tooltip.classList.remove(
          "color-swatcher--tooltip-left",
          "color-swatcher--tooltip-right",
        );
      }

      setTooltipPosition(tooltip) {
        const coords = tooltip.getBoundingClientRect();
        const screenWidth = window.innerWidth;

        if (!coords) return;

        if (coords.x < 0) {
          tooltip.classList.add("color-swatcher--tooltip-left");
        } else if (coords.right > screenWidth) {
          tooltip.classList.add("color-swatcher--tooltip-right");
        }
      }

      setFirstOptionActive() {
        const wrapper = this.color_swatcher_wrappers[0];
        if (wrapper) {
          const button = wrapper.querySelector(".color-swatcher");
          const attributes = this.getButtonAttributes(button);
          this.setAttributes(this.adnotation, { href: attributes.button_href });
          this.setAttributes(this.img, { src: attributes.button_img });
          this.setAttributes(this.img, { srcset: attributes.button_srcset });
          this.checkHoverImage(attributes.button_hover);
          wrapper.classList.add("active");
        }
      }

      restoreAttributes() {
        this.setAttributes(this.adnotation, { href: this.clicked_href });
        this.setAttributes(this.img, { src: this.clicked_img });
        this.setAttributes(this.img, { srcset: this.clicked_srcset });
        this.checkHoverImage(this.clicked_hover_img);
      }

      sortButtons() {
        if (this.color_swatcher_wrappers) {
          const newArr = Array.from(this.color_swatcher_wrappers).sort(
            (a, b) => {
              const classA = a.classList?.contains("unavailable");
              const classB = b.classList?.contains("unavailable");
              return classA && !classB ? 1 : !classA && classB ? -1 : 0;
            },
          );

          if (this.color_swatcher_container) {
            this.color_swatcher_container.innerHTML = "";
          }

          newArr.forEach((el) => this.color_swatcher_container.append(el));
          this.createCounterSpan();
          this.color_swatcher_wrappers = this.container.querySelectorAll(
            ".color-swatcher--wrapper",
          );
          this.color_swatcher_counter = this.container.querySelector(
            ".color-swatcher--counter",
          );
        }
      }

      createCounterSpan() {
        const counter_span = document.createElement("span");
        counter_span.classList.add("color-swatcher--counter");
        this.color_swatcher_container?.appendChild(counter_span);
      }

      setAttributes(element, attrs) {
        for (let key in attrs) {
          element?.setAttribute(key, attrs[key]);
        }
      }

      checkHoverImage(button_hover) {
        if (button_hover && this.hover_img) {
          this.setAttributes(this.hover_img, { src: button_hover });
        }
      }
    },
  );
}
