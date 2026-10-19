---
name: Scrapbook copy visibility
description: Keep all birthday scrapbook copy fully readable when text is loaded from JSON.
---

Keep the scrapbook's letter-by-letter typing effect, but ensure the complete JSON copy remains available to assistive technology and becomes fully visible when typing finishes. Do not let animation leave words permanently missing.

**Why:** The user wants the copy to type in, but reported that staggered characters made words appear missing.

**How to apply:** When changing either the React scrapbook or its standalone HTML page, keep the full text in an accessible, non-animated form, animate only its visual presentation, show all text when reduced motion is enabled, and validate required JSON fields.
