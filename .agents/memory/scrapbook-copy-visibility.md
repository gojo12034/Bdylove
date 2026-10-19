---
name: Scrapbook copy visibility
description: Keep all birthday scrapbook copy fully readable when text is loaded from JSON.
---

Render copy from `content.json` directly as complete text. Avoid splitting sentences into individually opacity-hidden characters; staggered text can make words look missing or incomplete. Scroll reveal animation on a whole section is fine.

**Why:** Readers reported missing words while copy was being revealed, even though the JSON itself contained complete sentences.

**How to apply:** When changing either the React scrapbook or its standalone HTML page, keep complete text visible and validate the required JSON fields before rendering.
