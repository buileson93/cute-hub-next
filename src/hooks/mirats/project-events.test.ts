import { describe, it, expect } from 'vitest';

describe('Project Event Logic', () => {
  it('should be chronologically sortable', () => {
    const events = [
      { occurred_at: '2026-08-19T10:00:00Z', title: 'Later' },
      { occurred_at: '2026-08-19T09:00:00Z', title: 'Earlier' }
    ];
    
    const sorted = [...events].sort((a, b) => 
      new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
    );
    
    expect(sorted[0].title).toBe('Earlier');
  });

  it('should filter by event type correctly', () => {
    const events = [
      { event_type: 'task_created', title: 'Task' },
      { event_type: 'document_uploaded', title: 'Doc' }
    ];
    
    const filtered = events.filter(e => e.event_type === 'task_created');
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe('Task');
  });
});
