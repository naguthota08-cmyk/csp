# 🐔 Smart Poultry Farm — IoT & AI Precision Management Platform

An intelligent, full-stack poultry farm management system equipped with **IoT telemetry sensors**, **automated environmental alerts**, **AI/ML disease risk & feed prediction**, **bilingual localization (English + Telugu తెలుగు)**, and **role-based access control** (Farmer, Veterinarian, Admin).

> [!IMPORTANT]
> **Clean User Usage (Zero Pre-Filled Dummy Data)**: The database is initialized with empty, production-ready schemas. No mock or fake flock/farm records are pre-populated. Every farmer, veterinarian, and administrator registers their own account and enters their actual farm data through intuitive, mobile-optimized interfaces.

---

## 🌟 Key Modules & Architectural Highlights

### 1. 👤 User Authentication & Roles (`database.py`, `app.py`)
- **Farmer Role**: Register multiple farms, add sheds, create flock batches, log daily operations (feed, water, eggs, mortality, weight), monitor IoT sensors, run AI disease risk checks, and request veterinary advice.
- **Veterinarian Role**: Access assigned farms, review health logs and reported symptoms, prescribe medications and dosages, and issue clinical management guidance.
- **Admin Role**: Platform-wide metrics, total registered farmers/vets, aggregate bird census, and system-wide sensor alert logs.
- **Bilingual Interface**: Seamless toggle between **English** and **Telugu (తెలుగు)** with full vernacular terminology (e.g. *ఉష్ణోగ్రత, మేత, నీరు, మరణాలు, టీకాలు*).

### 2. 🏠 Precision Farm Dashboard
- Real-time KPI summary cards:
  - 🐔 **Live Birds** (Calculated live count deducting mortality)
  - 🥚 **Eggs Today** (Collected count for layer farms)
  - 🌾 **Feed Today** (kg)
  - 💧 **Water Today** (Liters)
  - 🌡️ **Temperature & Humidity** (Live IoT sensor telemetry)
  - 💀 **Mortality Today & FCR** (Feed Conversion Ratio)
- Automatic alerts banner displaying threshold alarms with one-click dismissal.

### 3. 🐥 Flock (Batch) Lifecycle Tracking
- Create batches with Batch ID (e.g., `BATCH-2026-01`), Breed (*Broiler, Layer, Country/Desi, Cobb 500, Ross 308*), starting quantity, arrival date, target market weight, and assigned shed.
- Automatic **Bird Age calculation** based on arrival date.
- Real-time mortality reconciliation and batch status progression (*Active ➔ Sold ➔ Closed*).

### 4. 🌡️ Smart Shed IoT Telemetry & Threshold Alerts
- Hardware REST API endpoint: `POST /api/iot/telemetry` for ESP32 / Arduino / Raspberry Pi sensors.
- **Automated Alert Rules**:
  - 🔴 **High Temperature**: Triggered when temperature reaches $\ge 34^\circ\text{C}$ (Alerts in EN and TE to activate cooling pads).
  - 🟠 **Low Water Tank**: Triggered when water level drops $\le 20\%$.
  - 🟡 **Low Feed Hopper**: Triggered when feeder level drops $\le 15\%$.
  - ☣️ **Hazardous Ammonia (NH3)**: Triggered when gas exceeds $\ge 25\text{ ppm}$.
  - 💀 **Spike Mortality**: Triggered upon abnormal daily mortality.
- Built-in **IoT Telemetry Simulator** in the web app to test sensor scenarios without physical hardware.

### 5. 🤖 AI / ML Decision Support Engine (`ai_engine.py`)
- **Disease Risk Prediction**: Evaluates bird age, temperature, humidity, ammonia levels, feed drop percentage, and clinical symptom keywords (*coughing, rattling, white diarrhea, lethargy, leg weakness*).
- Outputs risk classification (**LOW / MEDIUM / HIGH / CRITICAL**), probable conditions (*Infectious Bronchitis, CRD, Heat Stress, Coccidiosis*), and actionable recommendations in both English and Telugu.
- **Feed Requirement Estimator**: Calculates estimated daily and 7-day feed requirement based on bird age, count, and breed standard curves.
- **FCR Calculator**: $\text{FCR} = \frac{\text{Total Feed Consumed (kg)}}{\text{Total Live Weight (kg)}}$.

### 6. 💉 Vaccination & Health Schedule
- Schedule vaccinations with due dates, dose types (*Eye Drop, Drinking Water, Subcutaneous Injection*), and status (*Scheduled, Completed*).
- Built-in broiler and layer vaccination guidelines (Marek's, Newcastle F1/Lasota, Gumboro IBD).

### 7. 💰 Financial Management (Expenses & Sales)
- Categorized expense entries: Chicks, Feed, Medicines, Vaccines, Electricity, Water, Labour, Transport.
- Sales tracker: Bird sale (birds count, total weight, price/kg), egg sales, and manure sales.
- Real-time calculation of **Total Investment**, **Gross Revenue**, and **Net Profit/Loss**.

### 8. 📊 Visual Analytics & Reports
- Interactive **Chart.js** data visualizations:
  - Daily Feed & Water consumption trend lines.
  - Daily bird mortality bar chart.
  - Financial cash flow comparison.

---

## 🚀 Getting Started

### 1. Requirements
- Python 3.8+ (Python 3.11 tested)
- Flask >= 3.0.0
- Werkzeug >= 3.0.0

### 2. Quick Start
Double-click `start.bat` or run:
```bash
# Initialize clean database (empty for user usage)
python database.py

# Start application server
python app.py
```
Open your browser at: **`http://localhost:5000`**

### 3. Running Automated Tests
```bash
python test_poultry.py
```

### 4. Simulating IoT Telemetry
To test automated sensor alerts with the included ESP32 simulator:
```bash
# Send normal readings
python iot_simulator.py 1

# Trigger High Temperature Alert (35.5°C)
python iot_simulator.py 2

# Trigger Low Water Tank Alert (14%)
python iot_simulator.py 3

# Trigger Hazardous Ammonia Gas (29 ppm)
python iot_simulator.py 4
```

---

## 📱 Mobile App REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new Farmer, Veterinarian, or Admin |
| `POST` | `/api/auth/login` | Authenticate with mobile/email + password |
| `GET` | `/api/auth/me` | Fetch active user profile and language |
| `POST` | `/api/farms/create` | Register new farm and default shed |
| `POST` | `/api/sheds/create` | Add additional sheds to a farm |
| `POST` | `/api/flocks/create` | Create a new flock / bird batch |
| `POST` | `/api/logs/daily` | Log daily feed, water, mortality, and eggs |
| `POST` | `/api/logs/weight` | Log bird sample weights |
| `POST` | `/api/iot/telemetry` | Ingest live sensor telemetry from ESP32 |
| `POST` | `/api/vaccinations/create` | Schedule flock vaccination |
| `POST` | `/api/finances/create` | Record farm expense or sale transaction |
| `POST` | `/api/ai/disease-risk` | Calculate disease risk score and recommendations |
| `POST` | `/api/ai/feed-estimate` | Predict daily feed requirements |
| `GET` | `/api/analytics/charts/<id>` | Fetch chart datasets for feed, water, and mortality |

---

## 🌐 Bilingual Support (English / Telugu)
Every user can toggle their language preference instantly via the top navigation bar or their profile settings:
- **English**: Standard terminology for commercial poultry management.
- **తెలుగు (Telugu)**: Farmer-friendly vernacular translations for all dashboard cards, alerts, and operational forms.
