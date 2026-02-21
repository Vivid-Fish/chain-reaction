# Chain Reaction: Web-to-App-Store Gap Analysis and Action Plan

## Executive Summary

Shipping a vanilla JS canvas game to iOS App Store and Google Play Store in 2026 is entirely feasible, but the two platforms have fundamentally different levels of friction. **Google Play is straightforward via TWA/Bubblewrap** (could be done in an evening). **iOS App Store requires Capacitor**, a native wrapper, Xcode, a Mac, and careful navigation of Apple's review guidelines. The game's architecture (single HTML file, canvas-based, Web Audio, no build system) is well-suited to this path, but several gaps need to be closed.

---

## 1. Current State of PWA Support

### Android
- PWAs are well-supported on Android via Chrome
- Google Play accepts PWAs wrapped as Trusted Web Activities (TWAs) — officially supported path
- Service worker + web manifest + HTTPS are required
- Full-screen experience (no browser chrome) via Digital Asset Links verification

### iOS
- Safari supports PWAs installed to home screen, but with significant limitations
- Push notifications work for home-screen PWAs (added in iOS 16.4)
- **Safari can evict cached PWA data after 7 days of inactivity**
- Apple does **not** allow direct PWA submission to the App Store
- A native binary wrapper (Capacitor or similar) is required for App Store distribution

### Can PWAs be submitted directly to app stores?
- **Google Play: Yes**, via TWA/Bubblewrap
- **Apple App Store: No.** You must wrap in a native binary

---

## 2. Wrapper Options Comparison

| Tool | Android | iOS | Complexity | Build System Needed | Recommendation |
|------|---------|-----|------------|---------------------|----------------|
| **TWA/Bubblewrap** | Native support, best path | Not supported | Low | No (CLI tool) | **Best for Android** |
| **PWABuilder** | Generates TWA | Generates Xcode project (risky for review) | Low | No (web tool) | Good for Android, risky for iOS |
| **Capacitor** | Full support | Full support via WKWebView | Medium | Needs npm + Xcode (iOS) / Android Studio | **Best for iOS, also works for Android** |
| **Cordova** | Legacy support | Legacy support | Medium-High | Yes | Deprecated, avoid |
| **MobiLoud/Median** | Full support | Full support | Low (paid service) | No | Expensive, unnecessary |

### Recommendation

**Two-track approach:**
1. **Android: Bubblewrap/TWA** — simplest possible path, 1-2 hours, no native code
2. **iOS: Capacitor** — lightest native wrapper that passes Apple review, works with vanilla JS

Capacitor works with vanilla JavaScript without any framework. It explicitly supports this via its `webDir` configuration, pointing to your existing web files.

---

## 3. iOS App Store Requirements

### Developer Account
- **Cost:** $99/year (Apple Developer Program, individual enrollment)
- **Enrollment:** Requires Apple ID, identity verification (may require government ID)
- **Hardware:** Requires a Mac running Xcode (no way around this)
- **Timeline:** Account approval typically takes 24-48 hours

### App Assets Required
- **App icon:** Single 1024x1024 px PNG (no alpha/transparency). System auto-generates smaller sizes.
- **Screenshots:** Required for each device class:
  - iPhone 6.7" (1290x2796 or 2796x1290)
  - iPhone 6.5" (1242x2688 or 2688x1242)
  - iPad Pro 12.9" (2048x2732) — if supporting iPad
- **Privacy policy URL:** Required even if you collect zero data
- **App description, keywords, category**
- **Support URL:** Can be a GitHub repo page

### Review Guidelines — Critical for This Game

**Guideline 4.2 (Minimum Functionality):** Apple rejects "web clippings" — apps that are just a URL loaded in a WebView. This is the primary risk.

However, **Capacitor bundles web assets into the binary** (copied into the .app bundle during build):
- Game code ships inside the binary, not loaded from a remote URL
- App works offline by default
- Architecturally different from a "web clipping"

**Guideline 4.7 (HTML5 Games, Bots, etc.):** Governs apps that *download and run* external code. Since Capacitor embeds code in the binary, 4.7 likely does not apply.

**To pass review, the app should:**
- Have a proper native loading state (not a blank white screen)
- Handle offline gracefully (Capacitor bundles assets, so automatic)
- Include at least one native integration (haptic feedback on tap is the easiest win)
- Not display any browser-like UI elements

### Build Requirement (April 2026)
New submissions must be built with the iOS/iPadOS 26 SDK.

---

## 4. Google Play Store Requirements

### Developer Account
- **Cost:** $25 one-time registration fee
- **Hardware:** No Mac needed; Bubblewrap runs on any OS

### TWA-Specific Requirements
- **Web manifest** (`manifest.json`) with name, icons, start_url, display mode, theme/background colors
- **Service worker** providing at least an offline fallback page
- **HTTPS** (already satisfied: chain-reaction.vivid.fish)
- **Digital Asset Links** (`/.well-known/assetlinks.json`) to prove domain ownership
- **Lighthouse PWA score of 80+**

### App Assets Required
- **App icon:** 512x512 px PNG
- **Feature graphic:** 1024x500 px JPG/PNG (no alpha)
- **Screenshots:** Minimum 2 phone screenshots
  - Phone: 16:9 portrait (e.g., 1080x1920) or 9:16 landscape
- **Privacy policy URL, app description, category**

---

## 5. Monetization Options

| Model | Complexity | Apple's Cut | Fits This Game? |
|-------|-----------|-------------|-----------------|
| **Completely free** | None | N/A | Yes — simplest, ship first |
| **Tip jar (IAP)** | Medium | 15-30% | Yes — "Buy the dev a coffee" |
| **Cosmetic IAP** | High | 15-30% | Maybe later — dot skins, trail colors |
| **Paid app** | Low | 15-30% | Risky — kills discovery |

### Tip Jar Implementation
- Must use Apple In-App Purchase (cannot link to external payment)
- Configure as **Consumable** IAP in App Store Connect
- Apple takes 15% (Small Business Program, under $1M revenue) or 30%
- Capacitor has official plugins for cross-platform IAP (RevenueCat, @capgo/capacitor-purchases)

**Recommendation:** Ship as completely free first. Add tip jar IAP in a v2 update.

---

## 6. Offline Support Requirements

### Android (TWA)
- Service worker must cache game files and show them when offline
- For a canvas game that's a single HTML + JS file, this is trivial

### iOS (Capacitor)
- **Capacitor bundles all web assets into the binary** — offline support is automatic
- No service worker needed (service workers don't work in iOS WKWebView anyway)

### Current Gap
The game currently has **no manifest.json, no service worker, and no icons** defined for PWA. These are needed for the Android TWA path.

---

## 7. Canvas-Specific Gotchas

### Device Pixel Ratio (DPR)
Current code renders at CSS pixel resolution, not device pixel resolution. On a 3x Retina iPhone, the game renders at 1/3 native resolution.

**Fix:**
```javascript
const dpr = Math.min(window.devicePixelRatio || 1, 2);
W = window.innerWidth;
H = window.innerHeight;
canvas.width = W * dpr;
canvas.height = H * dpr;
canvas.style.width = W + 'px';
canvas.style.height = H + 'px';
ctx.scale(dpr, dpr);
```

Cap DPR at 2 to avoid tripling render cost on 3x devices.

### iOS Canvas Performance
- iOS 15 introduced GPU Process for canvas rendering that caused regressions (60fps→30fps)
- iOS 16+ improved, but WKWebView still has overhead
- **Recommendation:** Profile on real device early. Avoid `shadowBlur`. Minimize canvas state changes.

### Google Fonts Dependency
Game loads Inter from CDN. For full offline support, **self-host the font** or use system font fallback.

---

## 8. Web Audio API on iOS

### Current Implementation
The game creates AudioContext on user interaction (correct approach):
```javascript
this.ctx = new (window.AudioContext || window.webkitAudioContext)();
this.ctx.resume();
```

### iOS-Specific Behavior
- Web Audio requires user gesture to create/resume — **already handled**
- Device ringer on vibrate/silent mutes Web Audio in WKWebView — by design, cannot be worked around
- **Recommendation:** Add visual indicator if audio is not playing (muted icon)

---

## 9. Complete Gap Analysis

### What the game has today:
- Single-file vanilla JS game (index.html + engine.js)
- Canvas 2D rendering
- Web Audio API with proper user-gesture initialization
- Touch-friendly controls with proper viewport meta tags
- Deployed on HTTPS at chain-reaction.vivid.fish
- PostgreSQL backend for replays/checkpoints

### What's missing for Google Play (TWA):

| Gap | Effort | Required? |
|-----|--------|-----------|
| `manifest.json` | 30 min | Yes |
| Service worker with offline cache | 1-2 hours | Yes |
| App icons (512x512, 192x192, maskable) | 1 hour | Yes |
| Digital Asset Links (`assetlinks.json`) | 30 min | Yes |
| Feature graphic (1024x500) | 1 hour | Yes |
| Privacy policy page | 30 min | Yes |
| Google Play Developer account ($25) | 15 min | Yes |

### What's missing for iOS App Store (Capacitor):

| Gap | Effort | Required? |
|-----|--------|-----------|
| Capacitor project setup | 2-3 hours | Yes |
| App icon (1024x1024, no alpha) | 1 hour | Yes |
| DPR-aware canvas rendering | 1-2 hours | Strongly recommended |
| Self-hosted font (or system font fallback) | 30 min | Recommended |
| Native haptic feedback on tap | 1 hour | Helps pass review |
| Proper launch/splash screen | 1 hour | Yes |
| Privacy policy page | Same as Android | Yes |
| Apple Developer account ($99/year) | 15 min | Yes |
| Mac with Xcode | — | Yes (hard requirement) |
| Store screenshots (iPhone sizes) | 1-2 hours | Yes |

---

## 10. Recommended Action Plan

### Phase 1: Android via TWA (1-2 days, $25)

1. Create `manifest.json` in project root
2. Create minimal service worker (`sw.js`) caching index.html + engine.js
3. Register service worker in index.html
4. Generate app icons (512x512, 192x192, maskable)
5. Add `<link rel="manifest">` to index.html
6. Run Bubblewrap: `bubblewrap init --manifest=https://chain-reaction.vivid.fish/manifest.json && bubblewrap build`
7. Set up Digital Asset Links at `/.well-known/assetlinks.json`
8. Create Google Play developer account ($25) and submit AAB

### Phase 2: iOS via Capacitor (3-5 days, $99/year)

1. Initialize Capacitor: `npx cap init "Chain Reaction" "fish.vivid.chainreaction" --web-dir .`
2. Fix DPR rendering in engine.js (cap at 2x)
3. Self-host Inter font or add system font fallback
4. Add haptic feedback via `@capacitor/haptics`
5. Create 1024x1024 app icon (no alpha, no rounded corners)
6. Open in Xcode: `npx cap open ios`
7. Configure signing with Apple Developer certificate
8. Test on real iPhone
9. Prepare App Store Connect listing
10. Submit for review (expect 1-3 iterations)

### Phase 3: Post-Launch (Optional)
- Tip jar IAP via RevenueCat
- Game Center / Google Play Games leaderboard integration
- Cosmetic unlocks (dot trail colors, explosion styles)

---

## 11. Build System Impact

**Android (TWA):** No build system needed. Bubblewrap is a standalone CLI.

**iOS (Capacitor):** Requires npm to install packages, but game code needs no bundling or transpilation. `webDir` points at project root; Capacitor copies files verbatim. Only Xcode compiles the native shell.

The `package.json` already exists with pg and playwright. Adding Capacitor packages is additive and doesn't change the development workflow.

---

## 12. Cost Summary

| Item | Cost | Frequency |
|------|------|-----------|
| Google Play Developer account | $25 | One-time |
| Apple Developer Program | $99 | Annual |
| Mac for Xcode (if not owned) | $500-1500 (used Mac Mini) | One-time |
| Total Year 1 (own a Mac) | $124 | |
| Total Year 1 (need a Mac) | $624-1624 | |

---

## Sources

- [Capacitor with VanillaJS](https://ionic.io/blog/create-powerful-native-mobile-apps-with-capacitor-vanillajs) — Ionic Blog
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) — Apple Developer
- [App Store Review Guidelines: WebView Apps](https://www.mobiloud.com/blog/app-store-review-guidelines-webview-wrapper) — MobiLoud
- [PWA to Play Store with Bubblewrap](https://medium.com/@abusomwansantos/from-pwa-to-play-store-a-technical-guide-to-bubblewrap-and-twa-b244d1a626e6) — Medium
- [Offline-First TWA](https://developer.chrome.com/docs/android/trusted-web-activity/offline-first) — Chrome for Developers
- [Optimizing Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) — MDN
- [Capacitor Games Guide](https://capacitorjs.com/docs/guides/games) — Capacitor Docs
- [Phaser + Capacitor Tutorial](https://phaser.io/tutorials/bring-your-phaser-game-to-ios-and-android-with-capacitor) — Phaser
- [Publishing PWA to App Stores](https://www.mobiloud.com/blog/publishing-pwa-app-store) — MobiLoud
