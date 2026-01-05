# iOS PWA Floating Action Bar + Keyboard Sync (Single-File Reality Check)

## Problem
In iOS PWAs, a floating action bar above the keyboard feels disconnected:
- The panel moves immediately
- The keyboard follows ~1 second later
- Scrolling causes delayed keyboard dismissal
- The experience feels non-native and broken

This is not a bug in your app.
This is iOS Safari behavior.

---

## Root Cause
- Keyboard animation is native
- Floating panels are web-rendered
- They are not synchronized
- iOS uses a fake layout viewport when the keyboard is visible
- Scrolling signals “dismiss keyboard,” but iOS delays execution

Result:
Panel reacts instantly → keyboard hesitates → delayed collapse → jank

---

## Things That Guarantee Jank
Avoid all of the following:
- `position: fixed` combined with `100vh`
- Allowing page scroll while an input is focused
- Letting the action bar scroll vertically
- Animating UI in response to keyboard movement
- Relying on CSS positioning instead of `visualViewport`

---

## The Only Pattern That Works Reliably

### 1. Freeze Scrolling While Keyboard Is Open (Critical)
Native apps freeze the world. Do the same.

```js
function lockScroll() {
  document.body.style.overflow = 'hidden'
}

function unlockScroll() {
  document.body.style.overflow = ''
}
Call lockScroll() on input focus
Call unlockScroll() on input blur
This alone removes most perceived lag.

2. Anchor the Panel to visualViewport
This is the only API that tracks the real visible area.
const panel = document.getElementById('action-bar')
const vv = window.visualViewport

function syncPanel() {
  panel.style.transform = `translateY(${vv.offsetTop}px)`
}

vv.addEventListener('resize', syncPanel)
vv.addEventListener('scroll', syncPanel)
Why:
visualViewport follows keyboard movement
CSS bottom: 0 lies during keyboard open
3. The Action Bar Must Not Scroll Vertically
If it scrolls vertically, iOS assumes the user wants the keyboard dismissed.
Rules:

Fixed height
Horizontal scrolling only (chips, buttons)
All vertical scrolling happens above the input area
4. Block Keyboard Dismissal While Touching the Panel
Keep focus locked while interacting with the bar.
panel.addEventListener('touchstart', e => {
  e.preventDefault()
})
This signals: “Still typing. Keyboard stays.”
5. Snap, Don’t Animate
Do not animate alongside the keyboard.
Native behavior:

Instant layout changes
Frozen background
No easing
No chasing animations
If it snaps instantly, it feels native.
If it animates, it feels broken.
Mental Model
You are not attaching UI to the keyboard.
You are creating the illusion that it is attached.
The illusion only holds if:

Layout is frozen
Nothing scrolls
Nothing animates