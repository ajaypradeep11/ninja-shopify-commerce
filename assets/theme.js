document.documentElement.classList.remove('no-js');
document.documentElement.classList.add('js');

(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let toastTimer;

  function showToast(message, isError = false) {
    const toast = document.querySelector('[data-toast]');
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.toggle('is-error', isError);
    toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3200);
  }

  function initMenus(root = document) {
    root.querySelectorAll('[data-header]:not([data-menu-bound])').forEach((header) => {
      header.dataset.menuBound = 'true';
      const openButton = header.querySelector('[data-menu-open]');
      const drawer = header.querySelector('[data-menu-drawer]');
      const closeButtons = header.querySelectorAll('[data-menu-close]');
      if (!openButton || !drawer) return;

      const open = () => {
        drawer.hidden = false;
        openButton.setAttribute('aria-expanded', 'true');
        document.body.classList.add('menu-open');
        drawer.querySelector('.menu-drawer__panel a, .menu-drawer__panel button, .menu-drawer__panel input')?.focus();
      };

      const close = () => {
        drawer.hidden = true;
        openButton.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
        openButton.focus();
      };

      openButton.addEventListener('click', open);
      closeButtons.forEach((button) => button.addEventListener('click', close));
      header.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !drawer.hidden) close();
      });
    });
  }

  function initHero(root = document) {
    root.querySelectorAll('[data-hero]:not([data-hero-bound])').forEach((hero) => {
      hero.dataset.heroBound = 'true';
      const slides = [...hero.querySelectorAll('.hero__slide')];
      const dots = [...hero.querySelectorAll('[data-hero-dot]')];
      if (slides.length < 2) return;
      let active = Math.max(0, slides.findIndex((slide) => slide.classList.contains('is-active')));
      let timer;

      const select = (index) => {
        active = (index + slides.length) % slides.length;
        slides.forEach((slide, i) => slide.classList.toggle('is-active', i === active));
        dots.forEach((dot, i) => {
          dot.classList.toggle('is-active', i === active);
          dot.setAttribute('aria-current', i === active ? 'true' : 'false');
        });
      };

      const start = () => {
        if (reducedMotion.matches) return;
        window.clearInterval(timer);
        timer = window.setInterval(() => select(active + 1), 5000);
      };

      dots.forEach((dot, index) => dot.addEventListener('click', () => {
        select(index);
        start();
      }));
      hero.addEventListener('mouseenter', () => window.clearInterval(timer));
      hero.addEventListener('mouseleave', start);
      start();
    });
  }

  function initRails(root = document) {
    root.querySelectorAll('[data-product-rail]:not([data-rail-bound])').forEach((rail) => {
      rail.dataset.railBound = 'true';
      if (reducedMotion.matches || rail.children.length < 2) return;
      window.setInterval(() => {
        const card = rail.firstElementChild;
        if (!card) return;
        const gap = parseFloat(getComputedStyle(rail).columnGap || '0');
        const step = card.getBoundingClientRect().width + gap;
        const atEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4;
        rail.scrollTo({ left: atEnd ? 0 : rail.scrollLeft + step, behavior: 'smooth' });
      }, 5000);
    });
  }

  function initGalleries(root = document) {
    root.querySelectorAll('[data-gallery]:not([data-gallery-bound])').forEach((gallery) => {
      gallery.dataset.galleryBound = 'true';
      const main = gallery.querySelector('.product-gallery__main img');
      if (!main) return;
      gallery.querySelectorAll('[data-gallery-thumb]').forEach((thumb) => {
        thumb.addEventListener('click', () => {
          main.src = thumb.dataset.src;
          main.srcset = thumb.dataset.srcset || '';
          main.alt = thumb.dataset.alt || '';
          gallery.querySelectorAll('[data-gallery-thumb]').forEach((button) => {
            button.classList.toggle('is-active', button === thumb);
            button.setAttribute('aria-current', button === thumb ? 'true' : 'false');
          });
        });
      });
    });
  }

  function initQuantities(root = document) {
    root.querySelectorAll('[data-quantity]:not([data-quantity-bound])').forEach((quantity) => {
      quantity.dataset.quantityBound = 'true';
      const input = quantity.querySelector('input[type="number"]');
      if (!input) return;
      quantity.querySelector('[data-quantity-minus]')?.addEventListener('click', () => {
        input.stepDown();
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      quantity.querySelector('[data-quantity-plus]')?.addEventListener('click', () => {
        input.stepUp();
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  }

  function updateCartCount(count) {
    document.querySelectorAll('[data-cart-count]').forEach((badge) => {
      badge.textContent = count;
      badge.hidden = count === 0;
      const link = badge.closest('a');
      if (link) link.setAttribute('aria-label', `Cart, ${count} items`);
    });
  }

  function initProductForms(root = document) {
    root.querySelectorAll('[data-product-form]:not([data-product-form-bound])').forEach((form) => {
      form.dataset.productFormBound = 'true';
      const submitButton = form.querySelector('[type="submit"]');
      const submitText = form.querySelector('[data-submit-text]');
      const optionLabel = form.querySelector('[data-option-label]');

      const selectedVariant = () => {
        const select = form.querySelector('select[name="id"]');
        if (select) return select.selectedOptions?.[0];
        const radios = form.querySelectorAll('input[type="radio"][name="id"]');
        if (radios.length) {
          return form.querySelector('input[type="radio"][name="id"]:checked') || radios[0];
        }
        return form.querySelector('[name="id"]');
      };

      const syncVariant = () => {
        const option = selectedVariant();
        if (!option || !submitButton) return;

        const available = option.dataset.available === 'true';
        submitButton.disabled = !available;

        if (submitText) {
          submitText.textContent = available
            ? submitText.dataset.availableText
            : submitText.dataset.soldText;
        }

        if (optionLabel && option.dataset.variantTitle) {
          optionLabel.textContent = option.dataset.variantTitle;
        }

        const price = document.querySelector('[data-product-price]');
        if (price && option.dataset.price) {
          price.innerHTML = option.dataset.price;
        }
      };

      form.addEventListener('change', (event) => {
        if (event.target.name === 'id') syncVariant();
      });
      syncVariant();

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!submitButton || submitButton.disabled) return;
        submitButton.disabled = true;
        form.setAttribute('aria-busy', 'true');

        try {
          const response = await fetch(`${window.Shopify?.routes?.root || '/'}cart/add.js`, {
            method: 'POST',
            headers: { Accept: 'application/json' },
            body: new FormData(form)
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.description || 'Unable to add this item.');
          const cartResponse = await fetch(`${window.Shopify?.routes?.root || '/'}cart.js`, { headers: { Accept: 'application/json' } });
          const cart = await cartResponse.json();
          updateCartCount(cart.item_count || 0);
          showToast('Added to cart');
        } catch (error) {
          showToast(error.message || 'Unable to add this item.', true);
        } finally {
          form.removeAttribute('aria-busy');
          syncVariant();
        }
      });
    });
  }

  function initFilters(root = document) {
    root.querySelectorAll('[data-filter-root]:not([data-filter-bound])').forEach((filterRoot) => {
      filterRoot.dataset.filterBound = 'true';
      const drawer = filterRoot.querySelector('[data-filter-drawer]');
      const openButton = filterRoot.querySelector('[data-filter-open]');
      const closeButtons = filterRoot.querySelectorAll('[data-filter-close]');
      if (!drawer || !openButton) return;

      const open = () => {
        drawer.hidden = false;
        openButton.setAttribute('aria-expanded', 'true');
        document.body.classList.add('drawer-open');
        drawer.querySelector('button, input, select')?.focus();
      };
      const close = () => {
        drawer.hidden = true;
        openButton.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('drawer-open');
        openButton.focus();
      };

      openButton.addEventListener('click', open);
      closeButtons.forEach((button) => button.addEventListener('click', close));
      filterRoot.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !drawer.hidden) close();
      });
    });
  }

  function init(root = document) {
    initMenus(root);
    initHero(root);
    initRails(root);
    initGalleries(root);
    initQuantities(root);
    initProductForms(root);
    initFilters(root);
  }

  document.addEventListener('DOMContentLoaded', () => init());
  document.addEventListener('shopify:section:load', (event) => init(event.target));
  function renamePaymentButton() {
    document
      .querySelectorAll('.shopify-payment-button__more-options')
      .forEach((button) => {
        if (button.textContent.trim() !== 'Checkout') {
          button.textContent = 'Checkout';
          button.setAttribute('aria-label', 'Checkout');
        }
      });
  }

  renamePaymentButton();

  new MutationObserver(renamePaymentButton).observe(document.body, {
    childList: true,
    subtree: true
  });
})();
