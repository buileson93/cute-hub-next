# Plan: Project Navigation IA (Phase 10V)

Implement a unified 6-tab navigation for the project detail view, ensuring consistent visual language, scoped actions, and high-density responsive layout.

## Goals
- Unified 6-tab `TabsList`: Board, Gantt, Danh sách, Timeline, Hồ sơ, Công văn.
- Scoped search and actions (task-related tools only show in task views).
- Responsive, vertical-scrollbar-free tab bar with horizontal scroll on mobile.
- Clean code architecture with typed configurations and normalization.

## Technical Details

### 1. Data Structures
- **ProjectView Type**: `kanban | gantt | list | timeline | hoso | cong-van`.
- **PROJECT_VIEWS Config**: A constant array mapping values to labels and Lucide icons.
- **Icon Mapping**:
  - `kanban` -> `KanbanSquare`
  - `gantt` -> `GanttChart`
  - `list` -> `ListTree`
  - `timeline` -> `CalendarClock`
  - `hoso` -> `FolderArchive`
  - `cong-van` -> `Mails`

### 2. Route Logic (`src/routes/_app.du-an.$id.tsx`)
- **Normalization**: Update `validateSearch` to redirect `discovery`, `delivery`, `operations` to `kanban`.
- **Conditional Rendering**:
  - Task Search Input: Only visible when `activeTab` is in `[kanban, gantt, list, timeline]`.
  - "Thêm việc" Action: Only visible when `activeTab` is in `[kanban, gantt, list, timeline]`.
- **Refactor Tab Rendering**: Replace manual `TabsTrigger` components with a `.map()` over `PROJECT_VIEWS`.

### 3. Component Updates
- **Tabs Primitive (`src/components/ui/tabs.tsx`)**: Ensure `variant="segmented"` handles horizontal overflow correctly without vertical scrollbars (Prompt 10P compliance).
- **Responsive Layout**:
  - Mobile: Tabs container uses `overflow-x-auto` and `overflow-y-hidden`.
  - Focus: Ensure `focus-visible` ring is not clipped by `overflow-hidden`.

### 4. Verification
- **IA Unit Test**: `src/routes/_app.du-an.$id.ia.test.ts` to verify normalization and supported views.
- **Visual Audit**: Run Playwright tests at 390px, 768px, and 1440px to check for scrollbars and tab visibility.
- **Accessibility**: Verify ARIA labels and keyboard navigation across all 6 tabs.

## User Interface Changes
- The project detail page will feature a cleaner, more professional segmented tab bar.
- Each tab will have a clear, semantic icon and a Vietnamese label.
- The interface will feel more focused, as irrelevant tools (like task search) will hide when viewing Dossiers or Correspondence.
- No more vertical scrollbars flickering on the tab bar.
