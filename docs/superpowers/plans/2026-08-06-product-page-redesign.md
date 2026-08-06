# Product Page Info Column Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the product page info column with boxed size swatches, a description accordion, a share row, and a Shop Pay installments line — keeping the existing yellow Add to cart and More payment options button styles.

**Architecture:** All changes stay inside the existing section-block system: `sections/main-product.liquid` block markup changes, `templates/product.json` block reorder, a small `assets/theme.js` extension for radio-based variant selection, and additive CSS in `assets/base.css`. No new sections or snippets except three icons in `snippets/icon.liquid`.

**Tech Stack:** Shopify Liquid (Online Store 2.0 theme), vanilla JS, plain CSS. Shopify CLI 4.6.0 available via `npx shopify` / `npm run check` (theme check needs no auth; `shopify theme dev` needs one-time store login).

## Global Constraints

- **`main` deploys to the live site localninja.ca.** Commit locally per task; do NOT `git push` until the final verification task and explicit user go-ahead.
- Spec: `docs/superpowers/specs/2026-08-06-product-page-redesign-design.md`.
- Keep existing button visuals untouched: `.product-form__row .button` (yellow), `{{ form | payment_button }}`, `.shopify-payment-button__more-options`.
- There is no JS/Liquid unit-test infra in this repo. Every task's test cycle is: `npm run check` (Shopify theme-check) must pass with no new offenses, plus the manual checks listed in the task.
- Global CSS sets `svg { fill: none; stroke: currentColor; }` — filled icons need explicit CSS overrides.
- All prices/markup passed through `data-price` attributes must keep the exact existing single-quote-inside-double-quote escaping pattern.

---

### Task 1: Boxed variant swatches

**Files:**
- Modify: `sections/main-product.liquid` (the `variant_picker` block case, ~lines 94–113)
- Modify: `assets/theme.js` (`initProductForms`, lines 141–203)
- Modify: `assets/base.css` (replace dead `.product-option__value` pill rules ~lines 1342–1359; remove `.product-option .filter-sort` rule ~lines 1897–1909; add `.swatch` rules)

**Interfaces:**
- Consumes: existing `syncVariant` contract — elements with `name="id"` carrying `data-available` and `data-price` attributes.
- Produces: radios `input[type="radio"][name="id"]` with `data-available`, `data-price`, `data-variant-title`; a `<span data-option-label>` the JS updates; `.swatch` / `.swatch--soldout` CSS classes. Later tasks rely on none of these except the CSS file location.

- [ ] **Step 1: Replace the `variant_picker` case in `sections/main-product.liquid`**

Replace the whole `{%- when 'variant_picker' -%}` case (currently a `<select class="filter-sort">`) with:

```liquid
              {%- when 'variant_picker' -%}
                {%- if product.has_only_default_variant -%}
                  <input
                    type="hidden"
                    name="id"
                    value="{{ current_variant.id }}"
                    data-available="{{ current_variant.available }}"
                  >
                {%- else -%}
                  <fieldset class="product-option product-option--swatches">
                    <legend class="quantity-label">
                      {{ product.options_with_values.first.name }}:
                      <span data-option-label>{{ current_variant.title }}</span>
                    </legend>
                    <div class="product-option__values">
                      {%- for variant in product.variants -%}
                        <label class="swatch{% unless variant.available %} swatch--soldout{% endunless %}">
                          <input
                            type="radio"
                            name="id"
                            value="{{ variant.id }}"
                            data-available="{{ variant.available }}"
                            data-variant-title="{{ variant.title | escape }}"
                            data-price="<span>{{ variant.price | money }}</span>{% if variant.compare_at_price > variant.price %}<span class='price--compare'>{{ variant.compare_at_price | money }}</span>{% endif %}"
                            {% if variant == current_variant %}
                              checked
                            {% endif %}
                          >
                          <span>{{ variant.title }}</span>
                        </label>
                      {%- endfor -%}
                    </div>
                  </fieldset>
                {%- endif -%}
```

- [ ] **Step 2: Update `initProductForms` in `assets/theme.js`**

Replace lines 144–175 (from `const variantSelect = ...` through `syncVariant();`) with:

```js
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
```

Note: the old `const variantSelect` declaration and `variantSelect?.addEventListener('change', syncVariant);` both go away; the later `syncVariant()` call inside the submit handler's `finally` stays and still works.

- [ ] **Step 3: CSS — remove dead rules, add swatch styles in `assets/base.css`**

Delete these now-unused rules:
- `.product-option__value input { ... }`, `.product-option__value span { ... }`, `.product-option__value input:checked + span { ... }` (~lines 1342–1359 — the old pill styles; keep `.product-option__values`)
- `.product-option .filter-sort { ... }` (~lines 1897–1909 — styled the removed dropdown)

Then add after the `.product-option__values` rule:

```css
.product-option--swatches .product-option__values {
  gap: 10px;
}

.swatch {
  position: relative;
  cursor: pointer;
}

.swatch input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.swatch span {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  min-height: 48px;
  padding: 10px 14px;
  border: 1px solid color-mix(in srgb, var(--ink) 30%, transparent);
  border-radius: 4px;
  background: #fff;
  font-size: 14px;
  font-weight: 500;
}

.swatch input:checked + span {
  border: 2px solid #111;
  padding: 9px 13px;
}

.swatch input:focus-visible + span {
  outline: 2px solid #d4af2c;
  outline-offset: 2px;
}

.swatch--soldout span {
  color: color-mix(in srgb, var(--ink) 40%, transparent);
  background:
    linear-gradient(
      to top right,
      transparent calc(50% - 1px),
      color-mix(in srgb, var(--ink) 35%, transparent) 50%,
      transparent calc(50% + 1px)
    );
}
```

- [ ] **Step 4: Run theme check**

Run: `npm run check`
Expected: completes with no offenses attributable to the changed files (pre-existing offenses elsewhere are acceptable — note them).

- [ ] **Step 5: Commit**

```bash
git add sections/main-product.liquid assets/theme.js assets/base.css
git commit -m "Replace product variant dropdown with boxed swatches"
```

---

### Task 2: Description accordion

**Files:**
- Modify: `sections/main-product.liquid` (the `description` block case, ~lines 90–93)
- Modify: `assets/base.css` (accordion stacking rule)

**Interfaces:**
- Consumes: existing `.product-accordions` styling (`details`/`summary` rows with +/− markers).
- Produces: description rendered as `<details open>` inside `.product-accordions`; CSS collapses borders between adjacent accordion blocks.

- [ ] **Step 1: Replace the `description` case in `sections/main-product.liquid`**

Replace:

```liquid
              {%- when 'description' -%}
                {%- if product.description != blank -%}
                  <div class="rte product-info__description">{{ product.description }}</div>
                {%- endif -%}
```

with:

```liquid
              {%- when 'description' -%}
                {%- if product.description != blank -%}
                  <div class="product-accordions">
                    <details open>
                      <summary>Description</summary>
                      <div class="rte product-accordions__content">{{ product.description }}</div>
                    </details>
                  </div>
                {%- endif -%}
```

- [ ] **Step 2: Add accordion-stacking CSS in `assets/base.css`**

Each block wrapper `<div>` is a direct child of the `.product-form` form element. Two consecutive accordion blocks (Description, then Shipping & returns) would otherwise each carry a 38px top margin and their own top border. Add after the `.product-accordions__content` rule:

```css
.product-form > div:has(> .product-accordions) + div:has(> .product-accordions) .product-accordions {
  margin-top: 0;
  border-top: 0;
}
```

- [ ] **Step 3: Run theme check**

Run: `npm run check`
Expected: no new offenses.

- [ ] **Step 4: Commit**

```bash
git add sections/main-product.liquid assets/base.css
git commit -m "Render product description as an accordion row"
```

---

### Task 3: Share row, installments line, social icons

**Files:**
- Modify: `snippets/icon.liquid` (three new icons)
- Modify: `sections/main-product.liquid` (`buy_buttons` case gains installments; new `share` case; schema gains `share` block type)
- Modify: `assets/base.css` (share row + installments styles)

**Interfaces:**
- Consumes: `{% render 'icon', name: '...' %}` pattern; `form` object inside `{% form 'product' %}`.
- Produces: icon names `facebook`, `x`, `pinterest`; block type `share` (used by Task 4's `templates/product.json`); classes `.share-row`, `.share-row__label`, `.share-row__link`, `.product-installments`.

- [ ] **Step 1: Add icons to `snippets/icon.liquid`**

Insert before `{%- endcase -%}`:

```liquid
  {%- when 'facebook' -%}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.6 1.6-1.6h1.5V4.9c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.4-3.7 3.9V11H8.3v3h2.4v7h2.8Z"/></svg>
  {%- when 'x' -%}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.5 3h3.1l-6.8 7.7L21.8 21h-6.2l-4.9-6.3L5.2 21H2.1l7.2-8.2L2.2 3h6.4l4.4 5.8L17.5 3Zm-1.1 16.1h1.7L6.6 4.8H4.8L16.4 19.1Z"/></svg>
  {%- when 'pinterest' -%}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.5 2 2 6.5 2 12c0 4.2 2.6 7.9 6.3 9.3-.1-.8-.2-2 .1-2.9l1.2-5.1s-.3-.6-.3-1.5c0-1.4.8-2.5 1.9-2.5.9 0 1.3.7 1.3 1.5 0 .9-.6 2.2-.9 3.4-.2 1 .5 1.9 1.5 1.9 1.8 0 3.2-1.9 3.2-4.7 0-2.5-1.8-4.2-4.3-4.2-2.9 0-4.6 2.2-4.6 4.5 0 .9.3 1.8.8 2.3.1.1.1.2.1.3l-.3 1.2c0 .2-.2.2-.4.1-1.2-.6-2-2.4-2-3.9 0-3.2 2.3-6.1 6.7-6.1 3.5 0 6.2 2.5 6.2 5.8 0 3.5-2.2 6.3-5.3 6.3-1 0-2-.5-2.3-1.2l-.6 2.4c-.2.9-.8 2-1.2 2.7.9.3 1.9.4 2.9.4 5.5 0 10-4.5 10-10S17.5 2 12 2Z"/></svg>
```

- [ ] **Step 2: Add installments line to the `buy_buttons` case in `sections/main-product.liquid`**

After the line `{%- if block.settings.show_dynamic_checkout -%}{{ form | payment_button }}{%- endif -%}` add:

```liquid
                <div class="product-installments">{{ form | payment_terms }}</div>
```

- [ ] **Step 3: Add the `share` block case in `sections/main-product.liquid`**

Add a new case before `{%- when 'collapsible_tab' -%}`:

```liquid
              {%- when 'share' -%}
                {%- assign share_url = shop.url | append: product.url -%}
                <div class="share-row">
                  <span class="share-row__label">Share:</span>
                  <a
                    class="share-row__link"
                    href="https://www.facebook.com/sharer/sharer.php?u={{ share_url | url_encode }}"
                    target="_blank"
                    rel="noopener"
                    aria-label="Share on Facebook"
                  >
                    {%- render 'icon', name: 'facebook' -%}
                  </a>
                  <a
                    class="share-row__link"
                    href="https://x.com/intent/post?url={{ share_url | url_encode }}&text={{ product.title | url_encode }}"
                    target="_blank"
                    rel="noopener"
                    aria-label="Share on X"
                  >
                    {%- render 'icon', name: 'x' -%}
                  </a>
                  <a
                    class="share-row__link"
                    href="https://pinterest.com/pin/create/button/?url={{ share_url | url_encode }}&media={{ product.featured_image | image_url: width: 1200 | url_encode }}&description={{ product.title | url_encode }}"
                    target="_blank"
                    rel="noopener"
                    aria-label="Pin on Pinterest"
                  >
                    {%- render 'icon', name: 'pinterest' -%}
                  </a>
                </div>
```

- [ ] **Step 4: Register the `share` block in the section schema**

In the `{% schema %}` blocks array of `sections/main-product.liquid`, after the `buy_buttons` entry add:

```json
    { "type": "share", "name": "Share buttons", "limit": 1 },
```

- [ ] **Step 5: Add share/installments CSS in `assets/base.css`**

Add after the `.shopify-payment-button { margin-top: 10px; }` rule:

```css
.product-installments {
  margin-top: 14px;
  font-size: 13px;
}

.product-installments:empty {
  display: none;
}

.share-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 22px;
}

.share-row__label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.share-row__link {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
}

.share-row__link svg {
  width: 22px;
  height: 22px;
  fill: currentColor;
  stroke: none;
}

.share-row__link:hover {
  color: #d4af2c;
}
```

- [ ] **Step 6: Run theme check**

Run: `npm run check`
Expected: no new offenses (schema must still parse — theme-check validates it).

- [ ] **Step 7: Commit**

```bash
git add snippets/icon.liquid sections/main-product.liquid assets/base.css
git commit -m "Add share row, installments line, and social icons to product page"
```

---

### Task 4: Reorder blocks in the product template

**Files:**
- Modify: `templates/product.json`

**Interfaces:**
- Consumes: block type `share` from Task 3's schema; existing block ids (`vendor`, `title`, `price`, `inventory`, `description`, `quantity`, `variant_picker_6DkAxx`, `buy_buttons`, `shipping`).
- Produces: final on-page order — vendor, title, price, inventory, size swatches, quantity, buy buttons, share, description accordion, shipping accordion.

- [ ] **Step 1: Add the `share` block and reorder `block_order` in `templates/product.json`**

In the `blocks` object add:

```json
"share":{"type":"share","settings":{}}
```

and set:

```json
"block_order":["vendor","title","price","inventory","variant_picker_6DkAxx","quantity","buy_buttons","share","description","shipping"]
```

(The only moves: `variant_picker_6DkAxx` and `quantity` go above `buy_buttons`; `description` drops below `share`; `share` is new.)

- [ ] **Step 2: Validate JSON**

Run: `python3 -m json.tool templates/product.json > /dev/null && echo OK`
Expected: `OK`

- [ ] **Step 3: Run theme check**

Run: `npm run check`
Expected: no new offenses.

- [ ] **Step 4: Commit**

```bash
git add templates/product.json
git commit -m "Reorder product page blocks for redesigned info column"
```

---

### Task 5: Verification and deploy gate

**Files:** none (verification only)

**Interfaces:**
- Consumes: all prior tasks committed locally on `main`, not yet pushed.
- Produces: verified theme; push to `main` (live deploy) only after user confirmation.

- [ ] **Step 1: Full theme check**

Run: `npm run check`
Expected: passes with no offenses in changed files.

- [ ] **Step 2: Live preview via `shopify theme dev` (needs one-time store auth)**

Run: `npm run dev` — if the CLI asks for browser login, ask the user to authenticate (suggest they run `! npm run dev` themselves if interactive login is needed). On the preview URL, verify on a product page:
- Boxed size swatches render; clicking one updates the `Size: X` label, price, and Add to cart state
- A sold-out variant shows greyed/strikethrough but is clickable and flips the button to "Out of stock"
- Yellow Add to cart still adds to cart (toast + cart count)
- Dynamic checkout button + More payment options keep the existing styling
- Installments line appears only if Shop Pay Installments is active
- Share links open the correct share dialogs with the product URL
- Description accordion is open by default; Shipping & returns sits directly beneath it with a single divider line
- Mobile width: swatches wrap, buttons full-width; desktop: info column still sticky

If store auth is impossible in this session, fall back to a line-by-line diff review (`git diff origin/main..HEAD`) and get explicit user acknowledgment that deploy-time verification on localninja.ca replaces the preview.

- [ ] **Step 3: Deploy gate — ask the user**

Confirm with the user before `git push` (push updates the live site). Only push after an explicit yes:

```bash
git push origin main
```

- [ ] **Step 4: Post-deploy check on localninja.ca**

Open a product page on localninja.ca and re-run the Step 2 checklist's key items (swatch selection, add to cart, accordions, share links).
