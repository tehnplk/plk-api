# TEAM_001 — District KPI report integration

- Scope: Use kpi_report for district-level KPI list when filtering by amphur (อำเภอ)
- Notes:
  - Join condition: kpi_report.kpi_id = kpis.id
  - Use kpi_report.sum_result / rate / status where appropriate
  - Keep one row per KPI (option A)
