---
name: Scrapbook copy visibility
description: Keep all birthday scrapbook copy fully readable when text is loaded from JSON.
---

Keep the scrapbook's letter-by-letter typing effect visibly sequential and slow enough to notice. Each memory should begin typing only when its own photo/card enters view, with its title, paragraph, and caption typed in order. Preserve complete screen-reader copy and show all text immediately when reduced motion is enabled.

**Why:** The user explicitly wants to see the letters type as they scroll, one memory at a time; subtle opacity changes make all text appear present at once.

**How to apply:** In both the React scrapbook and standalone HTML page, stagger each visual character from hidden to visible, preserve readable full copy for assistive technology, keep reduced-motion users' text fully visible, and validate required JSON fields.
