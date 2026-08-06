# LocalNinja Shopify theme

A native Shopify Online Store 2.0 theme that recreates the LocalNinja storefront with Shopify products, collections, customers, cart, checkout, search and theme-editor sections.

## Local development

1. Install dependencies with `npm install`.
2. Authenticate the Shopify CLI with `npx shopify auth login`.
3. Run `npm run dev -- --store your-store.myshopify.com`.
4. Open the preview URL printed by Shopify CLI.

The development preview is unpublished. To upload an unpublished theme, run:

```sh
npm run push -- --store your-store.myshopify.com
```

## Store setup

- Create or select the `frontpage` collection for the homepage product rail.
- Assign the main navigation to the header and footer menus in the Theme Editor.
- Upload hero images if you want to replace the bundled LocalNinja artwork.
- Set policy links under **Settings → Policies**; Shopify exposes those links in the footer automatically.
- Configure Shopify Payments or a supported payment provider under **Settings → Payments**.

The original custom Stripe Checkout code is intentionally not included. Shopify owns cart checkout, orders, payment status and inventory in this theme.

