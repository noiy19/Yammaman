# Engine contract

What the storefront needs from the commerce engine (Pratap's OMS + CMS).

This is the storefront's **half** of the contract, written as a specification for
the engine rather than as fetch calls against guessed endpoints. `client.ts`
explains the reasoning: guessing produces code that looks finished and is wrong,
so the storefront is written against an interface, the fixture satisfies it, and
swapping in the real client is one file with no call site touched.

**Who owns what** (PRD §7):

| The engine owns | We own |
|---|---|
| catalogue · orders · payments · invoices · trays · customers · staff login | presentation · content · task-scoped auth · tickets · the AI worker |

So everything below is a **request for the engine**, not a thing we build.

---

## The operations the storefront calls

Already declared in `src/commerce/client.ts` and satisfied by the fixture:

| Operation | Returns | Used by |
|---|---|---|
| `listProducts({ source?, limit? })` | `Product[]` | PLP, the home page's grids |
| `listFabrics()` | `Fabric[]` | the fabric catalogue |
| `getFabric(fabricId)` | `Fabric \| undefined` | the fabric catalogue |

**Needed for PDP and checkout** — not yet declared, because their shapes depend on
answers below:

| Operation | Returns | Used by |
|---|---|---|
| `getProduct(productId)` | `Product \| undefined` | PDP |
| `createCart()` / `getCart(cartId)` | `Cart` | cart |
| `addToCart(cartId, { productId, fabricId, size, quantity })` | `Cart` | PDP |
| `createCheckout(cartId)` | `{ checkoutUrl }` | checkout handoff |

### The shapes we already depend on

```ts
Product  { productId, name, priceLabel, image: Media, availability }
Fabric   { fabricId, name, swatch: Media, availability, previewImage? }
```

Two deliberate choices there:

- **`priceLabel`, not a number.** The engine formats money — currency, rounding
  and the deposit wording are its business, and a storefront that formats prices
  is a storefront that will disagree with the invoice.
- **`image` is the content layer's `Media`**, so an image arrives through the same
  pipeline whether it came from content JSON or from the engine. The engine may
  return a direct URL or a Cloudinary public ID; the storefront does not care
  which.

---

## The four decisions we need from the engine

These are not details — each one changes what we build.

### 1. Where does checkout happen?

**Redirect to a hosted checkout (recommended) or an embedded flow?**

A redirect means we build a cart page and a button, and the engine owns every
screen that touches a card number. An embedded flow means we build the form and
integrate the payment SDK. The first is less code, less PCI surface, and less to
get wrong; the second keeps the customer on our domain throughout.

Either way **card data never reaches our code**, and the storefront never computes
a total.

### 2. How is a made-to-order item priced?

`ProductGrid` and the fixture already show the shape: `"$1,180 · deposit $354"`.
The PRD makes deposit-then-balance the terms of sale (FR-4), so the engine needs
to return both figures, or the rule for computing the deposit. We cannot invent it.

### 3. What identifies a purchasable variant?

A made-to-order garment is **product × fabric × size**. The fixture's `Product` has
no variant list. We need either:

- `getProduct` returning variants with their own availability and price, or
- `getProduct` plus a separate call that lists the valid fabric/size combinations
  for it.

This is the single biggest open question, because it decides whether PDP is one
screen or two, and whether the fabric catalogue links into PDP or stands alone.

### 4. What happens to a cart when something sells out?

FR-2 says an out-of-stock item becomes made-to-order rather than leaving the
catalogue. So a cart can outlive its own availability. Does the engine re-price,
substitute, or reject at checkout? We need to know what to tell the customer, and
when.

---

## Auth and secrets

- **`VITE_*` variables are public.** They are compiled into the browser bundle.
  The live tenant API key is not one of them.
- The real client must talk to a **server-side proxy**; the key never reaches the
  browser. `.env.example` carries the variable names.
- **Staff login is the engine's.** The storefront's Clerk integration is for
  customers, and the two must not be conflated — a customer account and a staff
  account see different things.

---

## What we will do regardless of the answers

Build PLP, PDP and the cart **against the fixture**, which already satisfies the
interface. That is not throwaway work: the fixture and the engine return the same
shapes, so the swap is one file. It is the same argument that let the whole
landing be built before the API rundown landed.

What we will **not** do is write fetch calls against endpoints we have not seen.
