# Badge

Badge highlights a status or category at a glance. Use it sparingly: only when a value represents a distinct state (Active, Failed) or a grouping tag (Engineering, Design). Most metadata (dates, durations, counts, descriptions) should be plain description text, not badges.

**Import:** `import {Badge} from '@astryxdesign/core/Badge';`

## Anatomy

| Element | Required | Description |
|---------|----------|-------------|
| Icon | No | An optional leading icon that helps identify the badge type at a glance. |
| Label | Yes | The text or number shown inside the badge. |

## Best Practices

- **Do:** Every status badge steals attention. Only badge states where the user needs to notice or act: errors, warnings, items requiring follow-up. If no action is needed, plain text is fine.
- **Do:** Use success, warning, and error variants only for system status that demands attention: "Failed", "Degraded", "Action Required". These have bold solid backgrounds designed to stand out.
- **Do:** Use color variants (blue, purple, teal, etc.) for category tags that group or classify items: team names, content types, priority levels.
- **Do:** Keep labels to one or two words. If you need more detail, put it in surrounding text instead of the badge.
- **Do:** Add an icon when it helps identify the badge type quickly, but always include a text label alongside it.
- **Don't:** Apply a "success" badge to every healthy/active/normal item. If all rows show green "Active" badges, none stand out; the badge adds noise, not information. Show only the states that need user attention (errors, warnings, pending actions).
- **Don't:** Use badges for metadata. Durations ("6h window"), counts ("12 trigger types"), dates, and descriptions are not statuses or categories; use description text (Text with type="supporting") instead.
- **Don't:** Use semantic status variants (success, warning, error, info) for categories or informational content. These are visually loud and should only indicate system state.
- **Don't:** Repeat the same badge in every row of a table or list. If the same value appears in most rows, it's not adding information; use plain text for common states and reserve badges for the exceptional ones.
- **Don't:** Make badges clickable; they are read-only indicators. Use a button or link if the user needs to take action.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'neutral' \| 'info' \| 'success' \| 'warning' \| 'error' \| 'blue' \| 'cyan' \| 'green' \| 'orange' \| 'pink' \| 'purple' \| 'red' \| 'teal' \| 'yellow'` | `'neutral'` | Visual style variant. Semantic variants (neutral, info, success, warning, error) use solid backgrounds. Non-semantic color variants use tinted backgrounds with colored text for categorization and tagging. |
| `label` | `ReactNode` | — | Badge text content. |
| `icon` | `ReactNode` | — | Optional leading icon. |

## Theming

| Component class | Preferred data attributes | Props | States |
|-----------------|---------------------------|-------|--------|
| `astryx-badge` | `data-variant` | neutral, info, success, warning, error, blue, cyan, green, orange, pink, purple, red, teal, yellow | — |

Override in defineTheme:
```ts
components: {
  'badge': {
    base: { /* CSS properties */ },
    'variant:value': { /* variant-specific */ },
  },
}
```


Related block templates

dirName:     BadgeCategoryTags
description: Tag items with color-coded categories like teams, priorities, or topics. Use the 9 non-semantic color variants when you need to distinguish groups visually.

dirName:     BadgeCountBadges
description: Show a number inside a badge for notification counts, unread messages, or task totals. Use next to icons, nav items, or list labels.

dirName:     BadgeShowcase
description: All semantic and color badge variants in a single view. Use semantic variants for status and color variants for categories.

dirName:     BadgeStatusLabels
description: Show the state of an item like Active, Pending, or Failed. Use in table rows, list items, or detail pages where users need to see status at a glance.

dirName:     ButtonWithEndSlot
description: Buttons with a trailing badge showing a count or status. Use for notification counts, unread messages, or any button that needs a visual indicator.

dirName:     CarouselSnap
description: Scroll-snap carousel with navigation buttons and team member cards. Each card snaps to the start edge on scroll. Use when items should be viewed one at a time rather than as a continuous strip.

dirName:     ChatComposerDrawerFeedback
description: Chat composer drawer with a feedback prompt and selectable lettered options. Use for user confirmation workflows that require explicit action before proceeding.

dirName:     CheckboxListWithEndContent
description: Badges in the trailing slot show contextual info, like a price or status, next to each option without cluttering the label, so users can compare choices at a glance.

dirName:     HStackBasic
description: Items arranged in a horizontal row with a consistent gap and centered vertical alignment. Use HStack whenever siblings should sit side by side.

dirName:     HStackShowcase
description: Demonstrates HStack arranging items horizontally with different gaps and alignments.

dirName: ItemShowcase

dirName:     ItemWithMedia
description: Items with leading avatars and icons in the startContent slot. Keep start content small so the row stays compact and easy to scan.

dirName:     ItemWithMetadata
description: Items with end-aligned metadata and badges. Use the endContent slot for counts, status, timestamps, and other secondary row information.

dirName: LayoutShowcase

dirName:     ListMessageList
description: Chat-style message list with avatars, preview text, and unread badges.

dirName:     ListItemWithMedia
description: List items with leading avatars and icons. Use startContent for compact visual identifiers that help users scan the collection.

dirName:     ListItemWithMetadata
description: List items with end-aligned metadata. Use endContent for badges, counts, timestamps, and compact status details.

dirName:     MediaThemeShowcase
description: A compact media overlay showing MediaTheme adapting text, icons, badges, and button variants over an image-backed dark surface.

dirName:     MetadataListItemBasic
description: Labeled key-value rows inside a MetadataList. Values accept any content, from plain text to components like Badge.

dirName:     OverflowListMultiRowTags
description: Tags wrap onto up to two rows with maxRows, then collapse the rest into a count badge

dirName:     OverflowListOverflowBadges
description: Resizable row of badges that collapses into a count badge on overflow

dirName:     OverlayBottomStrip
description: Places compact supporting content in a bottom scrim strip without covering the entire image.

dirName:     SideNavEndContent
description: Side navigation items with badges, counts, and context menus as trailing content.

dirName:     StackDirections
description: Badges arranged horizontally and vertically in side-by-side cards.

dirName:     TabListTabsWithBadge
description: Tabs with notification badge counts rendered via endContent. Uses error variant for urgent counts and neutral for informational ones.

dirName:     TableRichCellTable
description: Table with rich cell content using Link for emails and Badge for role labels.

dirName:     ThemeShowcase
description: Two visually distinct theme providers wrapping identical content to show how Theme changes the visual treatment of child components.

dirName:     TokenEndContent
description: Tokens with trailing content like a count badge or status indicator after the label. Use for notification counts, item quantities, or compact status info.

dirName:     ToolbarBulkActions
description: A compact toolbar with the muted variant for showing bulk selection actions. Use when the user selects multiple items in a list or table and needs quick access to batch operations.

dirName:     TreeListMailboxTree
description: Email folder tree with unread badge counts.

dirName:     VStackShowcase
description: Demonstrates VStack arranging items vertically with different gaps.

dirName:     VisuallyHiddenStructuralHeading
description: Give a visually implicit section an accessible name so screen-reader users can navigate to it.
