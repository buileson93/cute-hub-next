# Button

Button triggers an action when clicked. Use it for form submissions, confirmations, navigation, or any interaction that needs a clear call to action.

**Import:** `import {Button} from '@astryxdesign/core/Button';`

## Anatomy

| Element | Required | Description |
|---------|----------|-------------|
| Icon | No | A leading icon that reinforces the label, like a trash icon on a Delete button. |
| Label | Yes | The visible text describing the action. Also used as the accessible name. |
| End content | No | A trailing badge or icon after the label, like a notification count or dropdown arrow. |
| Spinner | No | Replaces the icon during loading to show the action is in progress. |

## Best Practices

- **Do:** Reserve primary for the single most important action in the view. Use secondary or ghost for everything else based on emphasis.
- **Do:** Write labels that describe the action ("Save changes", "Delete account", "Send invite"), not vague labels like "OK" or "Click here".
- **Do:** Show a loading state for actions that take time, like saving or submitting, so the user knows it is working.
- **Do:** Always provide a label for icon-only buttons so screen readers can announce what the button does. Add a tooltip for sighted users.
- **Do:** For a dedicated icon-only button, use IconButton from '@astryxdesign/core/IconButton'. It is a separate component, not exported from '@astryxdesign/core/Button'.
- **Don't:** Place more than one primary button in the same view; this dilutes the visual hierarchy.
- **Don't:** Use the destructive variant without a confirmation step for irreversible actions like deleting data.
- **Don't:** Use a button for navigation. If it only takes the user to another page, use a link instead. Buttons are for actions like saving, deleting, or submitting.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | — | Accessible label. Rendered as visible text by default; used as aria-label when isIconOnly is true. **(required)** |
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'destructive'` | `'secondary'` | Visual style variant. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant. |
| `elevation` | `'none' \| 'low' \| 'med' \| 'high'` | `'none'` | Resting shadow depth for floating buttons (e.g. a FAB). `none` is the default flat button; `low`/`med`/`high` map to the shadow token scale. Ignored inside a ButtonGroup, where elevation is owned by the group. |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type attribute. |
| `name` | `string` | — | HTML name attribute for form submission. |
| `value` | `string \| number \| readonly string[]` | — | HTML value attribute for form submission. |
| `form` | `string` | — | Associates the button with a form element by ID. |
| `isLoading` | `boolean` | `false` | Shows a loading spinner and disables interaction. Announces "Loading" via a live region. |
| `isInterruptible` | `boolean` | `false` | Keep the button clickable while a clickAction is pending: the spinner and aria-busy still show, but the button is not disabled and the action is not deduped, so a re-click lands and interrupts the in-flight action with a fresh one. |
| `isDisabled` | `boolean` | `false` | Disables the button. When a tooltip is present, uses aria-disabled instead of native disabled so the button stays focusable. |
| `icon` | `ReactNode` | — | Icon element rendered before the label text. |
| `isIconOnly` | `boolean` | `false` | When true, renders as a square icon-only button with label as aria-label. Requires icon. Tip: for a dedicated icon-only button component, use IconButton from '@astryxdesign/core/IconButton' instead. |
| `width` | `SizeValue` | — | Width of the button. Numbers are treated as pixels, strings are used as-is (e.g., '100%' for a full-width button). By default the button sizes to its content. |
| `children` | `ReactNode` | — | Optional override for visible text. When provided, displayed instead of label, but label is still required (it provides the accessible name). For most cases, just use label alone: <Button label="Save" />. |
| `endContent` | `ReactElement<IconProps> \| ReactElement<BadgeProps>` | — | Trailing icon or badge rendered after the label. Ignored when isIconOnly is true. Color is inherited from the button variant. |
| `tooltip` | `string` | — | Tooltip text shown on hover. |
| `onClick` | `(e: MouseEvent) => void` | — | Standard click handler (passed through from ButtonHTMLAttributes). |
| `clickAction` | `(e: MouseEvent) => void \| Promise<void>` | — | Async click handler. Shows loading state while the returned promise is pending. |

## Theming

| Component class | Preferred data attributes | Props | States |
|-----------------|---------------------------|-------|--------|
| `astryx-button` | `data-size`, `data-variant` | primary, secondary, ghost, destructive | — |

Override in defineTheme:
```ts
components: {
  'button': {
    base: { /* CSS properties */ },
    'size:value': { /* variant-specific */ },
  },
}
```

**Themeable CSS variables** — additional properties that can be overridden in `defineTheme` component overrides.

| CSS Variable | Default | Description |
|-------------|---------|-------------|
| `--button-focus-offset` | `var(--focus-outline-offset)` | Focus ring outline offset |
| `--button-icon-only-aspect` | `1 / 1` | Aspect ratio for icon-only buttons |

Some properties are set via standard CSS in component overrides:
```ts
components: {
  button: {
    base: {
      borderRadius: '...',
    },
  },
}
```


Related block templates

dirName:     AppShellMobileHookUsage
description: Custom mobile navigation trigger built with useAppShellMobile. The trigger consumes the surrounding AppShell context instead of rendering its own shell.

dirName:     BannerCollapsibleContent
description: Combine an action button, dismiss control, and expandable detail area in one banner. Use for complex notifications like config changes or deployment summaries.

dirName:     BannerSectionVariant
description: A full-width banner with no border radius for page-level notifications. Use at the top of a page for site-wide announcements or maintenance alerts.

dirName:     BannerWithActionButton
description: Add a button to a banner so the user can act on the message. Use for trial expirations, payment failures, or anything that needs a response.

dirName:     ButtonFloating
description: A floating action button raised with `elevation="med"`. Use elevation for buttons that hover above content, like a FAB.

dirName:     ButtonShowcase
description: All four button variants side by side: primary, secondary, ghost, and destructive. A quick visual reference for choosing the right variant.

dirName:     ButtonSizeVariants
description: Small, medium, and large buttons side by side. Use small in dense UIs like toolbars, medium for most cases, and large for prominent CTAs.

dirName:     ButtonVariants
description: All 4 button variants in default, disabled, and loading states. Use primary for the main action, secondary for most others, ghost for low-emphasis, and destructive for dangerous actions.

dirName:     ButtonWithEndSlot
description: Buttons with a trailing badge showing a count or status. Use for notification counts, unread messages, or any button that needs a visual indicator.

dirName:     ButtonWithIcon
description: Buttons with a leading icon that reinforces the label. Use when the icon helps the user identify the action faster, like a plus for "New" or a trash can for "Delete".

dirName:     ButtonGroupBasic
description: Three related actions joined into a single connected control. Provide a group label for accessibility and keep all buttons the same variant so they read as one unit.

dirName:     ButtonGroupFloating
description: A grouped action bar raised with `elevation="med"`. The connected buttons share one surface, so the shadow lifts them as a unit.

dirName: ButtonGroupShowcase

dirName:     CardWithInnerLayout
description: A card with a structured header, content area, and footer with action buttons. Use for forms, dialogs, or settings panels that need clear sections. Pair Card with Layout to get automatic dividers between header, content, and footer. The footer aligns actions to the right by default.

dirName:     ClickableCardWithNestedButton
description: A product card that navigates on click but has an independent "Add to cart" button inside.

dirName:     ChatComposerFooterActions
description: Chat composer with dropdown menus for a model selector and settings in the footer, and a mic button in the send actions slot.

dirName:     ChatComposerFullFeatured
description: Chat composer with all slots populated: collapsible attachment drawer, header actions, context progress bar, footer dropdown menus, and mic button. Shows the maximum composer configuration.

dirName:     ChatComposerDrawerShowcase
description: Composer drawer with file tokens, a collapsible toggle, and header actions. Use as a starting point for any chat composer with attachments.

dirName:     ChatComposerDrawerWithProgress
description: Drawer paired with a context progress bar in the header. Show context window usage when attachments consume part of the available token budget.

dirName:     ChatMessageBubbleMetadata
description: Bubbles with name and metadata slots aligned to bubble padding. Put name on the first bubble and metadata on the last bubble in a message.

dirName:     ChatMessageMetadataFooter
description: Assistant message with footer actions: copy, retry, thumbs up/down, and model label. Use for AI responses that need feedback or utility controls.

dirName:     ChatMessageMetadataShowcase
description: Three-message conversation showcasing error status with retry, delivery status, and full footer actions with model label.

dirName:     CollapsibleHookUsage
description: Custom disclosure UI built directly with useCollapsible for headless open/close state.

dirName:     DialogConfirmationDialog
description: Asks the user to confirm a destructive action before it happens. Use before deleting projects, removing team members, revoking API keys, or any irreversible operation.

dirName:     DialogFormDialog
description: Collects user input without navigating away from the page. Uses purpose="form" so clicking the backdrop won't close it. Use for editing profiles, creating items, or updating settings inline.

dirName:     DialogFullscreenDialog
description: Takes over the entire viewport for content that needs maximum space. Use for documentation viewers, rich text editors, multi-step wizards, or media previews where the standard dialog width is too narrow.

dirName:     DialogScrollingContent
description: Constrains the dialog height and scrolls the body when content overflows. Use for terms and conditions, license agreements, changelogs, or any long-form content the user needs to review before accepting.

dirName:     DialogWithSubtitle
description: Cannot be dismissed by Escape or backdrop click; the user must explicitly choose an action. Uses purpose="required". Use for ownership transfers, legal acknowledgements, or critical decisions where skipping is not an option.

dirName:     EmptyStateActions
description: Full empty state with icon, message, and action buttons. Use when a search returns no results, a filter clears all items, or a list has been emptied. The buttons give the user a way forward: go back, clear filters, or try a different query.

dirName:     EmptyStateCompact
description: Smaller empty state with reduced spacing for constrained areas. Use inside sidebar panels, card widgets, or notification drawers where a full-size empty state would overwhelm the layout.

dirName:     EmptyStateContainer
description: Empty state wrapped in a Card for first-time setup or onboarding. Use when the user has not created any items yet, like a project list, team roster, or dashboard widget that will fill with data once they take action.

dirName:     EmptyStateShowcase
description: A no-results empty state with an icon, descriptive message, and a call-to-action button.

dirName:     useContainerRevealHookUsage
description: File rows keep their edit/delete actions hidden at rest and reveal them on hover or keyboard focus via useContainerReveal; the actions stay mounted and in the tab order.

dirName:     useKeyboardHintHookUsage
description: Toolbar shows an ephemeral "← → to navigate" hint on first keyboard focus via useKeyboardHint, teaching sighted keyboard users that arrows move within the group.

dirName:     HoverCardHookUsage
description: Custom profile preview using useHoverCard with direct trigger and render control.

dirName:     HoverCardProfileHoverCard
description: Shows a user profile summary on hover with name, role, and bio. Use on usernames, avatars, or mentions to let users preview a profile without navigating away.

dirName:     HoverCardShowcase
description: A hover card that shows a user profile preview when hovering over a trigger button. Starts open for preview.

dirName:     LayerHookUsage
description: Low-level anchored overlay rendered with useLayer and a custom surface.

dirName:     LayoutBasicCardLayout
description: A card layout with header, scrollable content area, and footer with action buttons.

dirName:     LayoutContentWidth
description: A layout using contentWidth to constrain and center content while keeping dividers full-bleed.

dirName:     LayoutFullBleedContent
description: A layout where content extends edge-to-edge with zero padding, ideal for tables or images.

dirName: LayoutShowcase

dirName:     LayoutSidebarLayout
description: A settings page layout with a navigation sidebar panel, content area, header, and footer.

dirName:     LayoutFooterActions
description: A fixed footer with end-aligned action buttons below scrollable content. Use LayoutFooter inside Layout for persistent actions like Save and Cancel.

dirName:     LayoutHeaderWithActions
description: A fixed page header with a title and a primary action, above scrollable content. Use LayoutHeader inside Layout for persistent page-level headers.

dirName:     MediaThemeImageOverlay
description: A common image card pattern: place text and actions over a dark gradient and wrap the overlay content in MediaTheme mode="dark".

dirName:     MediaThemeLightScrim
description: A light scrim over an image. Use MediaTheme mode="light" so text and ghost buttons use dark-on-light tokens.

dirName:     MediaThemeShowcase
description: A compact media overlay showing MediaTheme adapting text, icons, badges, and button variants over an image-backed dark surface.

dirName:     MobileNavBasicMobileNav
description: Mobile navigation drawer with sectioned nav items triggered by a menu button

dirName:     MobileNavEndSideMobileNav
description: Navigation drawer that slides in from the right side of the screen

dirName: MobileNavShowcase

dirName:     MobileNavWithoutTitleMobileNav
description: Mobile navigation drawer without a title header

dirName:     MobileNavToggleShowcase
description: Demonstrates MobileNavToggle as a standalone hamburger button for opening the mobile navigation drawer.

dirName:     MultiSelectorGhostToolbar
description: Borderless MultiSelector variant composed with ghost buttons in a toolbar.

dirName:     OutlineControlled
description: Drive the active section yourself with activeId and onActiveIdChange. Providing activeId disables the built-in scroll-spy so your own logic owns the highlight.

dirName:     OverflowListCappedToolbar
description: maxVisibleItems caps the row at three actions even when more would fit; the rest move to a dropdown

dirName:     OverflowListCollapseFromStartList
description: Overflow list that hides items from the start, keeping the latest visible

dirName:     OverflowListOverflowDropdownActions
description: Action toolbar that collapses overflow buttons into a dropdown menu

dirName:     OverflowListShowcase
description: A list of buttons that collapses overflowing items into a +N indicator.

dirName:     OverlayHoverReveal
description: Reveals an overlay action on hover or keyboard focus. Use when actions should stay visually quiet until the media receives attention.

dirName:     OverlayShowcase
description: A media card with an always-visible scrim and centered action content.

dirName:     PopoverConfirmAction
description: Inline confirmation popover for destructive actions with delete and cancel buttons.

dirName:     PopoverFilterPanel
description: Popover with checkbox filters and apply/reset actions.

dirName:     PopoverHookUsage
description: Custom quick-actions popover using usePopover for trigger refs, ARIA attributes, and focus trapping.

dirName:     PopoverKeyboardShortcuts
description: Popover displaying a list of keyboard shortcuts with key and description pairs.

dirName:     PopoverSettingsPanel
description: Popover with toggle switches for managing user preferences like notifications, dark mode, and sounds.

dirName: PopoverShowcase

dirName:     ResizableSidebar
description: A collapsible sidebar with snap points, driven by useResizable. Dragging snaps to preset widths, dragging past the minimum collapses the panel, and the expand method restores it programmatically.

dirName:     SectionWashHighlight
description: A default section stacked with a full-width muted section. Shows how muted draws attention to a specific region like an upgrade prompt or banner.

dirName:     SelectorGhostToolbar
description: Borderless Selector variant composed with ghost buttons in a toolbar.

dirName:     StackAlignment
description: Buttons positioned at the start, center, and end of a row.

dirName:     StackFillItem
description: An avatar, text, and button in a row; the text stretches to fill the available space.

dirName:     StepperMultiStepForm
description: A vertical stepper driving a multi-step form. Each step renders its own fields in the content slot for the active step, with Back/Continue buttons advancing activeStep.

dirName:     TabListTabsWithActions
description: Page header pattern with tabs on the left and action buttons pushed to the right. When hasDivider is true, match the Button size to the TabList size so the tabs and actions align to a shared baseline above the divider.

dirName:     ThemeApply
description: Wrap a subtree in Theme to apply a theme to every child component in that region.

dirName:     ThemeNested
description: Nested Theme providers let a local region use a different theme without affecting the rest of the page.

dirName:     ThemeShowcase
description: Two visually distinct theme providers wrapping identical content to show how Theme changes the visual treatment of child components.

dirName:     ThemeSwitcher
description: Use state to switch the theme object passed to Theme and preview a different visual treatment.

dirName:     ToastAction
description: Persistent toasts with a trailing button or link so the user can act on the notification, like undoing a delete or viewing a report.

dirName:     ToastDeduplication
description: Prevent duplicate toasts with uniqueID. Use ignore to keep the first toast, or overwrite to replace it with updated content like a progress percentage.

dirName:     ToastDismiss
description: Show a persistent toast and dismiss it programmatically using the function returned by useToast. Use for long-running operations that need manual cleanup.

dirName:     ToastShowcase
description: Imperative toast notifications triggered with useToast and rendered in the toast viewport.

dirName:     ToastStacking
description: Multiple toasts stacking vertically with smooth enter and exit animations. Click repeatedly to see how toasts queue and dismiss.

dirName:     ToastTypes
description: Info and error toast variants side by side. Info toasts auto-dismiss after 5 seconds, error toasts persist until the user dismisses them.

dirName:     TokenizerEndContent
description: Tokenizer with an action button in the end slot. Use for inline actions like applying selections alongside the input.

dirName:     ToolbarBulkActions
description: A compact toolbar with the muted variant for showing bulk selection actions. Use when the user selects multiple items in a list or table and needs quick access to batch operations.

dirName:     ToolbarCardHeader
description: A toolbar as a card header with a left-aligned title and icon actions on the right. Use Toolbar instead of LayoutHeader when your card header has interactive actions; Toolbar adds start/end slot layout, keyboard navigation, and automatic size cascading. If the header is just a title with no actions, a LayoutHeader or Section is enough.

dirName:     ToolbarSizes
description: Small, medium, and large toolbars side by side. The size prop cascades to child buttons and inputs automatically. Use small in dense UIs like cards, medium for most cases, and large for spacious layouts.

dirName:     ToolbarThreeSlot
description: A toolbar with start, center, and end content using the three-column grid layout. Use when you need a centered title or heading with navigation and actions on either side.

dirName:     ToolbarWithTabs
description: A toolbar with tabs in the start slot and an action button at the end. Use as a card or section header when content is split into tabs with a primary action alongside.

dirName:     TooltipActionBarTooltips
description: Tooltips on an action button bar with contextual descriptions.

dirName:     TooltipHookUsage
description: Tooltip using the useTooltip hook for programmatic control.

dirName: TooltipShowcase

dirName:     TopNavCenteredNavigation
description: Navigation layout with center-aligned nav items flanked by a logo heading and end actions.

dirName:     TopNavEnterpriseDashboard
description: Full-featured navigation bar with icon-labeled nav items, search, notifications, and a primary CTA.

dirName:     TopNavHoverMenu
description: Navigation bar with a hover-triggered dropdown menu showing product items with icons and descriptions.

dirName:     TopNavMegaMenu
description: Marketing-style navigation with a full-width mega menu featuring product items and a promotional featured card.

dirName: TopNavShowcase

dirName:     TopNavWithLogo
description: Navigation bar with a branded logo icon, heading link, nav items, and a profile action.

dirName:     VisuallyHiddenLiveRegion
description: A polite aria-live region announces visual-only state changes to assistive technology.
