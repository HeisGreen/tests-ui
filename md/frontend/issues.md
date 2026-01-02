# Frontend Issues

## Timezone handling in agent dashboards and chat

- `TravelAgentHome.jsx` and `Messages.jsx` both strip the trailing `Z` from ISO timestamps before constructing `new Date(...)`, so the time display honors the user’s locale offset instead of the UTC time the backend sends. That skews both the dashboard stats and the chat timestamps.
- Suggested fix: keep the `Z` (or parse with a utility that enforces UTC) before calling `getHours()`/`getMinutes()` so the timestamps remain accurate.
