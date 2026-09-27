function formatVariantLabel(val, optionName) {
  if (!val || val === "Default Title") return val || "";

  const specialMap = {
    "LAWYER": "Lawyer",
    "FIREMAN": "Fireman",
    "SNOOKER": "Snooker",
    "LINERED": "Line Red",
    "MARIO_HANDCRAFTED_HERO": "Mario",
    "GROOT_HANDCRAFTED_HERO": "Groot",
    "POKEMON_HANDCRAFTED_HERO": "Pokemon",
    "SPONGEBOB_HANDCRAFTED_HERO": "Spongebob",
    "BATMAN": "Batman",
    "CaptainAmerica": "Captain America",
    "BICYCLE": "Bicycle",
    "ElvisPresly": "Elvis Presley",
    "GRADUATION": "Graduation",
    "FISHERMAN": "Fisherman",
    "whitetipsyduck": "White",
    "blacktipsyduck": "Black",
    "MediumShawnTheSheep": "Medium",
    "LargeShawnTheSheep": "Large",
    "SmallDriftWoodBowl": "Small",
    "BigDriftWoodBowl": "Large",
    "MukhaBuddhaForDecor": "Natural Finish"
  };
  if (specialMap[val]) return specialMap[val];

  let cleaned = val.replace(/_/g, " ").trim();

  const colors = [
    "Turquiose Blue Natural", "Blue White Pink", "Pink White Turquiose",
    "White Wash", "WhiteWash", "Dark Blue", "DarkBlue", "Light Blue", "LightBlue",
    "Sea Green", "SeaGreen", "Blue Wings", "BlueWings", "Turquiose", "Turquoise",
    "Blue", "Brown", "White", "Natural", "Pink", "Green", "Grey", "Gray",
    "Black", "Yellow", "Orange", "Mustard", "Gold", "Silver", "Multicolor"
  ];

  const optLower = (optionName || "").toLowerCase();
  if (optLower === "color" || !optionName) {
    for (const c of colors) {
      const regex = new RegExp("^" + c + "(?=[A-Z_\\s]|$)", "i");
      if (regex.test(cleaned)) {
        let std = c
          .replace(/Turquiose/gi, "Turquoise")
          .replace(/WhiteWash/gi, "White Wash")
          .replace(/BlueWings/gi, "Blue Wings")
          .replace(/([a-z])([A-Z])/g, "$1 $2");
        return std;
      }
    }
  }

  let formatted = cleaned
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/Turquiose/gi, "Turquoise");

  return formatted
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

if (!customElements.get("variant-options")) {
  customElements.define(
    "variant-options",
    class VariantOptions extends HTMLElement {
      whenLoaded = Promise.all([customElements.whenDefined("gallery-section")]);
      constructor() {
        super();
        this.addEventListener("change", this.onVariantChange);
        this.addEventListener("keydown", this.onKeyDown);

        this.container = document.querySelector(
          `section[data-product-handle="${this.getAttribute("data-product-handle")}"]`,
        );
      }

      connectedCallback() {
        this.whenLoaded.then(() => {
          this.initialize();
        });
      }

      disconnectedCallback() {}

      initialize() {
        this.sanitizeLabels();
        this.updateOptions();
        this.updateMasterId();
        this.updateGallery();
        this.updateVariantStatuses();
      }

      sanitizeLabels() {
        this.querySelectorAll(".wt-product__option").forEach((fieldset) => {
          const optionLabel = fieldset.querySelector(".wt-product__option__title .label")?.textContent?.replace(":", "")?.trim();
          fieldset.querySelectorAll(".f-button__list__link, .drawer__list__link span").forEach((labelEl) => {
            const rawVal = labelEl.textContent.trim();
            if (rawVal) {
              labelEl.textContent = formatVariantLabel(rawVal, optionLabel);
            }
          });
        });
      }

      onKeyDown(event) {
        if (event.key === "Enter" || event.keyCode === 13) {
          const input = event.target.querySelector("input");
          input?.click();
          // this.onVariantChange();
        }
      }

      onVariantChange() {
        const variantChangeStartEvent = new CustomEvent("variantChangeStart", {
          bubbles: true,
          composed: true,
        });
        this.dispatchEvent(variantChangeStartEvent);
        this.updateOptions();
        this.updateMasterId();
        this.updateGallery();
        this.toggleAddButton(true, "", false);
        this.updatePickupAvailability();
        this.removeErrorMessage();
        this.updateVariantStatuses();

        if (!this.currentVariant) {
          this.toggleAddButton(true, "", true);
          this.setUnavailable();
        } else {
          this.updateMedia();
          this.lenOfVariantOptions =
            document.querySelectorAll("variant-options").length;
          if (this.lenOfVariantOptions === 1) {
            this.updateURL();
          }
          this.updateVariantInput();
          this.renderProductInfo();
          this.updateShareUrl();
        }
        const variantChangeEndEvent = new CustomEvent("variantChangeEnd", {
          bubbles: true,
          composed: true,
        });
        this.dispatchEvent(variantChangeEndEvent);
      }

      updateGallery() {
        const mediaGallery = document.getElementById(
          `MediaGallery-${this.dataset.section}`,
        );

        let media_id = false;
        if (this.currentVariant && this.currentVariant.featured_media) {
          media_id = this.currentVariant.featured_media.id;
        }

        mediaGallery?.filterSlides(this.options, media_id, true);
      }

      updateOptions() {
        const fieldsets = Array.from(
          this.querySelectorAll(".wt-product__option"),
        );
        this.options = fieldsets.map((fieldset) => {
          return Array.from(fieldset.querySelectorAll("input")).find(
            (radio) => radio.checked,
          )?.value;
        });

        fieldsets.forEach((fieldset, index) => {
          const selectedOption = this.options[index];
          const optionLabel = fieldset.querySelector(".wt-product__option__title .label")?.textContent?.replace(":", "")?.trim();
          const cleanOption = formatVariantLabel(selectedOption, optionLabel);

          const valueEl = fieldset.querySelector(".wt-product__option__title .value");
          if (valueEl) valueEl.innerHTML = cleanOption;

          const dropdown = fieldset.querySelector(
            ".wt-product__option__dropdown span",
          );
          if (dropdown) dropdown.innerHTML = cleanOption;
        });
      }

      updateMasterId() {
        this.currentVariant = this.getVariantData()?.find((variant) => {
          return !variant.options
            .map((option, index) => {
              return this.options[index] === option;
            })
            .includes(false);
        });
      }

      updateMedia() {
        if (!this.currentVariant) return;
        this.setAttribute("data-variant-id", this.currentVariant?.id);
        if (!this.currentVariant.featured_media) return;
        this.setAttribute(
          "data-featured-image",
          this.currentVariant?.featured_media?.preview_image?.src,
        );
        this.setAttribute(
          "data-featured-image-id",
          this.currentVariant?.featured_media?.id,
        );

        const modalContent = document.querySelector(
          `#ProductModal-${this.dataset.section} .product-media-modal__content`,
        );
        if (!modalContent) return;
        const newMediaModal = modalContent.querySelector(
          `[data-media-id="${this.currentVariant.featured_media.id}"]`,
        );
        modalContent.prepend(newMediaModal);
      }

      updateURL() {
        if (!this.currentVariant || this.dataset.updateUrl === "false") return;
        window.history.replaceState(
          {},
          "",
          `${this.dataset.url}?variant=${this.currentVariant.id}`,
        );
      }

      updateShareUrl() {
        const shareButton = document.getElementById(
          `Share-${this.dataset.section}`,
        );
        if (!shareButton || !shareButton.updateUrl) return;
        shareButton.updateUrl(
          `${window.shopUrl}${this.dataset.url}?variant=${this.currentVariant.id}`,
        );
      }

      updateVariantInput() {
        const productForms = document.querySelectorAll(
          `#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`,
        );
        productForms.forEach((productForm) => {
          const input = productForm.querySelector('input[name="id"]');
          input.value = this.currentVariant.id;
          input.dispatchEvent(new Event("change", { bubbles: true }));
        });
      }

      updateVariantStatuses() {
        // const selectedOptionOneVariants = this.variantData.filter(
        //   (variant) => this.querySelector(':checked').value === variant.option1
        //   );
        const selectedOptionOneVariants = this.variantData?.filter(
          (variant) => variant.available === true,
        );
        const inputWrappers = [
          ...this.querySelectorAll(".product-form__input"),
        ];
        inputWrappers.forEach((option, index) => {
          if (index === 0 && this.currentVariant?.options.length > 1) return;
          const optionInputs = [
            ...option.querySelectorAll('input[type="radio"], option'),
          ];
          const previousOptionSelected =
            inputWrappers[index - 1]?.querySelector(":checked")?.value;
          const availableOptionInputsValue = selectedOptionOneVariants
            .filter(
              (variant) =>
                variant.available &&
                variant[`option${index}`] === previousOptionSelected,
            )
            .map((variantOption) => variantOption[`option${index + 1}`]);
          this.setInputAvailability(optionInputs, availableOptionInputsValue);
        });
      }

      setInputAvailability(listOfOptions, listOfAvailableOptions) {
        listOfOptions.forEach((input) => {
          if (listOfAvailableOptions.includes(input.getAttribute("value"))) {
            input.classList.remove("disabled");
          } else {
            input.classList.add("disabled");
          }
        });
      }

      updatePickupAvailability() {
        const pickUpAvailability = document.querySelector(
          "pickup-availability",
        );
        if (!pickUpAvailability) return;

        pickUpAvailability.dataset.variantId = this.currentVariant?.id;
        if (this.currentVariant && this.currentVariant.available) {
          pickUpAvailability.fetchAvailability(this.currentVariant.id);
        } else {
          pickUpAvailability.removeAttribute("available");
          pickUpAvailability.innerHTML = "";
        }
      }

      removeErrorMessage() {
        const section = this.closest("section");
        if (!section) return;

        const productForm = section.querySelector("product-form");
        try {
          productForm?.handleErrorMessage();
        } catch (err) {
          console.log(err);
        }
      }

      renderProductInfo() {
        const requestedVariantId = this.currentVariant?.id;
        const sectionId = this.dataset.originalSection
          ? this.dataset.originalSection
          : this.dataset.section;

        fetch(
          `${this.dataset.url}?variant=${requestedVariantId}&section_id=${
            this.dataset.originalSection
              ? this.dataset.originalSection
              : this.dataset.section
          }`,
        )
          .then((response) => response.text())
          .then((responseText) => {
            // prevent unnecessary ui changes from abandoned selections
            if (this.currentVariant?.id !== requestedVariantId) return;

            const html = new DOMParser().parseFromString(
              responseText,
              "text/html",
            );
            const destination = document.getElementById(
              `price-${this.dataset.section}`,
            );
            const source = html.getElementById(
              `price-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`,
            );
            const skuSource = html.getElementById(
              `Sku-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`,
            );
            const skuDestination = document.getElementById(
              `Sku-${this.dataset.section}`,
            );
            const inventorySource = html.getElementById(
              `Inventory-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`,
            );
            const inventoryDestination = document.getElementById(
              `Inventory-${this.dataset.section}`,
            );

            if (source && destination) destination.innerHTML = source.innerHTML;
            if (inventorySource && inventoryDestination)
              inventoryDestination.innerHTML = inventorySource.innerHTML;
            if (skuSource && skuDestination) {
              skuDestination.innerHTML = skuSource.innerHTML;
              skuDestination.classList.toggle(
                "visibility-hidden",
                skuSource.classList.contains("visibility-hidden"),
              );
            }

            const price = document.getElementById(
              `price-${this.dataset.section}`,
            );

            if (price) price.classList.remove("visibility-hidden");

            if (inventoryDestination)
              inventoryDestination.classList.toggle(
                "visibility-hidden",
                inventorySource.innerText === "",
              );

            const addButtonUpdated = html.getElementById(
              `ProductSubmitButton-${sectionId}`,
            );
            this.toggleAddButton(
              addButtonUpdated
                ? addButtonUpdated.hasAttribute("disabled")
                : true,
              window.variantStrings.soldOut,
            );
          });
      }

      toggleAddButton(disable = true, text, modifyClass = true) {
        const productForm = document.getElementById(
          `product-form-${this.dataset.section}`,
        );
        if (!productForm) return;
        const addButton = productForm.querySelector('[name="add"]');
        const addButtonText = productForm.querySelector('[name="add"] > span');
        if (!addButton) return;

        if (disable) {
          addButton.setAttribute("disabled", "disabled");
          if (text) addButtonText.textContent = text;
        } else {
          addButton.removeAttribute("disabled");
          addButtonText.textContent = window.variantStrings.addToCart;
        }

        if (!modifyClass) return;
      }

      setUnavailable() {
        const button = document.getElementById(
          `product-form-${this.dataset.section}`,
        );
        const addButton = button.querySelector('[name="add"]');
        const addButtonText = button.querySelector('[name="add"] > span');
        const price = document.getElementById(`price-${this.dataset.section}`);
        const inventory = document.getElementById(
          `Inventory-${this.dataset.section}`,
        );
        const sku = document.getElementById(`Sku-${this.dataset.section}`);

        if (!addButton) return;
        addButtonText.textContent = window.variantStrings.unavailable;
        if (price) price.classList.add("visibility-hidden");
        if (inventory) inventory.classList.add("visibility-hidden");
        if (sku) sku.classList.add("visibility-hidden");
      }

      getVariantData() {
        this.variantData =
          this.variantData ||
          JSON.parse(
            this.querySelector('[type="application/json"]').textContent,
          );
        return this.variantData;
      }
    },
  );
}
// customElements.define('variant-options', VariantOptions);
