# BharathBuild Mobile (Expo SDK 58 · React Native 0.88)

Native iOS + Android app built from the **BharathBuild Mobile App Screens** canvas (17 screens), on the same
Supabase backend as the web app (`site-source-deal`). Fresh project; the data layer is reused from the earlier port.

## Run
```bash
npm install
# copy the real logo + hero photo from the web repo (placeholders ship in assets/images)
powershell -File scripts/copy-web-assets.ps1 "D:\Users\HP\Desktop\bharathbuild-mobile-designs\site-source-deal"
npx expo start            # scan the QR with Expo Go (SDK 58) or press a / i
```
`.env` holds the web app's public Supabase URL + anon key. Never put the service-role key in the app.

**Offline demo** (no backend, sample data, signed in):
`EXPO_PUBLIC_DEMO=1 EXPO_PUBLIC_DEMO_ROLE=vendor npx expo start` (or `customer`). Off unless that variable is set.

## Build an APK
| Route | Steps |
|---|---|
| EAS (cloud) | `npx eas-cli@latest login` → `eas init` → `npm run build:apk` |
| GitHub Actions | push to `main` → Actions → *Build Android APK* → download artifact |
| iOS | `npx eas-cli@latest build -p ios --profile preview` (Apple Developer account) |

## Screens → files
| # | Design screen | Route / file | Data |
|---|---|---|---|
| 01 | Splash | `src/app/index.tsx` | auth state → buyer or vendor home |
| 02 | Login / Sign up | `src/app/login.tsx` | email or phone + password, Google OAuth, sign-up, reset |
| 03 | Home | `src/app/(buyer)/home.tsx` | location / category / keyword → search |
| 04 | Search results | `src/app/(buyer)/search.tsx` | `listings` (active + approved), sort, paging |
| 05 | Filters sheet | `src/app/filters.tsx` (form sheet) | category, city, min rating, experience, verified |
| 06 | Vendor details | `src/app/listing/[id].tsx` | photos, call/email, portfolio, reviews, quote → `leads`, similar |
| 07 | Message vendor | `src/app/chat/[listingId].tsx` | `messages` (thread_id + token), 10 s polling |
| 08 | Account | `src/app/(buyer)/account.tsx` | profile, saved, enquiries, support, logout |
| 09 | Become a Business | `src/app/become-business.tsx` | profile → vendor (pending) + business details |
| 10 | Contact us | `src/app/contact.tsx` | call / mail / maps, mail composer |
| 11 | Vendor dashboard | `src/app/vendor/(tabs)/index.tsx` | stats, latest threads, manage grid |
| 12 | My Ads | `src/app/vendor/(tabs)/ads.tsx` | status tabs, search, edit / pause / delete |
| 13 | Create new ad | `src/app/vendor/ad-editor.tsx` | photos → storage, category specs → `attributes`, draft / publish / preview |
| 14 | Messages inbox | `src/app/vendor/(tabs)/messages.tsx` + `vendor/thread/[id].tsx` | All / Unread / Leads, reply, mark read, lead status |
| 15 | Analytics | `src/app/vendor/(tabs)/analytics.tsx` | KPIs, monthly enquiries, lead status, top ads, CSV export |
| 16 | Reviews | `src/app/vendor/reviews.tsx` | rating summary + distribution, sort |
| 17 | Subscription | `src/app/vendor/subscription.tsx` | `subscriptions` (Free / Premium) |
| – | Extra | `saved`, `notifications`, `about`, `terms`, `account-settings`, `reset-password`, `vendor/portfolio` | |

Design tokens: `src/theme.ts` · UI kit: `src/components/ui.tsx` · Montserrat (headings) + Inter (body), lucide icons.

## Check before release
| Item | Why | Where |
|---|---|---|
| Real logo / hero images | placeholders bundled | `scripts/copy-web-assets.ps1` |
| Support phone / email / address | design placeholders | `src/config.ts` (copy from web `contact.tsx`) |
| Listing photo bucket name | assumed `listing-images` | `src/lib/ads.ts` vs web `ListingImagesField.tsx` |
| Category → sub-category → spec fields | starter set | `src/lib/adFields.ts` vs web `src/lib/ad-fields.ts` |
| RLS for customer writes | app inserts `messages`, `leads`, `reviews` and updates own `profiles` directly (web uses server functions) | Supabase policies; if inserts are refused, add an Edge Function |
| Customer reading vendor replies | needs a policy allowing select by `thread_token`; otherwise the app shows only the customer's own messages | Supabase policies |
| Google sign-in | enable Google provider; add `bharathbuild://auth-callback` to Auth → Redirect URLs | Supabase dashboard |
| Phone + password login | only works if phone auth is enabled | Supabase dashboard |
| Vendor role | Become a Business sets the profile to vendor (pending); an admin still grants the `vendor` role | admin panel |
| Review replies, "Needs reply" filter | `reviews` has no reply column, so they're left out | schema |
| Monthly chart | shows **enquiries** (leads + new threads); there's no per-month views data | `src/lib/analytics.ts` |

## Verified / not verified
- `tsc --noEmit` clean; Metro bundles for Android and iOS; all 17 screens rendered in a 390×844 web build (demo data) and compared with the canvas.
- Not run on a physical device or simulator, and not tested against the live Supabase project (unreachable from the build machine).
