# kit-names — change notes

**Module:** `lib/kit-names/kit-names.js`
**Vendored from:** coinless-kit `main` @ VERSION `0.1.0`
**Current version:** `0.1.0` — unmodified

## Contract summary

⛔ The **only** display-name validator in this repo. Never write a second
`cleanName`/`sanitize` anywhere — that drift is exactly what this module was
created to end. Exports `validateName`, `NAME_CHANGE_NOTICE`, `MAX_NAME_LENGTH`.

⛔ The charset check runs **before** `.toUpperCase()`. Reversing that order is a
known bug (`ß` → `SS` passing when it must be rejected).

## Changes

*None. Vendored unmodified.*
