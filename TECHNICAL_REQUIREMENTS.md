# Oracle Card App — Technical Requirements

> This file tracks all requirements, fixes, and tasks for the project.
> Every new request, bug fix, or feature must be logged here.

---

## Core Requirements

1. Display oracle cards from 3 blocks: **Ленорман** (36 cards, numbered 1–36), **Загальний** (74 cards, numbered 37–110), **Магічний** (46 cards, numbered 1–46)

2. Each card must show: its **image**, **number**, **name**, and **description** — all matching the actual content of the source PDF

3. **Filter by block** — ability to view cards from one block at a time, or all blocks together

4. **Search** — filter cards by name

5. **Spread / layout feature** — ability to select multiple cards and display them together as a spread (like a tarot reading layout)

6. **Card detail view** — clicking a card opens it in a larger view with full description

7. **Visual design**: dark purple background, gold accents, elegant fonts (Cinzel + Crimson Pro) — matches the original old design

8. Card images are embedded directly in the HTML as **base64 JPEG** (no external image files)

9. **Block color-coding**:
   - Ленорман → blue (`#4d8bc9`)
   - Загальний → orange (`#c97a4d`)
   - Магічний → purple (`#9b4dc9`)

10. **Descriptions must not bleed between cards** — each card shows only its own text

11. **Відповідність карток** — номер, назва і текст опису кожної картки повинні точно відповідати зображенню на цій картці (від початку до кінця опису), без переплутування між картками і без "витікання" тексту з сусідніх карток.

---

## Change Log

| Date | Type | Description |
|------|------|-------------|
| 2026-10-11 | Init | Created requirements file |
