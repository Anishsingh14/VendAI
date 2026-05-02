# Product Requirements Document (PRD)
# AI Smart Vending Machine — Inventory Prediction & Alert System
## FINAL VERSION — Ready for Development

**Document Version:** 2.0 (Final)
**Author:** Anish Singh
**Date:** May 2, 2026
**Status:** Approved for Development

---

## 1. Executive Summary

The AI Smart Vending Machine system is a web-based platform developed by Anish Singh as a college project. It is designed specifically for the vending machine installed on his college campus, which stocks a unique combination of products including sanitary products (sanitary pads, tampons), basic medication and first-aid items, as well as everyday consumables like chocolates, water bottles, biscuits, and soft drinks.

The system helps the college vending machine operator predict product stockouts before they happen. The vendor uploads historical inventory data (CSV/Excel), and the system uses a Random Forest machine learning model to analyze usage patterns — including day-of-week, seasonal, and month-based demand — predict when each product will run out, and send automated email alerts. A color-coded calendar view gives the operator an instant visual of every product's predicted stock health across the current month.

The system is 100% software-based — no IoT hardware or sensors required. It is built entirely on free, open-source tools with zero ongoing cost.

---

## 2. Problem Statement

The college vending machine stocks a sensitive and diverse range of products — including sanitary pads, tampons, basic medications, chocolates, water bottles, and snacks. The operator currently restocks reactively, visiting the machine only after products have run out. This causes particular problems for this specific use case:

- **Critical health products run out at the worst times** — sanitary products and medications are time-sensitive; an empty slot is not just an inconvenience but a genuine welfare issue for students
- **Unpredictable demand patterns** — exam seasons, festivals, and weather changes cause sudden spikes in specific product consumption
- **Lost revenue** from empty product slots across all categories
- **Wasted vendor trips** to machines that are still well-stocked
- **Zero visibility** into which products deplete fastest and at what times of the academic calendar

There is no affordable, hardware-free solution that gives college vending operators AI-powered restocking intelligence tailored to this mixed product range.

---

## 3. Goals & Objectives

### Primary Goals
- Allow vendors to upload historical CSV/Excel inventory data
- Train a Random Forest model on that data to predict per-product stockout dates
- Display predictions as a color-coded calendar per product per machine
- Send automated email alerts at two threshold points (yellow and red/black)

### Secondary Goals
- Provide consumption insights per machine (top/bottom sellers, seasonal patterns)
- Allow vendors to manage machines and product lists dynamically
- Support vendors with no existing data via a cold start onboarding flow

### Out of Scope (v1.0)
- IoT sensor or hardware integration
- Mobile application
- WhatsApp/SMS alerts
- Payment processing or transaction tracking
- Recommended restock quantities in alerts
- Alert unsubscribe or snooze functionality

---

## 4. Target Users

| User Type | Description | Primary Need |
|-----------|-------------|--------------|
| College Vending Operator (Primary) | Person managing the college campus vending machine | Know when to restock health, sanitary, and consumable products before they run out |
| College Administration (Secondary) | Institution overseeing campus welfare facilities | Ensure critical student welfare products (sanitary items, medications) are always available |

---

## 5. Tech Stack (Zero Cost)

| Layer | Technology |
|-------|-----------|
| Frontend | Google Stitch (UI builder) |
| Backend | Python 3.10+ with Flask |
| ML Model | scikit-learn RandomForestRegressor |
| Data Processing | pandas, numpy |
| Database | Supabase (PostgreSQL, free tier) |
| File Storage | Supabase Storage Buckets |
| Authentication | Supabase Auth (email + password) |
| Email Alerts | Gmail SMTP via Python smtplib |
| Deployment | PythonAnywhere (free tier) |
| Version Control | GitHub |
| Scheduling | PythonAnywhere Task Scheduler |

---

## 6. User Stories

### Authentication & Profile
- As a new vendor, I want to sign up with my name, city, email, and password so I can access the platform.
- As a returning vendor, I want to log in with my email and password.
- As a vendor who forgot their password, I want a reset link sent to my email.
- As a vendor, I want a profile page showing my name and active alert email.
- As a vendor, I want to change my alert email (with verification) so alerts go to my new address.
- As a vendor, I want a "Test Alert" button to send a sample email to verify delivery is working.

### Machine Management
- As a vendor, I want to add vending machines by providing a name and location.
- As a vendor, I want to upload a CSV file for each machine so the system can learn my inventory patterns.
- As a vendor with no historical data, I want a manual entry form to set up basic product information.
- As a vendor, I want the system to auto-detect all products from my uploaded CSV.
- As a vendor, I want to add, deactivate, or restore products in my machine's product list at any time.
- As a vendor, I want all product changes logged so I have a full audit history.

### Predictions & Calendar
- As a vendor, I want to click on any machine and see all its products listed.
- As a vendor, I want to click on a product and see a color-coded calendar showing predicted stock levels for the current month.
- As a vendor, I want to receive an email alert when a product is predicted to reach 50% depletion (yellow threshold).
- As a vendor, I want to receive an email alert when a product is predicted to reach 80%+ depletion or full stockout (red/black threshold).
- As a vendor, I want to see a confidence badge on the calendar so I know how reliable the predictions are.

### Insights
- As a vendor, I want to see which products sell the most and least in each machine.
- As a vendor, I want to see seasonal consumption patterns highlighted (e.g., "Water sells 40% more in summer").

---

## 7. Functional Requirements

### 7.1 Authentication Module
- **FR-01:** System shall provide Sign Up with fields: name, city, email, password, T&C checkbox
- **FR-02:** System shall provide Login with email and password
- **FR-03:** System shall provide Forgot Password with reset link sent to vendor email
- **FR-04:** System shall isolate all vendor data by vendor_id using Supabase Row Level Security
- **FR-05:** Profile page shall display vendor name and active alert email
- **FR-06:** Vendor shall be able to update alert email; new email must be verified before becoming active
- **FR-07:** Profile page shall include a "Send Test Alert" button that dispatches a sample email immediately

### 7.2 Machine Management Module
- **FR-08:** Vendor shall be able to add a machine with a name and location (both strings)
- **FR-09:** Vendor shall be able to upload a CSV or XLSX file per machine, or one combined multi-machine file
- **FR-10:** If a combined CSV is uploaded, system shall auto-split by machine_id column and process each machine separately
- **FR-11:** If no machine_id column exists in CSV, system shall prompt vendor to select which machine the file belongs to
- **FR-12:** System shall display a Column Mapper UI after upload if column names do not exactly match the required schema
- **FR-13:** System shall auto-repair data: derive missing fields where possible, forward-fill date gaps, ignore extra columns
- **FR-14:** System shall display a Data Health Report after every upload (rows loaded, issues fixed, issues flagged)
- **FR-15:** System shall use upsert logic to prevent duplicate rows on re-upload of same file
- **FR-16:** System shall auto-detect all unique product names from uploaded CSV and display them as an editable list
- **FR-17:** Vendor shall be able to add new products, deactivate existing products, and restore previously archived products
- **FR-18:** System shall log all product changes (add/deactivate/restore) with timestamps in product_change_log table
- **FR-19:** No product data shall ever be hard-deleted; all removals set status to 'inactive'
- **FR-20:** System shall prompt vendor to upload fresh data if no new data has been uploaded in 30 days
- **FR-21:** System shall pause alerts and notify vendor if no data uploaded in 45 days

### 7.3 Cold Start Module
- **FR-22:** If vendor has fewer than 14 days of data for a product, system shall use moving average fallback instead of RF model
- **FR-23:** If vendor has zero data, system shall show a manual Quick Setup Form asking: product name, current stock, estimated daily sales
- **FR-24:** Dashboard shall display a Data Confidence indicator per product: Low / Building / Strong

### 7.4 ML Prediction Module
- **FR-25:** System shall train a Random Forest model per product per machine
- **FR-26:** Model shall be triggered automatically on every new CSV upload
- **FR-27:** System shall run a nightly scheduled prediction task for all vendors at 11:00 PM
- **FR-28:** Model features shall include: day_of_week, month, week_of_year, is_weekend, rolling_7d_avg, rolling_7d_std, lag_1, lag_7, days_since_restock
- **FR-29:** Seasonal intelligence shall be derived from the month feature: Jan–Feb=winter, Mar–May=summer, Jun–Sep=monsoon, Oct–Dec=festive (no external weather API required)
- **FR-30:** Model shall be automatically retrained each time new data is uploaded for that machine+product
- **FR-31:** System shall track prediction accuracy: store predicted_stockout_date vs actual_restock_date delta per product

### 7.5 Calendar View Module
- **FR-32:** Clicking a product shall open a calendar view showing current month's predicted stock level per day
- **FR-33:** Calendar days shall be color-coded as follows:
  - Green: Stock > 50% of capacity
  - Yellow: Stock at ~50% (half depleted)
  - Red: Stock > 80% depleted
  - Black: Complete stockout predicted
- **FR-34:** Calendar shall display a confidence badge in the header:
  - Blue (High): Days 1–14 — daily color coding
  - Yellow (Medium): Days 15–30 — weekly average color
  - Grey (None): Day 31+ — grayed out with message "Upload fresh data for extended predictions"
- **FR-35:** System shall fire Alert 1 (Yellow) email on the first predicted yellow day
- **FR-36:** System shall fire Alert 2 (Red/Black) email on the first predicted red or black day
- **FR-36a:** Products tagged as **Priority Products** (sanitary items, medications) shall escalate directly to CRITICAL alert when yellow threshold is reached — not WARNING
- **FR-36b:** Vendor shall be able to tag any product as a Priority Product during machine setup or product list editing
- **FR-37:** Alert emails shall not repeat for the same product/machine within 24 hours

### 7.6 Alert Email Module
- **FR-38:** Alerts shall be sent via Gmail SMTP using Python smtplib to vendor's active alert email
- **FR-39:** Alert email subject: `[ALERT] {Level} Stock Warning — {Product} at {Machine Location}`
- **FR-40:** Alert email body shall include: machine name, location, product name, current stock remaining, predicted stockout date, color status level
- **FR-41:** Alert 1 subject prefix: `[WARNING]` | Alert 2 subject prefix: `[CRITICAL]`
- **FR-42:** Immediate CRITICAL alert shall fire if stock_remaining = 0 on any upload
- **FR-43:** Test Alert shall send a clearly labelled sample alert email with placeholder data

### 7.7 Insights Panel Module
- **FR-44:** Dashboard shall show per-machine insights: top 3 most selling products, top 3 least selling products
- **FR-45:** System shall surface seasonal pattern insights where detected (e.g., "Mineral Water sells 40% more in March–May")
- **FR-46:** Insights shall update automatically when new CSV data is uploaded

---

## 8. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | CSV processing and prediction must complete within 30 seconds for files up to 10,000 rows |
| Reliability | Email alerts delivered within 5 minutes of threshold detection |
| Security | All vendor data isolated via Supabase RLS; passwords hashed via Supabase Auth |
| Scalability | Support up to 50 machines and 500 products per vendor in v1 |
| Usability | Vendor onboarding (signup → first prediction) completable in under 15 minutes |
| Availability | PythonAnywhere free tier uptime (~99%) |
| Cost | Zero cost for all tools and hosting |

---

## 9. Required CSV Schema

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| date | Date | Yes | YYYY-MM-DD preferred; auto-parsed in other formats |
| machine_id | String | Conditional | Required for multi-machine CSVs |
| location | String | No | Auto-populated from machine profile if missing |
| product_name | String | Yes | Must be consistent spelling across rows |
| stock_added | Integer | Yes | 0 if no restock that day |
| units_consumed | Integer | Yes | Auto-derived if missing: prev_stock + added - remaining |
| stock_remaining | Integer | Yes | End-of-day stock count |
| day_of_week | String | No | Auto-derived |
| month | String | No | Auto-derived |
| notes | String | No | Optional vendor annotations |

### Sample Product Categories for This Project

| Category | Example Products |
|----------|-----------------|
| Sanitary & Hygiene | Sanitary pads (various sizes), tampons, panty liners |
| Medication & First Aid | Paracetamol strips, antacid tablets, bandages, pain relief |
| Beverages | Mineral water 500ml, Pepsi, Sprite, Maaza, Thums Up |
| Snacks & Food | Lays chips, KitKat, Dairy Milk, Parle-G, Oreo, Kurkure |
| Other | Hand sanitizer, tissues, energy bars |

> **Note:** Sanitary products and medications should be flagged as **Priority Products** in the system. When these products hit the Yellow threshold, the alert urgency is automatically elevated to CRITICAL regardless of days until stockout — because running out of these items has immediate welfare consequences for students.

---

## 10. Alert Email Specification

**Alert 1 — Yellow (Warning)**
- Subject: `[WARNING] Half Stock Alert — {Product} at {Location}`
- Trigger: First calendar day predicted to be Yellow
- Body: Machine, location, product, current stock, predicted date stock hits 50%

**Alert 2 — Red/Black (Critical)**
- Subject: `[CRITICAL] Stock Almost Over — {Product} at {Location}`
- Trigger: First calendar day predicted to be Red or Black
- Body: Machine, location, product, current stock, predicted stockout date

**Alert 3 — Immediate (Zero Stock)**
- Subject: `[URGENT] Stock Empty — {Product} at {Location}`
- Trigger: stock_remaining = 0 detected on any upload
- Body: Machine, location, product, stock = 0, immediate restock required

---

## 11. UI Flow Summary

1. **Landing:** Sign Up / Login buttons
2. **Sign Up:** Name, City, Email, Password, T&C checkbox → Email verification
3. **Login:** Email + Password | Forgot Password link
4. **Dashboard:** Header (Branding | Hi, [Name]) → Machine list with Add Machine button
5. **Add Machine:** Name + Location → CSV Upload or Cold Start Form → Auto product detection → Editable product list → Confirm
6. **Machine View:** Click machine → All products listed with stock status indicators
7. **Product View:** Click product → Color-coded calendar + Confidence badge
8. **Insights Panel:** Per machine — top sellers, bottom sellers, seasonal highlights
9. **Profile Page:** Name, active alert email, Change Email button, Send Test Alert button

---

## 12. Success Metrics

| Metric | Target |
|--------|--------|
| Stockout prediction accuracy (within ±2 days) | ≥ 80% |
| Alert delivery success rate | ≥ 99% |
| False positive alert rate | ≤ 10% |
| Cold start → first prediction time | < 15 minutes |
| CSV upload → prediction display time | < 30 seconds |

---

## 13. Milestones

| Phase | Deliverable | Duration |
|-------|-------------|----------|
| Phase 1 | Auth system + vendor profile + machine management UI | Week 1–2 |
| Phase 2 | CSV upload + column mapper + data repair + health report | Week 3–4 |
| Phase 3 | Feature engineering + Random Forest model + cold start fallback | Week 5–6 |
| Phase 4 | Calendar view + confidence badge + alert engine | Week 7–8 |
| Phase 5 | Email alert system + test alert + insights panel | Week 9–10 |
| Phase 6 | Integration testing + deployment on PythonAnywhere | Week 11–12 |

---

## 14. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Vendor uploads inconsistent data | High | High | Column mapper + auto-repair + data health report |
| Insufficient data for new products | High | Medium | Cold start 3-tier fallback |
| Stale model after seasonal shift | Medium | Medium | 30-day re-upload prompt + auto-retrain on upload |
| Gmail SMTP blocked as spam | Medium | High | Use verified sender, HTML formatting, real subject lines |
| Model overfits small dataset | Medium | Medium | max_depth≤10, min_samples_leaf≥3, cross-validation |
| Duplicate CSV uploads | Low | High | Upsert logic on all inserts |

