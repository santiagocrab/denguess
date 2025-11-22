# 💗 Pre-Birthday Dinner Invitation for Ada Tamia Misplacido

A sophisticated, elegant, and premium single-page website invitation for a special pre-birthday dinner. Designed with the utmost attention to detail, typography, and user experience.

## ✨ Premium Features

- **Sophisticated Design** - Elegant, minimalist aesthetic with refined typography
- **Premium Typography** - Playfair Display, Inter, and Cormorant Garamond fonts
- **Smooth Animations** - Scroll-triggered reveals with elegant transitions
- **Refined Color Palette** - Sophisticated rose tones, blush, and cream
- **Scroll Progress Indicator** - Elegant top progress bar
- **Interactive Gallery** - Hover effects with smooth image transitions
- **Confetti Celebration** - Beautiful confetti effect on invitation acceptance
- **Fully Responsive** - Perfect on all devices with optimized spacing

## 📁 Project Structure

```
birthday_invitation_tamia/
├── index.html          # Main HTML file
├── styles.css          # Premium styling and animations
├── script.js           # Sophisticated interactions
├── README.md           # This file
└── [Your photos here]  # See below
```

## 📸 Adding Photos

To add Ada's photos, place them in the project root directory with these exact names:

1. `ada-photo-1.jpg` - First gallery image
2. `ada-photo-2.jpg` - Second gallery image
3. `ada-photo-3.jpg` - Third gallery image

**Supported formats:** `.jpg`, `.jpeg`, `.png`, `.webp`

The website will automatically show elegant placeholders if photos aren't found, but add the actual photos for the complete experience!

## ✏️ Editing Dinner Details

Open `index.html` and find the **Dinner Details** section (around line 95-110). Edit these placeholders:

```html
<span class="detail-value">[Insert date here]</span>
<span class="detail-value">[Insert time]</span>
<span class="detail-value">[Restaurant name / location]</span>
```

Replace the placeholder text with your actual dinner details.

## 🚀 How to Use

1. **Add Photos**: Place `ada-photo-1.jpg`, `ada-photo-2.jpg`, and `ada-photo-3.jpg` in the project folder
2. **Edit Details**: Update the date, time, and place in `index.html`
3. **Open Website**: Simply open `index.html` in a web browser
   - For best results, use a local server:
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js
     npx http-server
     ```
4. **Share**: Host on any web service or share the files directly

## 🎨 Design Philosophy

This design focuses on:
- **Elegance over decoration** - Clean, sophisticated aesthetic
- **Premium typography** - Carefully selected font pairings
- **Subtle animations** - Smooth, purposeful transitions
- **Refined colors** - Sophisticated rose palette
- **Perfect spacing** - Generous whitespace and breathing room
- **Attention to detail** - Every element carefully considered

## 🎨 Customization

### Colors
All colors are defined in CSS variables at the top of `styles.css`:

```css
--rose-50 through --rose-700  /* Rose color scale */
--blush, --cream, --ivory     /* Neutral tones */
--gold, --gold-light          /* Accent colors */
```

### Typography
The website uses premium Google Fonts:
- **Playfair Display** - Elegant serif for headings
- **Inter** - Modern sans-serif for body text
- **Cormorant Garamond** - Sophisticated serif for accents

Change fonts in the `<head>` section of `index.html`.

### Animations
All animations use CSS custom properties and are optimized for performance. Adjust timing in `styles.css` keyframes.

## 💻 Browser Compatibility

Works perfectly on all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📱 Mobile Responsive

The website is fully responsive with:
- Optimized typography scaling
- Touch-friendly interactions
- Stacked layouts on mobile
- Maintained elegance across all screen sizes
- Performance optimizations

## ✨ Special Features

- **Scroll Progress Bar** - Elegant top indicator
- **Reveal Animations** - Elements fade in smoothly as you scroll
- **Parallax Backgrounds** - Subtle depth effects
- **Gallery Hover Effects** - Smooth image zoom and overlay
- **Confetti Celebration** - Beautiful effect on invitation acceptance
- **Smooth Scrolling** - Buttery smooth scroll behavior
- **Performance Optimized** - RequestAnimationFrame for all animations

## 🎯 Design Highlights

- **Hero Section** - Elegant typography with gradient text
- **Letter Section** - Sophisticated card design with wax seal
- **Gallery Section** - Beautiful grid with hover effects
- **Build-Up Section** - Minimalist statement cards
- **Invitation Section** - Premium card with elegant details
- **Modal** - Sophisticated popup with backdrop blur

## 💗 Made with Love

This website was created especially for **Ada Tamia Misplacido** for her pre-birthday dinner invitation. Every detail was carefully crafted to create a truly special and memorable experience.

---

**Note**: Make sure all three photo files are in the same directory as `index.html` for the best experience!
