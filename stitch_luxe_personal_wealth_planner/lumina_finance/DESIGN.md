---
name: Lumina Finance
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f5'
  surface-container: '#f0edef'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464d'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#0b1c30'
  on-tertiary-container: '#75859d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
typography:
  display-xl:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-xs:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 24px
  stack-gap: 16px
  section-margin: 32px
  gutter: 12px
---

## Brand & Style

The design system is anchored in a philosophy of "Financial Serenity." It targets professionals who seek clarity and control over their wealth through a premium, clutter-free interface. The brand personality is authoritative yet approachable—acting as a quiet, capable partner in the user's financial journey.

The visual style is **Corporate Modern with a Soft-Minimalist edge**. It leverages expansive whitespace to reduce cognitive load and subtle gradients to imply a sense of forward momentum and growth. The interface avoids aggressive "alert" aesthetics, instead using calm transitions and depth to guide the user's eye toward insights rather than just raw data.

## Colors

The palette is built on a foundation of "Deep Navy" (#0F172A) for primary text and core brand elements, providing a sense of stability and institutional trust. "Vibrant Teal" (#0D9488) serves as the primary action color, symbolizing growth and vitality. "Soft Slate Grays" (#64748B) handle secondary information and structural borders.

Subtle gradients should be applied to primary buttons and data visualizations, transitioning from the primary Teal to a lighter Cyan (#2DD4BF) to create a sense of "luminance" and depth. Neutral backgrounds use a very cool slate-white to keep the interface feeling fresh and premium.

## Typography

This design system utilizes **Manrope** for its core identity and body text, chosen for its modern, geometric balance that remains highly legible in dense financial lists. The tight tracking and varying weights allow for a clear hierarchy between large balance displays and smaller transactional details.

**Work Sans** is used selectively for labels, micro-copy, and numerical data. Its slightly more "grounded" and utilitarian feel provides a professional contrast to the more fluid Manrope, ensuring that functional elements like form labels and timestamps are instantly recognizable.

## Layout & Spacing

This design system employs a **Fluid Grid** model optimized for mobile-first views. It uses a 4px baseline grid to ensure mathematical harmony across all components.

Main content containers should observe a generous 24px horizontal margin to provide the "breathable" feel requested. Vertical spacing between different financial modules (e.g., Spending vs. Budgeting) should use a 32px margin to clearly demarcate sections without the need for heavy dividers.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and **Tonal Layering**. Surfaces do not use harsh black shadows; instead, they use a soft, multi-layered shadow tinted with the Deep Navy (#0F172A) at a very low opacity (4-8%). This makes cards appear as if they are floating gently above the base layer.

Subtle gradients are used on the Z-axis to imply depth. For example, a primary card might have a very faint linear gradient from #FFFFFF to #F8FAFC to give it a slight "pillowed" 3D effect. Background blurs (10-16px) should be used on sticky navigation bars and modal overlays to maintain context while focusing the user.

## Shapes

The shape language for this design system is **Rounded**. Standard components like buttons and input fields utilize a 0.5rem (8px) corner radius. Larger organizational containers, such as spending summary cards, should use the `rounded-xl` (1.5rem / 24px) setting to create a friendly, modern container look. 

Interactive elements like "Add Transaction" buttons should be fully rounded (pill-shaped) to distinguish them from informational containers.

## Components

**Buttons:** Primary buttons use a Teal gradient with white text. Secondary buttons use a transparent background with a Deep Navy border and text. All buttons should have a subtle 4px elevation shadow that "compresses" on tap.

**Cards:** Use a white surface with a 1px border in #E2E8F0. No heavy borders; let the soft shadow define the edges. Cards are the primary vehicle for financial data modules.

**Input Fields:** Ghost-style inputs with a subtle Slate bottom border that transitions to a 2px Teal border on focus. Labels should be in `label-xs` using the Work Sans font, positioned above the input.

**Chips:** Used for transaction categories (e.g., "Groceries", "Rent"). These should have a very light Teal tint (#F0FDFA) background with Teal text, using a fully rounded pill shape.

**Progress Bars:** Budget trackers should use a thick (8px) track. The "filled" portion should use the Vibrant Teal gradient, while the "unfilled" portion uses a soft Slate Gray (#F1F5F9).

**Icons:** 24px optical size, 1.5pt stroke weight. Icons should be "Outlined" style, using Deep Navy for inactive states and Teal for active states. Use rounded caps and joins to match the shape language of the system.