# PRD: Identity Resolution — Processing History

**Feature area:** Data Cloud > Identity Resolutions > Ruleset Detail > Processing History tab
**Current release:** Today (GA)
**Target release:** 264 Release

---

## 1. Overview

The Processing History tab within an Identity Resolution ruleset provides administrators and data stewards with visibility into how identity resolution jobs have performed over time. It surfaces key metrics about profile unification, record processing volumes, and job outcomes.

This PRD documents the **current state** (Daily Processing Summary table) and specifies two new tracking tables introduced in the **264 Release**: a **Job History** table with per-job granularity and a **Ruleset Change Log** for governance and auditability.

---

## 2. Current State — Daily Processing Summary

### 2.1 Description

The Daily Processing Summary table aggregates the results of all identity resolution runs from a single calendar date into one row. It provides a high-level view of the ruleset's unification output and processing volumes over time.

A descriptive subtitle reads:
> *"Daily summaries contain the aggregate results of all runs of this ruleset from a single date."*

An indicator also displays whether **Automatic runs** are Enabled or Disabled.

### 2.2 Field Definitions

| # | Column Label | Field | Description |
|---|---|---|---|
| 1 | *(row number)* | `rowNum` | Sequential row number for display ordering. Not a data field; serves as a visual index within the table. |
| 2 | **Date** | `date` | The calendar date (YYYY-MM-DD) for which the processing results are aggregated. Each row represents one day's combined output from all identity resolution runs for this ruleset. |
| 3 | **Total Source Profiles** | `totalSourceProfiles` | The total number of individual source records (across all connected data streams and DMOs) that were evaluated as input to the identity resolution process on this date. This count reflects the size of the source population before any matching or unification occurs. |
| 4 | **Total Unified Profiles** | `totalUnifiedProfiles` | The total number of distinct unified (golden) profiles that exist after the identity resolution process completes. Each unified profile represents a single resolved entity composed of one or more matched source profiles. This is the primary output metric of identity resolution. |
| 5 | **Total Known Profiles** | `totalKnownProfiles` | The subset of unified profiles that have been positively identified — i.e., at least one match rule successfully linked source records together into this profile. Known profiles have sufficient identifying information (e.g., matching email, phone, or name) to be considered resolved. |
| 6 | **Consolidation Rate** | `consolidationRate` | The percentage reduction from source profiles to unified profiles, calculated as: `((Total Source Profiles - Total Unified Profiles) / Total Source Profiles) * 100`. A higher consolidation rate indicates more source records are being successfully matched and merged. Typical healthy ranges are 10-30% depending on data quality and match rule strictness. |
| 7 | **Total Unknown** | `totalUnknown` | The number of unified profiles that could not be positively identified by any match rule. These are singleton profiles where no cross-record match was found — the source record stands alone as its own unified profile. A high unknown count may indicate gaps in match rule coverage or poor data quality in key matching fields. |
| 8 | **Processed Records** | `processedRecords` | The number of source records that were actively evaluated and processed by the identity resolution engine during this date's runs. **This is the billing meter for Data Cloud Identity Resolution credit consumption.** Each processed record consumes credits against the org's Data Cloud entitlement. A value of 0 indicates a run where no new or changed records needed processing (no delta). Non-zero values reflect incremental or full processing volumes that count toward credit usage. |
| 9 | **Aggregate Status** | `aggregateStatus` | The overall outcome status for all identity resolution runs on this date. Values: **Succeeded** (all runs completed without error) or **Failed** (one or more runs encountered an error). When any individual run within the day fails, the aggregate status reflects the failure. |

---

## 3. 264 Release — Enhanced Processing History

### 3.1 Design Rationale

Voice of Customer (VOC) feedback identified three key gaps in the current Daily Processing Summary:

1. **Lack of job-level granularity** — Aggregating all runs into a single daily row obscures individual job outcomes, making it difficult to diagnose issues or understand what triggered each run.
2. **No governance trail for ruleset changes** — Identity Resolution is credit-intensive. Administrators need to track *who* changed *what* in a ruleset and *when*, to understand the impact of configuration changes on processing costs and match quality.
3. **Missing operational context** — The current table does not capture *why* a job ran (trigger reason), *who* initiated it, or *how long* it took, all of which are essential for operational monitoring.

### 3.2 Summary Stats Bar

A new summary stats bar appears above the tables, providing at-a-glance KPIs:

| Stat | Description |
|---|---|
| **Processed Records (30d)** | Sum of all processed records across all jobs in the last 30 days. This is the billing meter total — reflects cumulative credit consumption for the period. |
| **Jobs (last 24h)** | Count of identity resolution jobs (both individual and aggregated) that ran in the last 24 hours. |
| **Schedule** | Current scheduling status: the configured schedule (e.g., "Daily 2:00 AM") or "Disabled" if no schedule is active. |
| **Ruleset Changes** | Total count of recorded ruleset configuration changes in the audit log. |

### 3.3 Table 1: Job History

The Job History table replaces the Daily Processing Summary with per-job granularity. The design principle is:
- **Large jobs** (full reprocessing, manual runs, ruleset-change-triggered runs) are listed as **individual rows**.
- **Small incremental syncs** (automated delta processing with low record counts) are **aggregated into a single daily row** to reduce noise.
- Only the **last 24 hours** show individual job detail; older entries show one row per day (large jobs individually, small jobs aggregated).

A subtitle reads:
> *"Large jobs shown individually. Small incremental syncs aggregated daily."*

#### 3.3.1 Field Definitions

| # | Column Label | Field | Description |
|---|---|---|---|
| 1 | *(status icon)* | `status` (icon) | A visual status indicator in the first column. Displays a contextual icon: green checkmark (Succeeded), red X-circle (Failed), amber triangle (Warning), or spinning loader (Running). Provides at-a-glance job health without reading the status text. |
| 2 | **Date / Time** | `date`, `startTime` | The date and time when the job started. Date displayed in YYYY-MM-DD format with the start time alongside (e.g., "2026-03-03 2:00 PM"). For aggregated rows, only the date is shown (no start time) since the row represents multiple jobs across the day. |
| 3 | **Job ID** | `jobId` | A unique system-generated identifier for the job (e.g., "JOB-900103"). For **aggregated rows**, this column instead displays a badge showing the count of jobs rolled up (e.g., "7 jobs") with a layers icon, indicating this is a summary row rather than an individual job. |
| 4 | **Run Reason** | `runReason` | The trigger that caused this identity resolution job to execute. Captures the *why* behind each run. Common values include: "Scheduled (Daily 2:00 AM UTC)" for cron-triggered runs, "Manual run" for user-initiated executions, "New data ingested" for runs triggered by incoming data stream refreshes, "Ruleset change published" for runs triggered after match rule or reconciliation rule modifications, and "Data stream refresh" for runs triggered by upstream data changes. For aggregated rows, shows the count of incremental syncs (e.g., "7 incremental syncs"). Manual and ruleset-change triggers are displayed with medium font weight to draw attention. |
| 5 | **User** | `triggeredBy` | The user or system process that triggered the job. Displays the full name of the user who initiated the run (e.g., "Sarah Johnson" for a manual run) or "Automated Process" for system-triggered jobs (scheduled runs, data-ingestion triggers). Accompanied by a user icon for visual clarity. |
| 6 | **Duration** | `duration` | The wall-clock time the job took to complete, displayed in HH:MM format (e.g., "01:12" for 1 hour 12 minutes, "00:38" for 38 minutes). For aggregated rows, shows the cumulative duration of all rolled-up jobs. Helps administrators identify unexpectedly long-running jobs that may indicate data quality issues or scaling concerns. |
| 7 | **Records** | `sourceRecords` | The number of source records processed in this job. **This is the per-job billing meter** — each record processed consumes credits against the org's Data Cloud entitlement. Displayed right-aligned with locale-formatted numbers (e.g., "12,061"). For aggregated rows, shows the combined record count across all rolled-up jobs. Administrators should monitor this field to understand credit consumption patterns at the job level. |
| 8 | **Status** | `status` | The outcome of the job displayed as a colored badge. Values: **Succeeded** (green) — job completed without errors, **Failed** (red) — job encountered an error and did not complete, **Warning** (amber) — job completed but with non-fatal issues (e.g., partial match failures, data quality warnings), **Running** (blue, animated) — job is currently in progress. |

#### 3.3.2 Aggregated Row Styling

Aggregated rows (where `jobType === 'aggregated'`) are visually distinguished with:
- A light grey background (`#FAFAF9`) to differentiate from individual job rows.
- A "layers" badge in the Job ID column showing the job count.
- No start time in the Date / Time column.

### 3.4 Table 2: Ruleset Change Log

A new **Ruleset Change Log** table is added below the Job History table to provide a complete audit trail of all configuration changes to the identity resolution ruleset.

A subtitle reads:
> *"Track what was changed, who made the change, and when."*

#### 3.4.1 Field Definitions

| # | Column Label | Field | Description |
|---|---|---|---|
| 1 | *(icon)* | — | A document icon in the first column to visually identify each row as a change record. |
| 2 | **Date** | `date` | The date and time when the configuration change was made, displayed in a human-readable format (e.g., "2026-03-02 11:42 AM"). |
| 3 | **Change** | `field` | A description of what was changed in the ruleset. Displayed in the brand color (blue) with medium font weight to draw attention. Examples: "Match Rule 'Exact Email Match'" (a match rule was modified), "Match Rule Priority" (rule ordering was changed), "New Match Rule Added" (a new rule was created), "Reconciliation Rule" (a reconciliation setting was updated), "Scheduling" (the run schedule was modified), "Match Rule 'Fuzzy Name' deleted" (a rule was removed), "Ruleset Published" (the ruleset was moved from Draft to Published). |
| 4 | **Previous Value** | `oldValue` | The value of the field *before* the change was made. Displayed in muted text. Shows "—" when there was no previous value (e.g., when adding a new rule or publishing for the first time). |
| 5 | **New Value** | `newValue` | The value of the field *after* the change was applied. Displayed with medium font weight. Shows "—" when the change was a deletion (e.g., removing a match rule). |
| 6 | **Changed By** | `changedBy` | The full name of the user who made the configuration change. Accompanied by a user icon for visual consistency with the Job History table. System-initiated changes (e.g., automated publish workflows) display "Data Cloud Admin" or the relevant system identity. |

---

## 4. Migration Path

| Aspect | Today | 264 Release |
|---|---|---|
| **Processing History table** | Daily Processing Summary (aggregated daily rows) | Job History (per-job rows with daily aggregation for small syncs) |
| **Billing meter indicator** | `Processed Records` column (no visual distinction) | `Records` column (same data, now contextualized with per-job granularity in summary stats bar showing 30-day total) |
| **Governance** | None | Ruleset Change Log table |
| **Operational context** | Date + Status only | Date/Time, Job ID, Run Reason, User, Duration, Status |
| **Default detail tab** | Details | Ruleset Properties |

The Today view (Daily Processing Summary) remains available and unchanged for the current release. The 264 Release view is additive — it does not remove any existing data; it presents the same underlying processing data with greater granularity and adds the new governance table.
