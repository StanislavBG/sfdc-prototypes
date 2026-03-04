# PRD: Identity Resolution — Processing History

**Feature area:** Data Cloud > Identity Resolutions > Ruleset Detail > Processing History tab
**Current release:** Today (GA)
**Target release:** 264 Release

---

## 1. Overview

The Processing History tab within an Identity Resolution ruleset provides administrators and data stewards with visibility into how identity resolution jobs have performed over time. It surfaces key metrics about profile unification, record processing volumes, and job outcomes.

This PRD documents the **current state** (Daily Processing Summary table) and specifies enhancements for the **264 Release**: a **Job History** view with per-job granularity, a **Ruleset Change Log** for governance and auditability, and **API access** so customers can build on this data programmatically.

---

## 2. API Access (264 Release)

Job history and ruleset change log data must be accessible via APIs — not only through the Data Cloud UI. Customers and partners need programmatic access to:

- **Build custom dashboards and reporting** on identity resolution performance, consolidation rates, and job outcomes
- **Integrate processing metrics into their existing monitoring and alerting workflows** for real-time operational visibility
- **Automate cost tracking** by pulling processed record counts and credit consumption data into billing reconciliation workflows
- **Enable ISV/partner applications** to surface identity resolution job health and governance data natively

### 2.1 Capabilities

The API should support the following use cases:

| Capability | Description |
|---|---|
| **Retrieve job history** | Paginated list of jobs for a ruleset, with date-range filtering. Returns the same data visible in the Job History table. |
| **Retrieve single job detail** | Full detail for an individual job run. |
| **Retrieve ruleset change log** | Configuration change history with timestamps, who made each change, and what changed. |
| **Retrieve summary stats** | The at-a-glance KPIs displayed in the summary stats bar (processed records, recent job count, schedule status, change count). |

### 2.2 Expectations

- Access must be governed by appropriate Data Cloud permissions.
- Responses should follow standard Salesforce API conventions, including pagination.
- Date-range filtering should be supported for job history queries.
- The API should surface both individual and aggregated job entries, consistent with the UI behavior.

---

## 3. Current State — Daily Processing Summary

### 3.1 Description

The Daily Processing Summary table aggregates the results of all identity resolution runs from a single calendar date into one row. It provides a high-level view of the ruleset's unification output and processing volumes over time.

A descriptive subtitle reads:
> *"Daily summaries contain the aggregate results of all runs of this ruleset from a single date."*

An indicator also displays whether **Automatic runs** are Enabled or Disabled. Jobs run automatically once per day in batch mode, though they may be skipped if there are no changes to source data, object mappings, or ruleset configurations. On-demand runs (triggered by rule changes) can be executed up to 4 times per 24-hour period per ruleset per data space.

### 3.2 What Customers See Today

| Column | What It Tells the Customer |
|---|---|
| **Date** | Which day's results they are looking at. |
| **Total Source Profiles** | How many individual source records were evaluated. A "source profile" is a person as they exist in one source system (e.g., a Contact from Sales Cloud), including all their related records (emails, phones, addresses, identifiers). Counted as a single profile for both metrics and billing. |
| **Total Unified Profiles** | How many distinct golden profiles exist after matching and merging. This is the primary output — each represents a single real-world person. |
| **Total Known Profiles** | How many unified profiles contain PII (email, phone, name, loyalty ID). Known profiles count toward the org's Data Cloud profile entitlement. |
| **Consolidation Rate** | The percentage of source profiles consolidated into unified profiles. Higher means more aggressive merging; lower means more conservative matching. Typical healthy ranges are 10–30%. Adding more match rules increases the rate; adding more AND criteria within rules decreases it. |
| **Total Unknown** | How many unified profiles were created from non-PII identifiers only (cookies, device IDs). Anonymous profiles do **not** count toward entitlement limits. They transition to Known when PII is later acquired. |
| **Processed Records** | How many source profiles were actively evaluated. **This is the billing meter** — each processed profile consumes 0.1 Data Cloud credits. After the initial full run, only new or changed profiles are processed. A value of 0 means no delta existed. |
| **Aggregate Status** | Whether all runs that day succeeded or any failed. |

---

## 4. 264 Release — Enhanced Processing History

### 4.1 Customer Problems We're Solving

Voice of Customer (VOC) feedback identified three key gaps:

1. **"I can't tell what happened"** — Aggregating all runs into a single daily row hides individual job outcomes. When something goes wrong, customers can't diagnose which run failed, what triggered it, or how long it took.
2. **"I don't know who changed what"** — Identity Resolution is credit-intensive. Administrators have no way to track *who* changed *what* in a ruleset and *when*, making it impossible to understand the impact of configuration changes on costs and match quality.
3. **"I don't have enough context"** — The current table doesn't capture *why* a job ran, *who* initiated it, or *how long* it took — all essential for day-to-day operational monitoring and troubleshooting.

### 4.2 Summary Stats Bar

A new summary stats bar appears above the tables, providing at-a-glance KPIs:

| Stat | What It Tells the Customer |
|---|---|
| **Processed Records (30d)** | Total credit-consuming records over the last 30 days. Clearly labeled as a billing meter so customers can track cost exposure. |
| **Jobs (last 24h)** | How many identity resolution jobs ran recently — helps customers assess system activity. |
| **Schedule** | Whether automatic runs are configured and when they're set to execute, or if scheduling is disabled. |
| **Ruleset Changes** | How many configuration changes have been made — signals governance activity at a glance. |

### 4.3 Job History

The Job History view replaces the Daily Processing Summary with per-job granularity. The design principle is:
- **Large or significant jobs** (full reprocessing, manual runs, runs triggered by ruleset changes) are shown as **individual entries** so customers can inspect each one.
- **Small incremental syncs** (automated delta processing with low record counts) are **grouped by day** to reduce noise and keep the view manageable.
- The **last 24 hours** show full individual detail; older entries group small jobs while still showing large jobs individually.

A subtitle reads:
> *"Large jobs shown individually. Small incremental syncs aggregated daily."*

#### 4.3.1 What Customers See Per Job

| Column | What It Tells the Customer |
|---|---|
| **Status indicator** | At-a-glance job health — green for success, red for failure, amber for warnings, animated for in-progress. |
| **Date / Time** | When the job started. Grouped entries show only the date since they represent multiple runs. |
| **Job ID** | A unique identifier for individual jobs. Grouped entries show a count (e.g., "7 jobs") so customers know how many runs are summarized. |
| **Run Reason** | *Why* this job ran — scheduled, manually triggered, caused by new data, or caused by a ruleset configuration change. This is the most-requested piece of missing context. Ruleset-change-triggered runs are especially important because they cause full reprocessing and significant credit consumption. |
| **User** | *Who* triggered the run — a named user for manual actions, or "Automated Process" for system-initiated jobs. |
| **Duration** | How long the job took. Helps customers spot unexpectedly long runs that may indicate data quality issues. |
| **Records (metered)** | How many source profiles were processed — the per-job billing meter. Annotated as "metered" so customers always know this drives credit consumption. |
| **Status** | The job outcome as a labeled badge — Succeeded, Failed, Warning, or Running. |

#### 4.3.2 Grouped Entries

Grouped entries (representing multiple small syncs in a single day) are visually distinct from individual jobs, so customers can easily tell the difference. They show combined metrics (total duration, total records) across all grouped runs.

### 4.4 Ruleset Change Log

A new **Ruleset Change Log** appears below the Job History, providing a complete audit trail of all configuration changes.

A subtitle reads:
> *"Track what was changed, who made the change, and when."*

#### 4.4.1 What Customers See Per Change

| Column | What It Tells the Customer |
|---|---|
| **Date** | When the change was made. |
| **Change** | A human-readable description of what was modified — e.g., a match rule was edited, a new rule was added, rule priority was reordered, a reconciliation setting was updated, the schedule was changed, or the ruleset was published. |
| **Previous Value** | What the setting was *before* the change. Shows "—" for net-new additions. |
| **New Value** | What the setting is *after* the change. Shows "—" for deletions. |
| **Changed By** | The person who made the change. |

---

## 5. Billing & Credit Consumption

### 5.1 Credit Rate

Identity Resolution uses the **Batch Profile Unification** credit meter:
- **0.1 credits per source profile processed** (100,000 credits per 1,000,000 source profiles)
- At Salesforce's published add-on pricing of $1,000 USD per 100,000 credits, processing 1M source profiles costs approximately $1,000 USD (before any included credit allowances)

### 5.2 What Counts as a Processed Record

A single processed record is one **source profile** — an Individual together with all related records (emails, phones, addresses, identifiers). Even though a source profile may span multiple data model object rows, it is counted as **one** processed record for billing.

### 5.3 When Records Are Processed

| Scenario | Records Processed |
|----------|-------------------|
| Initial ruleset run | All source profiles (full processing) |
| Subsequent daily runs | Only new or modified source profiles (incremental) |
| Ruleset configuration change | All source profiles (triggers full re-evaluation) |
| Record attribute modification | The modified source profile is reprocessed |
| Record deletion | The deleted source profile is counted as processed |
| Consent/suppression change | The affected source profile is reprocessed |

### 5.4 Cascading Re-evaluation

Identity Resolution doesn't just unify new records — it re-evaluates existing profiles that may be affected by newly ingested data. For example, adding 10,000 new records could impact 20,000 existing profiles, resulting in 30,000 processed records and corresponding credit consumption. This cascading effect is a significant cost consideration and is why the "Records (metered)" column may show values higher than expected based on raw data ingestion volumes.

---

## 6. Migration Path

| Aspect | Today | 264 Release |
|---|---|---|
| **Processing History** | Daily Processing Summary (aggregated daily rows) | Job History (per-job rows with daily grouping for small syncs) |
| **Billing meter visibility** | Processed Records column (no visual distinction) | Records (metered) column with summary stats bar showing 30-day total labeled "Billing meter" |
| **Governance** | None | Ruleset Change Log |
| **Operational context** | Date + Status only | Date/Time, Job ID, Run Reason, User, Duration, Status |
| **Default detail tab** | Details | Ruleset Properties |
| **API access** | None | API endpoints for job history, change log, and summary stats |

The Today view (Daily Processing Summary) remains available and unchanged for the current release. The 264 Release view is additive — it does not remove any existing data; it presents the same underlying processing data with greater granularity and adds the new governance view.

---

## 7. References

- [Identity Resolution Ruleset Processing Results](https://help.salesforce.com/s/articleView?id=sf.c360_a_resolution_summary.htm&language=en_US&type=5)
- [View Daily Summary Results for Identity Resolution (Winter '24)](https://help.salesforce.com/s/articleView?id=release-notes.cdp_rn_2024_winter_ir_ruleset_processing_summary.htm&language=en_US&release=246&type=5)
- [Anonymous and Known Profiles in Identity Resolution](https://help.salesforce.com/s/articleView?id=sf.c360_a_identity_resolution_summary_anonymous_vs_known_profiles.htm&language=en_US&type=5)
- [Processing Frequency for Identity Resolution](https://help.salesforce.com/s/articleView?id=data.c360_a_identity_resolution_processing_frequency.htm&language=en_US&type=5)
- [Identity Resolution: Consolidation Rates](https://help.salesforce.com/s/articleView?id=sf.c360_a_resolution_troubleshooting_ci_consolidation_rate.htm&language=en_US&type=5)
- [Troubleshoot Identity Resolution Processing Errors](https://help.salesforce.com/s/articleView?id=data.c360_a_resolution_troubleshooting_ir_errors.htm&language=en_US&type=5)
- [Data Cloud Credit Consumption Insights (Trailhead)](https://trailhead.salesforce.com/content/learn/modules/data-cloud-credit-consumption-quick-look/get-started-with-data-cloud-credit-consumption)
- [Track Known and Anonymous Individual Profiles (Spring '22)](https://help.salesforce.com/s/articleView?id=release-notes.cdp_rn_2024_spring_setup_anonymous_and_known_profiles.htm&language=en_US&release=236&type=5)
