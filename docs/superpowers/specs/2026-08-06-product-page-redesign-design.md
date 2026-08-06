# Product page info column redesign

**Date:** 2026-08-06
**Repo:** `ecommerce-shopify-repo` (LocalNinja Shopify theme — `main` deploys to live localninja.ca)

## Goal

Restyle the product page's right-hand info column to follow the reference layout (boxed size
swatches, quantity stepper, full-width buttons, accordion rows below the buttons) while keeping
LocalNinja's existing button styling: the yellow Add to cart, the dynamic checkout button, and the
white/black "More payment options" link.

## Layout order (top → bottom)

1. Vendor eyebrow (kept)
2. Title
3. Price + tax line
4. Stock line ("In stock" dot, kept)
5. Size selector — boxed swatches (new)
6. Quantity stepper (existing style)
7. Add to cart — existing yellow button, unchanged
8. Dynamic checkout button + More payment options — existing styles, unchanged
9. Shop Pay installments line (new)
10. Share row (new)
11. Accordions: **Description** (new, open by default) then **Shipping & returns** (existing)

## Components

### Size selector (replaces `<select>` dropdown)

- One swatch per **variant** (matches current behavior; works for any option count).
- Markup: visually-hidden radio `name="id"` + styled `<span>` box per variant. Radios carry the
  same `data-available` / `data-price` attributes the select's options carry today.
- Label reads `Size: M` — the product's real first option name plus the selected variant title,
  updated live on selection (`data-option-label` span).
- Box style: square-ish (min-width ~56px, centered text), 1px `#111`-mix border, radius consistent
  with theme; selected state = 2px solid dark border (border-color + inset box-shadow like the
  existing pill pattern, but rectangular).
- **Sold-out variants: greyed with a diagonal strikethrough (CSS `linear-gradient` overlay), still
  selectable.** Selecting one flips the Add to cart button to "Out of stock" via existing JS.

### Buy buttons (unchanged visuals)

- Same `.product-form__row .button` yellow Add to cart.
- Same `{{ form | payment_button }}` dynamic checkout + `.shopify-payment-button__more-options`
  styling.

### Installments line (new)

- `{{ form | payment_terms }}` rendered inside the product form, below the buttons.
- Shopify renders the "Pay in 4…" banner only when Shop Pay Installments is active on the store;
  otherwise it outputs nothing. No custom logic.

### Share row (new)

- New `share` block: `Share:` label + three icon links (Facebook, X, Pinterest) using plain share
  URLs (`facebook.com/sharer`, `x.com/intent/post`, `pinterest.com/pin/create/button`) with the
  canonical product URL. `target="_blank" rel="noopener"`. No third-party scripts.
- New `facebook` / `x` / `pinterest` icons added to `snippets/icon.liquid`.

### Description accordion (moved)

- The `description` block moves below the buy buttons and renders as a `<details open>` row with
  summary "Description", using the existing `.product-accordions` styling, followed by the
  existing "Shipping & returns" collapsible tab.

## File changes

| File | Change |
|---|---|
| `sections/main-product.liquid` | `variant_picker` block → radio swatches; `description` block → accordion markup; `buy_buttons` block gains `payment_terms`; new `share` block type in markup + schema |
| `templates/product.json` | Reorder blocks: vendor, title, price, inventory, variant_picker, quantity, buy_buttons, share, description, shipping; add `share` block |
| `assets/theme.js` | `syncVariant` reads `[name="id"]:checked` radio (fallback to select); updates the `Size: X` label text |
| `assets/base.css` | Boxed swatch styles (default / selected / sold-out strikethrough), share row, installments line spacing, description-accordion spacing |
| `snippets/icon.liquid` | Add `facebook`, `x`, `pinterest` icons |

## Error handling / edge cases

- Product with a single variant ("Default Title"): Shopify convention — hide the selector entirely
  (render a hidden input with the variant id instead).
- Product whose variants combine multiple options: swatch text is `variant.title`
  (e.g. "M / Black"), label uses the first option's name — same information as today's dropdown.
- Store without Shop Pay Installments: `payment_terms` renders nothing; layout unaffected.
- JS disabled: radios + form still submit natively (name="id" checked radio posts correctly).

## Testing / verification

- `main` is live production. Before committing theme files: preview with `shopify theme dev` if
  the Shopify CLI is authenticated; otherwise careful static review of Liquid/CSS/JS plus a
  post-deploy check of localninja.ca product pages (swatch selection, sold-out state, add to cart,
  dynamic checkout, accordions, share links).
- Verify mobile (swatches wrap; buttons full-width) and desktop sticky column.
