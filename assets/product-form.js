if (!customElements.get("product-form")) {
  customElements.define(
    "product-form",
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector("form");
        this.formInput = this.form?.querySelector("[name=id]");
        if (this.formInput) this.formInput.disabled = false;
        this.form?.addEventListener("submit", this.onSubmitHandler.bind(this));
        this.cart = document.querySelector("cart-drawer");
        this.cartType = this.cart?.dataset.cartType;
        
        this.submitButton = this.querySelector('[type="submit"]');
        this.body = document.querySelector("body");

        if (document.querySelector("cart-drawer"))
          this.submitButton?.setAttribute("aria-haspopup", "dialog");

        this.hideErrors = this.dataset.hideErrors === "true";

        this.handleErrorMessage = this.handleErrorMessage.bind(this);
        this.redirectAfterSubmit = this.redirectAfterSubmit.bind(this);
        this.disableLoadingInButton = this.disableLoadingInButton.bind(this);
      }

      closeComplementaryProduct() {
        const complementaryOverlayPage = document.querySelector(
          ".wt__quick-buy--page-overlay",
        );
        if (this.body.classList.contains("quick-buy-page-overlay"))
          this.body.classList.remove("quick-buy-page-overlay");
        if (
          complementaryOverlayPage.classList.contains(
            "wt__quick-buy--page-overlay--open",
          )
        )
          complementaryOverlayPage.classList.remove(
            "wt__quick-buy--page-overlay--open",
          );
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute("aria-disabled") === "true") return;

        this.handleErrorMessage();
        this.cart?.setActiveElement(document.activeElement);

        const loader = this.querySelector(".loading-overlay__spinner");

        this.submitButton.setAttribute("aria-disabled", true);
        this.submitButton.classList.add("loading");
        if (loader) loader.classList.remove("hidden");

        const config = fetchConfig("javascript");
        config.headers["X-Requested-With"] = "XMLHttpRequest";
        delete config.headers["Content-Type"];

        const formData = new FormData(this.form);
        formData.append(
          "sections",
          this.cart.getSectionsToRender().map((section) => section.id),
        );
        formData.append("sections_url", window.location.pathname);
        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              publish(PUB_SUB_EVENTS.cartError, {
                source: "product-form",
                productVariantId: formData.get("id"),
                errors: response.errors || response.description,
                message: response.message,
              });
              this.handleErrorMessage(response.description);
              this.error = true;

              const soldOutMessage =
                this.submitButton.querySelector(".sold-out-message");
              if (!soldOutMessage) return;
              this.submitButton.setAttribute("aria-disabled", true);
              this.submitButton.querySelector("span").classList.add("hidden");
              soldOutMessage.classList.remove("hidden");
              return;
            } else if (!this.cart) {
              // window.location = window.routes.cart_url;
              handleFloCartBtn();

              return;
            }

            if (!this.error)
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: "product-form",
                productVariantId: formData.get("id"),
                cartData: response,
              });
            this.error = false;
            const quickAddModal = this.closest("quick-add-modal");
            if (quickAddModal) {
              document.body.addEventListener(
                "modalClosed",
                () => {
                  setTimeout(() => {
                    // this.redirectAfterSubmit(response);
                  handleFloCartBtn();

                  });
                },
                { once: true },
              );
              if(this.cartType === 'drawer') quickAddModal.hide(true);
            } else {
              // this.redirectAfterSubmit(response);
             handleFloCartBtn();

            }
          })
          .catch((e) => {
            console.error(e);
            if (e instanceof TypeError && e.message.includes("'cart-drawer'")) {
              location.reload();
            }
          })
          .finally(() => {
            if(this.cartType === 'page') {
              if(this.error) this.disableLoadingInButton();
              return
            }
            this.disableLoadingInButton();
            if (this.cart && this.cart.classList.contains("is-empty"))
              this.cart.classList.remove("is-empty");
            if (!this.error) this.submitButton.removeAttribute("aria-disabled");
            if (this.error) return;
            this.quick_add_container = document.querySelector(".wt__quick-buy");
            this.quick_add_product =
              this.quick_add_container.querySelector(".wt-product");
            this.loader = this.quick_add_container.querySelector(
              ".wt__quick-buy-loader",
            );

            if (!this.quick_add_container.classList.contains("hidden")) {
              this.quick_add_product?.remove();
              this.quick_add_container.classList.add("hidden");
              this.loader.classList.remove("hidden");
            }
          });
      }

      disableLoadingInButton(){
        this.submitButton.classList.remove("loading");
        this.querySelector(".loading-overlay__spinner").classList.add(
          "hidden",
        );
      }

      redirectAfterSubmit(response) {
        if(this.cartType === 'drawer'){
          // this.cart.renderContents(response);
          handleFloCartBtn();
          return;
        }
        window.location = window.routes.cart_url;
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper =
          this.errorMessageWrapper ||
          this.querySelector(".product-form__error-message-wrapper");
        if (!this.errorMessageWrapper) return;
        this.errorMessage =
          this.errorMessage ||
          this.errorMessageWrapper.querySelector(
            ".product-form__error-message",
          );

        this.errorMessageWrapper.toggleAttribute("hidden", !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }
    },
  );
}
