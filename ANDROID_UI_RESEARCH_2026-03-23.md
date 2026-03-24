# Android UI Research Notes

Date: March 23, 2026

## Why this pass exists

PlumberPass is being positioned as an Android-first reviewer, so the UI should be judged against current Android guidance rather than generic web dashboard patterns.

## Source direction

- Android UI design hub: `https://developer.android.com/design/ui`
- Material 3 layout guidance: `https://m3.material.io/foundations/layout/understanding-layout/overview`
- Material 3 navigation bar guidance: `https://m3.material.io/components/navigation-bar/overview`
- Material 3 cards guidance: `https://m3.material.io/components/cards/overview`

## Practical takeaways for PlumberPass

1. The home screen should be glanceable first, dense second.
   Users need one dominant mission, one primary action, and a few supporting status signals instead of many equal-weight panels.

2. Navigation should stay compact and thumb-reachable.
   A five-slot bottom nav with one emphasized primary action fits the study product better than a desktop-style top navigation pattern.

3. Surfaces should use tonal separation, not flat white blocks everywhere.
   Dark atmospheric backgrounds with layered cards give stronger hierarchy on Android OLED screens and make the product feel more premium.

4. The main review loop should minimize context switching.
   The question, answer options, and voice hint need to feel like one focused stack, not several unrelated widgets.

5. Mobile previews should be part of the workflow.
   We should be able to capture Android-width screenshots on demand instead of evaluating only from desktop browser windows.

## Applied decisions in this repo

- Dashboard shifted toward one mission-led hero with stronger CTA hierarchy.
- Review shell moved toward darker Android-style surfaces and more focused question presentation.
- Screenshot tooling now waits before capture so icon fonts render and the preview is trustworthy.
- A gallery script now captures the major mobile screens for repeatable UI checks.
