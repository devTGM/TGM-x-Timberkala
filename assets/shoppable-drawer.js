if (!customElements.get("shoppable-drawer")) {
  customElements.define(
    "shoppable-drawer",
    class ShoppableDrawer extends HTMLElement {
      constructor() {
        super();
        this.initilize();
      }

      initilize() {
        this.clickHandler = this.clickHandler.bind(this);
        this.closeHandler = this.closeHandler.bind(this);
        this.updateEventListeners = this.updateEventListeners.bind(this);
        this.deviceType = "";
        this.isOpen = this.dataset.open;
        this.body = document.querySelector("body");
        this.container = document.querySelector(".wt__shoppable-image");
        this.wrapper = document.querySelector(".wt__shoppable-image--wrapper");
        this.shoppableBody = document.getElementById("shoppable-image__body");
        this.shoppableImagesBody = document.querySelectorAll(
          ".shoppable-image__body",
        );
        this.pageOverlay = document.querySelector(
          ".wt__shoppable-image--page-overlay",
        );
        this.productContent = this.querySelector(".wt-dot__tooltip a");
        this.tooltip = this.querySelector(".wt-dot__tooltip");

        this.button = this.querySelector(".wt-dot__circle");
        this.closeButton = document.querySelector(".wt-options__title svg");
        this.handleHideTooltips = this.handleHideTooltips.bind(this);

        if (window.innerWidth < 900) this.updateEventListeners();
        this.addDotEventListeners();
      }

      connectedCallback() {
        this.updateEventListeners();
        this.shoppableImagesBody.forEach((link) => {
          this.handleAddListenerToHideTooltips(link);
        });
        window.addEventListener("resize", this.handleResize);
        document.addEventListener("click", this.handleHideTooltips);
      }

      addDotEventListeners() {
        document.querySelectorAll(".wt-dot").forEach((link) => {
          link.addEventListener("click", this.handleDotClick);
          link.addEventListener("keydown", this.handleDotKeydown);
        });
      }

      handleDotClick = (event) => {
        event.preventDefault();
        this.toggleTooltip(event.srcElement.parentElement.nextElementSibling);
      };

      handleDotKeydown = (event) => {
        if (event.key === "Enter" || event.keyCode === 13) {
          event.preventDefault();
          this.toggleTooltip(event.srcElement.parentElement.nextElementSibling);
        }
      };

      toggleTooltip(tooltip) {
        this.hideAllTooltips();
        if (
          window.getComputedStyle(tooltip).getPropertyValue("visibility") ===
          "hidden"
        ) {
          this.showTooltip(tooltip);
        }
      }

      hideAllTooltips() {
        const tooltips = document.getElementsByClassName("wt-dot__tooltip");
        Array.from(tooltips).forEach((tooltip) => {
          tooltip.style.visibility = "hidden";
          tooltip.style.opacity = 0;
        });
      }

      showTooltip(tooltip) {
        tooltip.style.visibility = "visible";
        tooltip.style.opacity = 1;
      }

      handleResize = () => {
        this.updateEventListeners();
      };

      handleAddListenerToHideTooltips(link) {
        link.addEventListener("click", (event) => {
          if (this.isClickOutside(event)) {
            this.hideTooltips();
          }
        });
      }

      handleRemoveListenerToHideTooltips(link) {
        link.removeEventListener("click", (event) => {
          if (this.isClickOutside(event)) {
            this.hideTooltips();
          }
        });
      }

      handleHideTooltips(event) {
        let isInsideShoppableBody = event.target.closest(
          ".shoppable-image__body",
        );
        if (!isInsideShoppableBody) {
          this.hideTooltips();
        }
      }

      hideTooltips() {
        const resolution = this.matchResolution();
        if (resolution === "mobile") {
          this.closeHandler();
        } else {
          var tooltips = document.getElementsByClassName("wt-dot__tooltip");
          for (let i = 0; i < tooltips.length; i++) {
            tooltips[i].style.visibility = "hidden";
            tooltips[i].style.opacity = 0;
          }
        }
      }

      isClickOutside(event) {
        return !(
          (
            event.target.classList.contains("wt-dot__circle") ||
            event.target.classList.contains("wt-dot__ringing") ||
            event.target.closest(".wt-dot__tooltip")
          ) // Add this to keep the tooltip if clicked inside it
        );
      }

      updateEventListeners() {
        if (
          this.matchResolution() === "mobile" &&
          this.matchResolution() != this.deviceType
        ) {
          if (this.button)
            this.button.addEventListener("click", this.clickHandler);
          if (this.button)
            this.button.addEventListener("keydown", this.enterKeyHandler);

          if (this.tooltip) this.tooltip.style.display = "none";
          if (this.closeButton)
            this.closeButton.addEventListener("click", this.closeHandler);
          this.deviceType = this.matchResolution();
        } else if (
          this.matchResolution() === "desktop" &&
          this.matchResolution != this.deviceType
        ) {
          if (this.button)
            this.button.removeEventListener("click", this.clickHandler);
          if (this.button)
            this.button.removeEventListener("keydown", this.enterKeyHandler);
          this.closeHandler();
          if (this.tooltip) this.tooltip.style.display = "initial";
          this.deviceType = this.matchResolution();
        }
      }

      enterKeyHandler = (event) => {
        if (event.key === "Enter" || event.keyCode === 13) {
          this.clickHandler(event);
        }
      };

      clickHandler() {
        this.wrapper.querySelectorAll(".wt-dot__link")?.forEach((element) => {
          element.remove();
        });
        this.body.classList.add("shoppable-image-on");
        this.isOpen = true;
        this.pageOverlay.classList.remove("hidden");
        const productContentClone = this.productContent.cloneNode(true);
        this.wrapper.appendChild(productContentClone);
        this.wrapper.classList.add("open");
      }

      closeHandler() {
        if (this.body.classList.contains("shoppable-image-on"))
          this.body.classList.remove("shoppable-image-on");
        if (!this.pageOverlay.classList.contains("hidden"))
          this.pageOverlay.classList.add("hidden");
        if (this.wrapper.classList.contains("open"))
          this.wrapper.classList.remove("open");
      }

      matchResolution() {
        if (window.innerWidth < 900) {
          return "mobile";
        } else {
          return "desktop";
        }
      }

      disconnectedCallback() {
        this.button?.removeEventListener("click", this.clickHandler);
        this.closeButton?.removeEventListener("click", this.closeHandler);
        window.removeEventListener("resize", this.handleResize);

        this.shoppableImagesBody.forEach((link) => {
          this.handleRemoveListenerToHideTooltips(link);
        });
        document.removeEventListener("click", this.handleHideTooltips);
      }
    },
  );
}
