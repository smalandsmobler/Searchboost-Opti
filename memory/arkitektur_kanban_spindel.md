---
name: Kanban som single source of truth (designprincip)
description: Designregel — seo_work_queue ska vara KÄLLAN för alla åtgärder (manuella + automatiska + framtida), och seo_optimization_log följer automatiskt vid done-transition.
type: project
---

# Kanban som spindel i nätet

**Beslutat: 2026-05-15 (efter veckomail-incidenten)**

## Problem som motiverade regeln

2026-05-15 körde mega-runner 528 optimeringar via `/api/customers/:id/manual-work-log`-endpoint, som anropar `logOptimization()` direkt mot BQ. När streaming insert blockerades av BQ sandbox catchades felet tyst → endpoint returnerade `success: true` utan att data nådde BQ → veckomailet visade 16 åtgärder istället för 528. Ingen synlighet av problemet förrän det var för sent.

## Designregel

Alla åtgärder — manuella, automatiska, framtida optimeringar — ska gå via **`seo_work_queue`** (kanban-tabellen) som källan. `seo_optimization_log` skapas automatiskt vid done-transition.

```
manuell/auto åtgärd → seo_work_queue (status='pending')
                    ↓ (vid start: status='in_progress')
                    ↓ (vid klar: status='done')
                    ↓ (trigger eller wrapper-funktion)
                    seo_optimization_log (auto från done-transition)
                    ↓
                    weekly-report + portal + kundzon (alla läser samma)
```

## Krav per task i seo_work_queue

| Fält | Vad |
|---|---|
| `queue_id` | Unik ID |
| `customer_id` | Kund |
| `task_type` | meta_title / schema / content / etc. |
| `page_url` | Sida som påverkas |
| `status` | pending / in_progress / done / error / skipped |
| `source` | manual / autonomous-optimizer / mega-runner / algorithm-watcher |
| `priority` | 0-100 |
| `context_data` | JSON med target_url, keyword, before, after |
| `ssm_keys` | JSON-array av SSM-paths som påverkade tasken (t.ex. WP-creds, tier) |
| `created_at`, `started_at`, `completed_at` | Timestamps |

## Wrapper-funktion (att bygga)

Alla skrivande endpoints ska anropa en delad `executeAndLog(task)`:

```javascript
async function executeAndLog(task, executor) {
  await updateQueueStatus(task.queue_id, 'in_progress');
  try {
    const result = await executor(task);
    await updateQueueStatus(task.queue_id, 'done', { result });
    await logOptimization({ ...task, result }); // auto från done
    return result;
  } catch (err) {
    await updateQueueStatus(task.queue_id, 'error', { error: err.message });
    throw err;
  }
}
```

## Konsekvenser

1. **Synlighet** — alla åtgärder syns i kanban-vyn (Opti + Kundzon). Inga silent failures.
2. **Audit trail** — vi vet alltid VEM gjorde VAD, NÄR, med VILKA credentials.
3. **Återkörningsbarhet** — error-tasks kan retryas utan att duplicera logg.
4. **Framtida funktioner** — A/B-tester, batch-godkännanden, kund-prioritering, allt utgår från kanban.
5. **SSM-spårbarhet** — `ssm_keys`-fältet gör det möjligt att se vilka credential-rotationer som påverkade vilka åtgärder.

## Implementation-roadmap

1. **Nu (klart)**: `seo_work_queue` finns och används av autonomous-optimizer + algorithm-watcher.
2. **Steg 1**: Refaktorera `manual-work-log`-endpoint att gå via `executeAndLog` istället för direkt-skrivning till logg.
3. **Steg 2**: Bygg `executeAndLog`-wrapper med automatisk logg-rad vid done.
4. **Steg 3**: Lägg till `ssm_keys` + `source`-fält i seo_work_queue-schemat.
5. **Steg 4**: Migrera mega-runner att skapa work_queue-tasks innan WP-uppdatering.
6. **Steg 5**: Kanban-vyn i Dashboard + Kundzon visar live status per task.

## Anti-pattern (UNDVIK)

- Direkt-skrivning till `seo_optimization_log` utan motsvarande work_queue-rad.
- `try { await bq.insert(...) } catch (e) { console.error('...'); }` utan att slå alert / propagera fel uppåt.
- Endpoints som returnerar `success: true` baserat på att de PROCESSADE input, inte att data faktiskt landade i BQ.

## Relaterade memory-filer

- `feedback_lambda_send.md` — när Lambdas får triggas
- `system.md` — komplett systembeskrivning
