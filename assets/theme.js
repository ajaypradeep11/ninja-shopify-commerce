document.documentElement.classList.remove('no-js');
document.documentElement.classList.add('js');

(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let toastTimer;

  const store = {
    get(key) {
      try { return window.localStorage.getItem(key); } catch (error) { return null; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, value); } catch (error) { /* private mode */ }
    }
  };

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

      const cta = hero.querySelector('[data-hero-cta]');
      let ctas = [];
      try {
        ctas = JSON.parse(hero.querySelector('[data-hero-ctas]')?.textContent || '[]');
      } catch (error) {
        ctas = [];
      }

      const select = (index) => {
        active = (index + slides.length) % slides.length;
        slides.forEach((slide, i) => slide.classList.toggle('is-active', i === active));
        dots.forEach((dot, i) => {
          dot.classList.toggle('is-active', i === active);
          dot.setAttribute('aria-current', i === active ? 'true' : 'false');
        });
        const slideCta = ctas[active];
        if (cta && slideCta && slideCta.label) {
          cta.textContent = slideCta.label;
          cta.setAttribute('href', slideCta.href || cta.getAttribute('href'));
        }
      };

      const start = () => {
        if (reducedMotion.matches) return;
        window.clearInterval(timer);
        timer = window.setInterval(() => select(active + 1), 4000);
      };

      dots.forEach((dot, index) => dot.addEventListener('click', () => {
        select(index);
        start();
      }));
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
      const track = gallery.querySelector('[data-gallery-track]');
      if (!track || track.children.length < 2) return;
      const slides = Array.from(track.children);
      const thumbs = Array.from(gallery.querySelectorAll('[data-gallery-thumb]'));
      const currentIndex = () => Math.round(track.scrollLeft / track.clientWidth);
      const setActive = (index) => {
        thumbs.forEach((button, i) => {
          button.classList.toggle('is-active', i === index);
          button.setAttribute('aria-current', i === index ? 'true' : 'false');
        });
      };
      const goTo = (index) => {
        const target = slides[(index + slides.length) % slides.length];
        track.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });
      };
      thumbs.forEach((thumb, i) => thumb.addEventListener('click', () => goTo(i)));
      gallery.querySelector('[data-gallery-prev]')?.addEventListener('click', () => goTo(currentIndex() - 1));
      gallery.querySelector('[data-gallery-next]')?.addEventListener('click', () => goTo(currentIndex() + 1));
      let scrollTimer;
      track.addEventListener(
        'scroll',
        () => {
          window.clearTimeout(scrollTimer);
          scrollTimer = window.setTimeout(() => setActive(currentIndex()), 80);
        },
        { passive: true }
      );
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

  function initScrollNavs(root = document) {
    root.querySelectorAll('[data-scroll-nav]:not([data-scroll-nav-bound])').forEach((section) => {
      section.dataset.scrollNavBound = 'true';
      const rail = section.querySelector('[data-scroll-rail]');
      if (!rail) return;
      const step = () => Math.max(rail.clientWidth * 0.7, 200);
      section.querySelector('[data-rail-prev]')?.addEventListener('click', () => {
        rail.scrollBy({ left: -step(), behavior: 'smooth' });
      });
      section.querySelector('[data-rail-next]')?.addEventListener('click', () => {
        rail.scrollBy({ left: step(), behavior: 'smooth' });
      });
    });
  }

  function initSortSelects(root = document) {
    root.querySelectorAll('[data-sort-select]:not([data-sort-bound])').forEach((select) => {
      select.dataset.sortBound = 'true';
      select.addEventListener('change', () => {
        const url = new URL(window.location.href);
        url.searchParams.set('sort_by', select.value);
        url.searchParams.delete('page');
        window.location.href = url.toString();
      });
    });
  }

  function initInstallBanner(root = document) {
    const banner = root.querySelector('[data-install-banner]:not([data-install-bound])');
    if (!banner) return;
    banner.dataset.installBound = 'true';

    const installed = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
    if (installed) return;

    if (store.get('localninja.install.dismissed')) return;

    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);
    if (!isIOS && !isAndroid) return;

    const steps = banner.querySelector('[data-install-steps]');
    if (steps) {
      steps.textContent = isIOS
        ? 'Tap Share, then "Add to Home Screen".'
        : 'Tap the browser menu, then "Install app".';
    }

    const cta = banner.querySelector('[data-install-cta]');
    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredPrompt = event;
      if (cta) cta.hidden = false;
      if (steps) steps.textContent = 'One tap to install.';
    });

    cta?.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      banner.hidden = true;
      store.set('localninja.install.dismissed', '1');
    });

    banner.querySelector('[data-install-close]')?.addEventListener('click', () => {
      banner.hidden = true;
      store.set('localninja.install.dismissed', '1');
    });

    window.addEventListener('appinstalled', () => {
      banner.hidden = true;
      store.set('localninja.install.dismissed', '1');
    });

    window.setTimeout(() => { banner.hidden = false; }, 4000);
  }

  function initLocalization(root = document) {
    root
      .querySelectorAll('[data-localization]:not([data-localization-bound])')
      .forEach((wrapper) => {
        wrapper.dataset.localizationBound = 'true';

        const form = wrapper.querySelector('form');
        const input = wrapper.querySelector('[data-localization-input]');
        const button = wrapper.querySelector('[data-localization-button]');
        const list = wrapper.querySelector('[data-localization-list]');
        if (!form || !input || !button || !list) return;

        const close = () => {
          button.setAttribute('aria-expanded', 'false');
          list.hidden = true;
        };

        button.addEventListener('click', () => {
          const isOpen = !list.hidden;
          button.setAttribute('aria-expanded', String(!isOpen));
          list.hidden = isOpen;
        });

        wrapper.querySelectorAll('[data-localization-option]').forEach((option) => {
          option.addEventListener('click', () => {
            input.value = option.value;
            form.submit();
          });
        });

        wrapper.addEventListener('keyup', (event) => {
          if (event.key !== 'Escape') return;
          close();
          button.focus();
        });

        document.addEventListener('click', (event) => {
          if (!wrapper.contains(event.target)) close();
        });
      });
  }

  function initMarketBanner(root = document) {
    const banner = root.querySelector('[data-market-banner]:not([data-market-banner-bound])');
    if (!banner) return;
    banner.dataset.marketBannerBound = 'true';

    if (store.get('localninja.market.dismissed')) return;

    const shopify = window.Shopify || {};
    const rootUrl = shopify.routes?.root || '/';
    const currentCountry = shopify.country;
    if (!currentCountry) return;

    let currencies = {};
    const currencyData = document.querySelector('[data-market-currencies]');
    if (currencyData) {
      try { currencies = JSON.parse(currencyData.textContent); } catch (error) { return; }
    }

    const dismiss = () => {
      banner.hidden = true;
      store.set('localninja.market.dismissed', '1');
    };

    const switchTo = (countryCode) => {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `${rootUrl}localization`;
      form.hidden = true;

      [['_method', 'PUT'], ['country_code', countryCode]].forEach(([name, value]) => {
        const field = document.createElement('input');
        field.type = 'hidden';
        field.name = name;
        field.value = value;
        form.appendChild(field);
      });

      document.body.appendChild(form);
      form.submit();
    };

    const show = (country) => {
      const currency = currencies[country.handle];
      if (!currency) return;

      const title = banner.querySelector('[data-market-banner-title]');
      const text = banner.querySelector('[data-market-banner-text]');
      const accept = banner.querySelector('[data-market-banner-accept]');

      if (title) title.textContent = `Shopping from ${country.name}?`;
      if (text) text.textContent = `See prices in ${currency} and shipping for your address.`;
      if (accept) {
        accept.textContent = `Switch to ${currency}`;
        accept.addEventListener('click', () => switchTo(country.handle));
      }

      banner.querySelector('[data-market-banner-close]')?.addEventListener('click', dismiss);
      banner.hidden = false;
    };

    const query = `country[enabled]=true&country[exclude]=${encodeURIComponent(currentCountry)}`;

    fetch(`${rootUrl}browsing_context_suggestions.json?${query}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const country = data?.suggestions?.[0]?.parts?.country;
        if (!country?.handle || country.handle === currentCountry) return;
        show(country);
      })
      .catch(() => { /* suggestions unavailable - leave the banner hidden */ });
  }

  function init(root = document) {
    initMenus(root);
    initHero(root);
    initRails(root);
    initGalleries(root);
    initQuantities(root);
    initProductForms(root);
    initFilters(root);
    initSortSelects(root);
    initScrollNavs(root);
    initInstallBanner(root);
    initLocalization(root);
    initMarketBanner(root);
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
