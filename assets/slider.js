import Swiper from "./swiper-bundle.esm.browser.min.js";

if (!customElements.get("slideshow-section")) {
  customElements.define(
    "slideshow-section",
    class Slider extends HTMLElement {
      constructor() {
        super();
        this.swiper = null;
        this.configuration = null;
        this.handleKeyboard = this.handleKeyboard.bind(this);
      }

      handleTabindex(swiper) {
        const isSlidesGroup = this.hasAttribute("data-slides-group");
        const focusableSelectors =
          "a, button, input, textarea, select, [tabindex]";
        const totalSlides = swiper.slides.length;
        const slidesPerView = swiper.params.slidesPerView;

        if (swiper && totalSlides > slidesPerView) {
          swiper.slides.forEach((slide) => {
            if (isSlidesGroup) {
              const slideRect = slide.getBoundingClientRect();
              const swiperRect = this.getBoundingClientRect();

              const isFullyVisible =
                slideRect.left >= swiperRect.left &&
                slideRect.right <= swiperRect.right &&
                slideRect.top >= swiperRect.top &&
                slideRect.bottom <= swiperRect.bottom;

              slide.querySelectorAll(focusableSelectors).forEach((el) => {
                if (isFullyVisible) {
                  el.setAttribute("tabindex", "0");
                } else {
                  el.setAttribute("tabindex", "-1");
                }
                if (el.hasAttribute("data-omit-tabindex")) {
                  el.setAttribute("tabindex", "-1");
                }
              });
            } else {
              swiper.slides.forEach((slide) => {
                slide.querySelectorAll(focusableSelectors).forEach((el) => {
                  el.setAttribute("tabindex", "-1");
                });
              });

              const activeSlide = swiper.slides[swiper.activeIndex];
              activeSlide
                ?.querySelectorAll(focusableSelectors)
                .forEach((el) => {
                  el.setAttribute(
                    "tabindex",
                    el.hasAttribute("data-omit-tabindex") ? "-1" : "0",
                  );
                });
            }
          });
        } else {
          swiper.slides.forEach((slide) => {
            slide.querySelectorAll(focusableSelectors).forEach((el) => {
              el.setAttribute(
                "tabindex",
                el.hasAttribute("data-omit-tabindex") ? "-1" : "0",
              );
            });
          });
        }
      }

      handleKeyboard(event) {
        const keyCode = event.keyCode || event.which;
        const focusedElement = document.activeElement;

        if (this.swiper && this.swiper.el.contains(focusedElement)) {
          switch (keyCode) {
            case 37: // Left arrow
              this.swiper.slidePrev();
              break;
            case 39: // Right arrow
              this.swiper.slideNext();
              break;
          }
        }
      }

      connectedCallback() {
        this.readConfiguration();
        this.initializeOrDestroySwiperForBrands =
          this.initializeOrDestroySwiperForBrands.bind(this);
        this.centerNavigation = this.centerNavigation.bind(this);
        this.shouldSkipCenterNavMethod =
          this.dataset.skipCenterNavMethod === "true";
        // Initialize the swiper based on conditions
        if (window.innerWidth < 900 && !this.swiper) {
          this.swiperInitilize();
        }

        // Register resize event listeners
        window.addEventListener("resize", this.centerNavigation);

        if (this.dataset.brands === "true") {
          window.addEventListener(
            "resize",
            this.initializeOrDestroySwiperForBrands,
          );
        } else if (this.configuration.enableOnMedia) {
          window.addEventListener("resize", this.matchResolution.bind(this)); // Using bind directly here
          this.breakpoint = window.matchMedia(this.configuration.enableOnMedia);
          this.matchResolution();
        } else {
          this.swiperInitilize();
          this.swiper.update();
        }

        // Add keyboard event listener
        window.addEventListener("keydown", this.handleKeyboard);
      }

      disconnectedCallback() {
        window.removeEventListener(
          "resize",
          this.initializeOrDestroySwiperForBrands,
        );
        window.removeEventListener("resize", this.centerNavigation);
        window.removeEventListener("keydown", this.handleKeyboard);
      }

      initializeOrDestroySwiperForBrands() {
        if (window.innerWidth < 900) {
          if (!this.swiper) this.swiperInitilize();
        } else if (this.swiper) this.swiperDestroy();
      }

      centerNavigation() {
        if (window.innerWidth < 900 || this.shouldSkipCenterNavMethod) return;

        const picture = this.querySelector("picture")?.classList.contains(
          "hero__pic--mobile",
        )
          ? this.querySelectorAll("picture")[1]
          : this.querySelector("picture");

        if (picture) {
          const boundingClientRectPic = picture.getBoundingClientRect();

          const btns = this.querySelectorAll(".wt-slider__nav-btn");
          btns.forEach(
            (btn) =>
              (btn.style.top = `${22 + boundingClientRectPic.height / 2}px`),
          );
        }
      }

      readConfiguration() {
        const default_configuration = {
          autoHeight: false,
          slidesPerView: 1,
          autoplay: false,
          threshold: 5,
          pagination: {
            el: ".swiper-pagination",
            renderBullet(index, className) {
              return `<span class="${className} swiper-pagination-bullet--svg-animation"><svg width="20" height="20" viewBox="0 0 28 28"><circle class="svg__circle" cx="14" cy="14" r="12" fill="none" stroke-width="2"></circle><circle class="svg__circle-inner" cx="14" cy="14" r="5" stroke-width="2"></circle></svg></span>`;
            },
          },
          navigation: {
            nextEl: ".wt-slider__nav-next",
            prevEl: ".wt-slider__nav-prev",
          },
          scrollbar: false,
          on: {
            afterInit: (swiper) => {
              const dataSwiper = this.querySelector("[data-swiper]");
              const dataSwiperContainer = this.querySelector(
                "[data-swiper-container]",
              );
              dataSwiper?.classList.remove("loading");
              dataSwiperContainer?.classList.remove("loading");

              this.centerNavigation();
              this.handleTabindex(swiper);
            },
            slideChangeTransitionEnd: (swiper) => {
              this.handleTabindex(swiper);
            },
          },
        };

        const get_custom_configuration = this.querySelector(
          "[data-swiper-configuration]",
        )?.innerHTML;
        const custom_configuration = get_custom_configuration
          ? JSON.parse(get_custom_configuration)
          : {};
        this.configuration = {
          ...default_configuration,
          ...custom_configuration,
        };

        if (this.configuration.autoplay) {
          if (window.innerWidth < 900) {
            var override_configuration = {
              autoplay: false,
            };
          }
          this.configuration = {
            ...this.configuration,
            ...override_configuration,
          };
        }
      }

      matchResolution() {
        if (this.breakpoint.matches === true) {
          if (!this.swiper) {
            this.swiperInitilize();
          }
        } else if (this.swiper) {
          this.swiperDestroy();
        }
      }

      swiperInitilize() {
        const node = this;
        const container = this.querySelector("[data-swiper]");
        this.querySelector("[data-swiper]").classList.add(
          "swiper",
          "wt-slider__container",
        );
        this.querySelector("[data-swiper-container]").classList.add(
          "swiper-wrapper",
          "wt-slider__wrapper",
        );
        this.querySelectorAll("[data-swiper-slide]").forEach(function (e) {
          e.classList.add("swiper-slide", "wt-slider__slide");
        });
        this.swiper = new Swiper(container, this.configuration);
      }

      swiperDestroy() {
        this.querySelector("[data-swiper]").classList.remove(
          "swiper",
          "wt-slider__container",
        );
        this.querySelector("[data-swiper-container]").classList.remove(
          "swiper-wrapper",
          "wt-slider__wrapper",
        );
        this.querySelectorAll("[data-swiper-slide]").forEach(function (e) {
          e.classList.remove("swiper-slide", "wt-slider__slide");
        });
        this.swiper.destroy();
        if (this.querySelector(".swiper-pagination"))
          this.querySelector(".swiper-pagination").innerHTML = "";
        this.swiper = null;
      }

      slideTo(slide) {
        this.swiper.autoplay.stop();
        const index = Array.from(slide.parentNode.children).indexOf(slide);
        this.swiper.slideTo(index);
      }
    },
  );
}
