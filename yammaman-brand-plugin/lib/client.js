// @muen/dsh-brand-yammaman — browser half.
// Hardcoded Yammaman brand: fills the DSH brand slots with the Yammaman logo
// (theme-switched; light theme = ink #140000, dark theme = white).
//
// The logo is the full YAMMAMAN lockup (8 interlocking glyphs), NOT a monogram.
// It is used in all three seats: the glyphs overlap horizontally, so a clean
// rectangular crop to a standalone mark is not safe without the design source.
//
// Generated from src/yammaman-logo-{light,dark}.svg — do not hand-edit the
// base64 blobs; regenerate from the SVGs instead.
//   light sha256:e6cc03d46eb38dc8
//   dark  sha256:0932aa164593e2bc
window.__ModuleLoader__.load({
  id: "@muen/dsh-brand-yammaman",
  factory: (require) => {
    const React = require("react");
    const h = React.createElement;

    // Hardcoded Yammaman brand assets.
    const LOGO_LIGHT = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iX+ODrOOCpOODpOODvF8yIiBkYXRhLW5hbWU9IuODrOOCpOODpOODvCAyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNzQ1LjI0IDEyOTYiPgogIDxkZWZzPgogICAgPHN0eWxlPgogICAgICAuY2xzLTEgewogICAgICAgIGZpbGw6ICMxNDAwMDA7CiAgICAgIH0KICAgIDwvc3R5bGU+CiAgPC9kZWZzPgogIDxwb2x5Z29uIGZpbGw9IiMxNDAwMDAiIHBvaW50cz0iNzguMTYgMzM0Ljc5IDIwMC4xNiA1MTkuNjcgMjAzLjc5IDc0OS41OSAyNTMuMDUgNzE5LjM2IDI1MC45NSA1MjUuNjQgNDY4LjM1IDIyMy4xMyA0NTYuMzkgMTUzLjc4IDIyNi45NiA0NjkuMjMgMTA5LjU3IDI5MC4zNyA3OC4xNiAzMzQuNzkiLz4KICA8Zz4KICAgIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTQyNS44LDQ0NC41N2wtMTEzLjUxLDM0MS4wMiw0MS4wNCwyOS43Niw0NC4xNi0xMjkuMzUsMTAzLjQ0LTQuOCwzNS43NiwxMTEuMzYsMzUuMDQtNTQtODcuODQtMjY5LjUxLTU4LjA4LTI0LjQ4Wk00MTUuNjYsNjM0LjY1czM0LjgzLTEwNS42MSwzNC44My0xMDUuNjFjLjI4LDEuMDYsMzMuNDMsMTAxLjU0LDMzLjE0LDEwMi42LS4xNC4zMy02Ny45OSwyLjkyLTY3Ljk3LDMuMDFaIi8+CiAgICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMTIzLjg3LDUzMy42M2w4Ni4yNiwyOC43NSw0MC41NSwxMzkuMzUsMzcuNi00OC42Ni04MS4wNC0yODYuMDQtNjYuMzMtMzQuNDEtMTAwLjc0LDI4OS40NSwyNy42Nyw2Ny40OSw1Ni4wMy0xNTUuOTRaTTExNjcuMjgsNDEwLjM4bDI2LjI4LDkzLjUzLTUyLjk0LTE3Ljg0LDI2LjY3LTc1LjY5WiIvPgogICAgPHBvbHlnb24gY2xhc3M9ImNscy0xIiBwb2ludHM9Ijc1My4yMyA0OTYuMDggODE2LjcxIDMzNi40NCA4NDIuMzYgNTk3LjIgODg4LjUgNTQzLjU3IDg2MC4wNSAyNTUuNDUgODAyLjg3IDIzNy42MiA3MTYuMjEgNDQ2LjU4IDYxNC41OSAyNzUuNzggNTYwLjYyIDI5OC4yMyA1NDQuOSA1NTguNjMgNTkxLjQ0IDYxOC43MyA2MDcuNzcgMzY1LjEgNjk0LjM3IDUwOC4wOSA3NTMuMjMgNDk2LjA4Ii8+CiAgICA8cG9seWdvbiBjbGFzcz0iY2xzLTEiIHBvaW50cz0iMTY4MC4xMSA1MDguNTkgMTYzMS44MyA4MTAuOTYgMTUyMC44OCA2MDcuMjUgMTQ3NS40NSA2MzYuMDcgMTQ1Mi4wMSA4NjMuNjkgMTQ5Ni45NCA5MDQuMjMgMTUxNi45IDcwMy4zOCAxNjIzLjYgODk4LjQ3IDE2NzUuNzIgODU4LjggMTcxOC4yMSA1NzkuNDEgMTY4MC4xMSA1MDguNTkiLz4KICAgIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTEzMTcuMTQsNjcwLjc5bC0xMjIuNTEsMjQ0LjI3LDMzLjI0LDQyLjIxLDM4LjQ3LTczLjU4LDExNS4wNCwxNi4wNiw0NC4wNywxNTYuODcsNDMuNy0yOC43Ni05MC43Ni0zMjAuNDYtNjEuMjUtMzYuNlpNMTI4OS45Myw4MzUuNjNsNDcuMTQtOTIuNDcsMjguNjcsMTAyLjktNzUuODEtMTAuNDNaIi8+CiAgICA8cG9seWdvbiBjbGFzcz0iY2xzLTEiIHBvaW50cz0iOTQ3LjMgNjAxLjk2IDk4OC4xNyA4MzcuMyAxMDMwLjI5IDc5Mi4zNiA5OTEuMzYgNTY1Ljg3IDkzMC40OSA1MTcuMzggODQzLjI2IDcwOS4zNyA3NzUuNjYgNTQxLjk4IDcxNy42MiA1ODQuOTggNjc1Ljg3IDg4Ni44NSA3MjAuMSA5MjQuMzYgNzYwLjQ1IDY0MC4xOCA4MTEuNzYgNzcwLjc3IDg3MS4yMSA3NjcuNTkgOTQ3LjMgNjAxLjk2Ii8+CiAgICA8cG9seWdvbiBjbGFzcz0iY2xzLTEiIHBvaW50cz0iMTA4OS4zNCA3NTEuMTYgOTg1LjcgOTQyLjU4IDkxOC4wNCA3ODkuMTEgODY3LjU5IDgxMC44OSA4MzEuNDYgMTA3MC4xOSA4NzcuNjUgMTEwMS44NiA5MDcuMDkgODkxLjM2IDk1My42NiA5OTcuNTQgMTAyMC4zNCA5ODUuMjUgMTEwMy44IDgyOS4xNSAxMTM4LjE4IDExMjIuMTMgMTE4Mi43NCAxMDcxLjYzIDExNDcuNzUgNzgwLjg2IDEwODkuMzQgNzUxLjE2Ii8+CiAgPC9nPgo8L3N2Zz4=';
    const LOGO_DARK = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iX+ODrOOCpOODpOODvF8yIiBkYXRhLW5hbWU9IuODrOOCpOODpOODvCAyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNzQ1LjI0IDEyOTYiPgogIDxkZWZzPgogICAgPHN0eWxlPgogICAgICAuY2xzLTEgewogICAgICAgIGZpbGw6ICNGRkZGRkY7CiAgICAgIH0KICAgIDwvc3R5bGU+CiAgPC9kZWZzPgogIDxwb2x5Z29uIGZpbGw9IiNGRkZGRkYiIHBvaW50cz0iNzguMTYgMzM0Ljc5IDIwMC4xNiA1MTkuNjcgMjAzLjc5IDc0OS41OSAyNTMuMDUgNzE5LjM2IDI1MC45NSA1MjUuNjQgNDY4LjM1IDIyMy4xMyA0NTYuMzkgMTUzLjc4IDIyNi45NiA0NjkuMjMgMTA5LjU3IDI5MC4zNyA3OC4xNiAzMzQuNzkiLz4KICA8Zz4KICAgIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTQyNS44LDQ0NC41N2wtMTEzLjUxLDM0MS4wMiw0MS4wNCwyOS43Niw0NC4xNi0xMjkuMzUsMTAzLjQ0LTQuOCwzNS43NiwxMTEuMzYsMzUuMDQtNTQtODcuODQtMjY5LjUxLTU4LjA4LTI0LjQ4Wk00MTUuNjYsNjM0LjY1czM0LjgzLTEwNS42MSwzNC44My0xMDUuNjFjLjI4LDEuMDYsMzMuNDMsMTAxLjU0LDMzLjE0LDEwMi42LS4xNC4zMy02Ny45OSwyLjkyLTY3Ljk3LDMuMDFaIi8+CiAgICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMTIzLjg3LDUzMy42M2w4Ni4yNiwyOC43NSw0MC41NSwxMzkuMzUsMzcuNi00OC42Ni04MS4wNC0yODYuMDQtNjYuMzMtMzQuNDEtMTAwLjc0LDI4OS40NSwyNy42Nyw2Ny40OSw1Ni4wMy0xNTUuOTRaTTExNjcuMjgsNDEwLjM4bDI2LjI4LDkzLjUzLTUyLjk0LTE3Ljg0LDI2LjY3LTc1LjY5WiIvPgogICAgPHBvbHlnb24gY2xhc3M9ImNscy0xIiBwb2ludHM9Ijc1My4yMyA0OTYuMDggODE2LjcxIDMzNi40NCA4NDIuMzYgNTk3LjIgODg4LjUgNTQzLjU3IDg2MC4wNSAyNTUuNDUgODAyLjg3IDIzNy42MiA3MTYuMjEgNDQ2LjU4IDYxNC41OSAyNzUuNzggNTYwLjYyIDI5OC4yMyA1NDQuOSA1NTguNjMgNTkxLjQ0IDYxOC43MyA2MDcuNzcgMzY1LjEgNjk0LjM3IDUwOC4wOSA3NTMuMjMgNDk2LjA4Ii8+CiAgICA8cG9seWdvbiBjbGFzcz0iY2xzLTEiIHBvaW50cz0iMTY4MC4xMSA1MDguNTkgMTYzMS44MyA4MTAuOTYgMTUyMC44OCA2MDcuMjUgMTQ3NS40NSA2MzYuMDcgMTQ1Mi4wMSA4NjMuNjkgMTQ5Ni45NCA5MDQuMjMgMTUxNi45IDcwMy4zOCAxNjIzLjYgODk4LjQ3IDE2NzUuNzIgODU4LjggMTcxOC4yMSA1NzkuNDEgMTY4MC4xMSA1MDguNTkiLz4KICAgIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTEzMTcuMTQsNjcwLjc5bC0xMjIuNTEsMjQ0LjI3LDMzLjI0LDQyLjIxLDM4LjQ3LTczLjU4LDExNS4wNCwxNi4wNiw0NC4wNywxNTYuODcsNDMuNy0yOC43Ni05MC43Ni0zMjAuNDYtNjEuMjUtMzYuNlpNMTI4OS45Myw4MzUuNjNsNDcuMTQtOTIuNDcsMjguNjcsMTAyLjktNzUuODEtMTAuNDNaIi8+CiAgICA8cG9seWdvbiBjbGFzcz0iY2xzLTEiIHBvaW50cz0iOTQ3LjMgNjAxLjk2IDk4OC4xNyA4MzcuMyAxMDMwLjI5IDc5Mi4zNiA5OTEuMzYgNTY1Ljg3IDkzMC40OSA1MTcuMzggODQzLjI2IDcwOS4zNyA3NzUuNjYgNTQxLjk4IDcxNy42MiA1ODQuOTggNjc1Ljg3IDg4Ni44NSA3MjAuMSA5MjQuMzYgNzYwLjQ1IDY0MC4xOCA4MTEuNzYgNzcwLjc3IDg3MS4yMSA3NjcuNTkgOTQ3LjMgNjAxLjk2Ii8+CiAgICA8cG9seWdvbiBjbGFzcz0iY2xzLTEiIHBvaW50cz0iMTA4OS4zNCA3NTEuMTYgOTg1LjcgOTQyLjU4IDkxOC4wNCA3ODkuMTEgODY3LjU5IDgxMC44OSA4MzEuNDYgMTA3MC4xOSA4NzcuNjUgMTEwMS44NiA5MDcuMDkgODkxLjM2IDk1My42NiA5OTcuNTQgMTAyMC4zNCA5ODUuMjUgMTEwMy44IDgyOS4xNSAxMTM4LjE4IDExMjIuMTMgMTE4Mi43NCAxMDcxLjYzIDExNDcuNzUgNzgwLjg2IDEwODkuMzQgNzUxLjE2Ii8+CiAgPC9nPgo8L3N2Zz4=';

    const CSS = [
      '.ya-logo{max-height:26px;width:auto;max-width:100%;object-fit:contain;vertical-align:middle;flex:none}',
      '.ya-logo--dark{display:none}',
      'body[data-ds-dark-theme] .ya-logo--light{display:none}',
      'body[data-ds-dark-theme] .ya-logo--dark{display:inline-block}',
      '.ya-mark,.ya-hero{display:inline-block;vertical-align:middle;object-fit:contain}',
      '.ya-mark--dark,.ya-hero--dark{display:none}',
      'body[data-ds-dark-theme] .ya-mark--light,body[data-ds-dark-theme] .ya-hero--light{display:none}',
      'body[data-ds-dark-theme] .ya-mark--dark,body[data-ds-dark-theme] .ya-hero--dark{display:inline-block}',
    ].join("\n");

    function injectCss() {
      if (typeof document === "undefined") return;
      if (document.querySelector("style[data-plugin-css=\"@muen/dsh-brand-yammaman\"]")) return;
      const tag = document.createElement("style");
      tag.dataset.pluginCss = "@muen/dsh-brand-yammaman";
      tag.textContent = CSS;
      document.head.appendChild(tag);
    }

    // Wordmark lockup (name seat): the Yammaman logo, theme-switched.
    const BrandName = () =>
      h("span", { "data-ls-skip": "", style: { display: "inline-flex", alignItems: "center", maxWidth: "100%", minWidth: 0, overflow: "hidden" } },
        h("img", { key: "light", className: "ya-logo ya-logo--light", src: LOGO_LIGHT, alt: "Yammaman", draggable: false }),
        h("img", { key: "dark", className: "ya-logo ya-logo--dark", src: LOGO_DARK, alt: "Yammaman", draggable: false }));

    // Compact mark (mark seat): same lockup, contained in a square box.
    const BrandMark = ({ size }) =>
      h("span", { "data-ls-skip": "", style: { display: "inline-flex", flex: "none" } },
        h("img", { key: "light", className: "ya-mark ya-mark--light", src: LOGO_LIGHT, style: { width: size || 24, height: size || 24 }, alt: "", draggable: false }),
        h("img", { key: "dark", className: "ya-mark ya-mark--dark", src: LOGO_DARK, style: { width: size || 24, height: size || 24 }, alt: "", draggable: false }));
    const HeroMark = () =>
      h("span", { "data-ls-skip": "", style: { display: "inline-flex", flex: "none" } },
        h("img", { key: "light", className: "ya-hero ya-hero--light", src: LOGO_LIGHT, style: { width: 34, height: 34 }, alt: "", draggable: false }),
        h("img", { key: "dark", className: "ya-hero ya-hero--dark", src: LOGO_DARK, style: { width: 34, height: 34 }, alt: "", draggable: false }));

    function apply(ctx) {
      injectCss();
      ctx.slots.inject("sidebar.brand.mark", () =>
        ctx.slots.inject("sidebar.brand.name", () =>
          ctx.slots.inject("conversation.hero.brand.mark", function* () {
            yield ctx.slots.register({ name: "sidebar.brand.mark" }, BrandMark);
            yield ctx.slots.register({ name: "sidebar.brand.name" }, BrandName);
            yield ctx.slots.register({ name: "conversation.hero.brand.mark" }, HeroMark);
          })));
    }

    return { inject: ["slots"], apply };
  }
});
