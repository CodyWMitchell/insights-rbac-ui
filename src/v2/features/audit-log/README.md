# Audit Log

Read-only table of RBAC audit log entries showing actions performed against roles, groups, and users.

## Route

| Path | Component |
|---|---|
| `/access-management/audit-log` | `AuditLog` |

## Files

| File | Purpose |
|---|---|
| `AuditLog.tsx` | Page component — fetches data via `useAuditLogsQuery`, renders `TableView` with server-side filtering and pagination |
| `AuditLogTable.tsx` | Presentational table component — receives entries as props, handles client-side filtering and pagination (used only in component stories) |
| `AuditLogTable.stories.tsx` | Storybook stories for `AuditLogTable` covering default, loading, empty, error, and pagination states |

## Data Layer

- **API client**: `src/v2/data/api/audit.ts` — wraps `@redhat-cloud-services/rbac-client` `getAuditlogs` endpoint (RBAC v1). Exports `AuditResourceTypeEnum` and `AuditActionEnum` for filter option values.
- **Query hook**: `src/v2/data/queries/audit.ts` — `useAuditLogsQuery` (TanStack Query)
- **MSW handlers**: `src/v2/data/mocks/audit.handlers.ts` — `auditHandlers()` supports `principal_username`, `resource_type`, and `action` query-param filtering

## Columns

Date · Requester · Description · Resource · Action

## Filters

| Filter | Type | API param | Notes |
|---|---|---|---|
| Requester | Text input | `principalUsername` | Partial match on `principal_username` |
| Resource | Select dropdown | `resourceType` | Values: group, role, user, permission |
| Action | Select dropdown | `action` | Values: add, remove, create, delete, edit |

Filter values are passed as server-side query params via `GetAuditlogsParams` from `@redhat-cloud-services/rbac-client`. `useTableState` manages filter state with URL sync (`syncWithUrl: true`).

## Permissions

No special permissions beyond standard RBAC access. The API enforces org-admin visibility.
