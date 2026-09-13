// @muen/dsh-brand-yammaman — host half.
// This is a brand-rendering package: the host intentionally registers nothing
// and does nothing. All rendering is in ./client.js, which fills the DSH brand
// slots with the hardcoded Yammaman logo. Kept as a stable entry so the loader
// can mount the row.
export const name = 'brand-yammaman'
export const inject = []
export function apply() {}
