# Unified Vertical Project Timeline Implementation Plan

Implement a vertical, Astryx-standardized project timeline for MIRATS. This includes creating the underlying database structure, event logging mechanisms, and a high-fidelity UI with an inspector panel.

## User Review Required

> [!IMPORTANT]
> The timeline will record activities from multiple sources (Web, Browser Extension, API). To ensure complete coverage, we will implement database triggers for core entities.

- **Event Visibility**: Should all events be visible to all project members, or should there be restricted events (e.g., private notes)? (Default: Visible to all members).
- **History Backfill**: Do you want to automatically backfill events for existing project data, or only record new events from now on?

## Proposed Changes

### 1. Database Schema (Supabase)

#### New Tables & Triggers

- `du_an_su_kien`: Stores the unified timeline events.
- `du_an_su_kien_tep`: Junction table or view to associate files with events.
- Triggers on `du_an`, `du_an_moc`, `du_an_cong_viec`, `lean_ux_canvases`, `pitches`, and `cong_van` to record events automatically.

### 2. Backend Logic (TanStack Start)

#### Server Functions

- `getProjectEvents`: Fetches filtered and paginated events for a specific project.
- `logProjectEvent`: A server-side utility to manually record events that can't be captured via triggers.

### 3. UI Components (Astryx & React)

#### Project Timeline View (`src/components/mirats/projects/timeline/`)

- `ProjectTimeline.tsx`: Main container using `LayoutContent`.
- `TimelineList.tsx`: Edge-to-edge list implementation with vertical axis and StatusDots.
- `TimelineItem.tsx`: Individual row showing actor, summary, metadata tokens, and nested file rows.
- `TimelineInspector.tsx`: 380px side panel for event details, metadata, and deep links.
- `TimelineFilters.tsx`: Toolbar for event type, actor, date range, and search.

### 4. Integration

#### Route Update

- Connect the `Timeline` tab in `src/routes/_app.du-an.$id.tsx` to the new `ProjectTimeline` component.
- Ensure URL state persistence for filters and the selected event ID (inspector state).

## Technical Details

### Database Migration

```sql
CREATE TYPE public.project_event_type AS ENUM (
  'project_created', 'project_updated',
  'milestone_created', 'milestone_updated', 'milestone_deleted',
  'task_created', 'task_updated', 'task_status_changed', 'task_completed',
  'canvas_published', 'pitch_created',
  'document_uploaded', 'document_linked',
  'delivery_update', 'operations_update'
);

CREATE TABLE public.du_an_su_kien (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    du_an_id uuid REFERENCES public.du_an(id) ON DELETE CASCADE,
    event_type public.project_event_type NOT NULL,
    entity_type text NOT NULL, -- 'task', 'milestone', 'canvas', etc.
    entity_id uuid NOT NULL,
    title text NOT NULL,
    summary text,
    actor_id uuid REFERENCES auth.users(id),
    occurred_at timestamptz DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    source text DEFAULT 'web', -- web, extension, api, automation
    external_request_id text,
    created_at timestamptz DEFAULT now()
);

-- RLS & Grants
ALTER TABLE public.du_an_su_kien ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.du_an_su_kien TO authenticated;
GRANT INSERT ON public.du_an_su_kien TO service_role; -- Triggers run as service_role/owner
```

### UI Specifications

- **Vertical Axis**: 2px wide line using MIRATS Blue (#0074e2) or gray based on event status.
- **Inspector**: Standardized 380px width, responsive overlay on mobile.
- **Performance**: Virtualized list if events exceed 500+ to maintain < 100ms interaction time.
