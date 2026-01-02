# Backend Issues

## User summary payload duplicates destination for migration purpose

- The `/users/{user_id}/profile-summary` endpoint maps both `desired_destination_country` and `migration_purpose` to `preferred_destinations`, so agents never see the real migration purpose (and destination appears twice).
- Recommended fix: wire `migration_purpose` to the correct onboarding field (e.g., `migration_timeline` or another purpose field) before returning the summary.

## Lack of automated coverage for travel agent/messaging flows

- The backend has no tests exercising the new agent onboarding, role-based guards, or messaging endpoints; the only existing script under `backend/` (`test_date_format.py`) just prints timestamps from the `Document` table.
- Suggestion: add FastAPI pytest suites covering the new endpoints (at least role checks and conversation flows) so future regressions are caught early.
