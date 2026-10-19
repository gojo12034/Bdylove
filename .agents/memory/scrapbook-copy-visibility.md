---
name: Scrapbook copy visibility
description: Keep all birthday scrapbook copy fully readable when text is loaded from JSON.
---

Keep the scrapbook's letter-by-letter typing effect slow enough to notice, but keep every character readable from the first frame as it darkens into its final color. Also preserve the complete JSON copy for assistive technology.

**Why:** The user wants slower typing, but reported that hidden or faint characters made sentences appear incomplete.

**How to apply:** When changing either the React scrapbook or its standalone HTML page, animate only the visual presentation, keep reduced-motion users' text fully visible, and validate required JSON fields.
