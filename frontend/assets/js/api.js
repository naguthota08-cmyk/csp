/**
 * SMART POULTRY HEALTH MONITORING & DISEASE-RISK PREDICTION SYSTEM
 * Data Persistence & Mock REST API Service (api.js)
 * Clean user-entry format with dynamic state calculations and LocalStorage CRUD
 */

const STORAGE_KEYS = {
  FARMS: 'smart_poultry_farms',
  BATCHES: 'smart_poultry_batches',
  CONDITIONS: 'smart_poultry_conditions',
  PREDICTIONS: 'smart_poultry_predictions',
  ALERTS: 'smart_poultry_alerts',
  VACCINATIONS: 'smart_poultry_vaccinations',
  CURRENT_FARM: 'smart_poultry_selected_farm',
  USER_PROFILE: 'smart_poultry_user',
  EGGS: 'smart_poultry_eggs',
  MARKET: 'smart_poultry_market_listings',
  HYGIENE: 'smart_poultry_hygiene_audits',
  GEO_STRUCTURE: 'smart_poultry_farm_geo',
  SCAN_HISTORY: 'smart_poultry_scan_history',
  INITIALIZED: 'smart_poultry_initialized_v2'
};

// Initial Seed Data (Available if user clicks "Load Sample Demo Data")
const SAMPLE_DEMO_DATA = {
  farms: [
    {
      id: 'F-001',
      name: 'GreenValley Broiler Farm',
      location: 'Punjab Agro Zone, Block 4',
      birdType: 'Broiler (Cobb 500)',
      capacity: 6000,
      currentBirds: 5000,
      farmSize: '3.5 Acres (4 Sheds)',
      establishedDate: '2025-04-15',
      healthScore: 82,
      riskLevel: 'Medium',
      mortalityRate: 1.2
    }
  ],
  batches: [
    {
      id: 'B-101',
      farmId: 'F-001',
      name: 'Batch B-101 (Shed 1)',
      birdType: 'Broiler (Cobb 500)',
      birdCount: 2500,
      ageDays: 28,
      startDate: '2026-08-03',
      healthStatus: 'Good',
      riskLevel: 'Low',
      avgWeightKg: 1.45,
      dailyFeedKg: 220,
      dailyWaterL: 420,
      mortalityCount: 2
    },
    {
      id: 'B-102',
      farmId: 'F-001',
      name: 'Batch B-102 (Shed 2)',
      birdType: 'Broiler (Ross 308)',
      birdCount: 2500,
      ageDays: 31,
      startDate: '2026-07-31',
      healthStatus: 'Monitor',
      riskLevel: 'Medium',
      avgWeightKg: 1.68,
      dailyFeedKg: 230,
      dailyWaterL: 430,
      mortalityCount: 5
    }
  ],
  alerts: [
    {
      id: 'ALT-101',
      farmId: 'F-001',
      batchId: 'B-102',
      batchName: 'Batch B-102 (Shed 2)',
      severity: 'Critical',
      title: 'High Mortality & Lethargy Detected',
      description: 'Recorded 5 bird mortalities with lethargy signs in 24 hours. Immediate isolation recommended.',
      timestamp: 'Today, 08:30 AM',
      isRead: false
    }
  ],
  vaccinations: [
    {
      id: 'VAC-001',
      batchId: 'B-101',
      batchName: 'Batch B-101 (Shed 1)',
      vaccineName: 'Newcastle Disease (ND Lasota)',
      route: 'Drinking Water',
      dateGiven: '2026-08-10',
      nextDueDate: '2026-09-02',
      status: 'Upcoming',
      notes: 'Ensure clean chlorine-free water with skimmed milk stabilizer'
    }
  ],
  predictions: [],
  user: {
    fullName: 'Robert Sterling',
    email: 'farmer@poultrysmart.com',
    phone: '+1 (555) 234-8901',
    farmName: 'My Poultry Farm',
    location: 'Punjab Agro Zone',
    role: 'Farm Owner & Operator',
    memberSince: 'August 2026'
  }
};

// Initialize Storage: Starts with Clean Empty State by default so user can add fresh data
function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
    // Start clean with empty collections
    localStorage.setItem(STORAGE_KEYS.FARMS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CONDITIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.VACCINATIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify({
      fullName: 'Farmer User',
      email: 'farmer@poultrysmart.com',
      phone: '+1 (555) 000-0000',
      farmName: 'My Poultry Farm',
      location: 'Main Location',
      role: 'Farm Operator',
      memberSince: 'August 2026'
    }));
    localStorage.setItem(STORAGE_KEYS.CURRENT_FARM, '');
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }
}

// Run init
initializeStorage();

const API_BASE_URL = window.location.protocol.startsWith('http') ? '' : 'http://127.0.0.1:5000';

function getAuthHeaders() {
  const token = localStorage.getItem('smart_poultry_jwt_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  return headers;
}

// Mock API Object
const MockAPI = {
  delay: (ms = 150) => new Promise(resolve => setTimeout(resolve, ms)),

  // --- RESET & DEMO ACTIONS ---
  clearAllUserData() {
    localStorage.setItem(STORAGE_KEYS.FARMS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CONDITIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.VACCINATIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SCAN_HISTORY, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CURRENT_FARM, '');
  },

  loadSampleDemoData() {
    localStorage.setItem(STORAGE_KEYS.FARMS, JSON.stringify(SAMPLE_DEMO_DATA.farms));
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(SAMPLE_DEMO_DATA.batches));
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(SAMPLE_DEMO_DATA.alerts));
    localStorage.setItem(STORAGE_KEYS.VACCINATIONS, JSON.stringify(SAMPLE_DEMO_DATA.vaccinations));
    localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(SAMPLE_DEMO_DATA.predictions));
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(SAMPLE_DEMO_DATA.user));
    localStorage.setItem(STORAGE_KEYS.CURRENT_FARM, 'F-001');
  },

  // --- DYNAMIC DASHBOARD SUMMARY ---
  async getDashboardSummary() {
    await this.delay(50);
    const farms = await this.getFarms();
    const batches = await this.getBatches();
    const alerts = await this.getAlerts();

    const totalBirds = batches.reduce((sum, b) => sum + (parseInt(b.birdCount) || 0), 0);
    const totalDailyFeed = batches.reduce((sum, b) => sum + (parseFloat(b.dailyFeedKg) || 0), 0);
    const totalDailyWater = batches.reduce((sum, b) => sum + (parseFloat(b.dailyWaterL) || 0), 0);
    const totalMortality = batches.reduce((sum, b) => sum + (parseInt(b.mortalityCount) || 0), 0);

    const mortalityRate = totalBirds > 0 ? ((totalMortality / totalBirds) * 100).toFixed(2) : '0.00';

    // Calculate health score & risk based on batches
    let healthScore = 100;
    let riskLevel = 'Low';

    if (batches.length === 0) {
      healthScore = 100;
      riskLevel = 'Low';
    } else {
      const hasHighRisk = batches.some(b => b.riskLevel === 'High');
      const hasMedRisk = batches.some(b => b.riskLevel === 'Medium');

      if (hasHighRisk) {
        healthScore = 65;
        riskLevel = 'High';
      } else if (hasMedRisk) {
        healthScore = 78;
        riskLevel = 'Medium';
      } else {
        healthScore = 95;
        riskLevel = 'Low';
      }
    }

    return {
      farmsCount: farms.length,
      activeBatchesCount: batches.length,
      totalBirds,
      totalDailyFeed,
      totalDailyWater,
      totalMortality,
      mortalityRate,
      healthScore,
      riskLevel,
      alertsCount: alerts.filter(a => !a.isRead).length
    };
  },

  // --- FARMS API ---
  async getFarms() {
    await this.delay(50);
    const token = localStorage.getItem('smart_poultry_jwt_token');
    if (token) {
      try {
        const res = await fetch(API_BASE_URL + '/api/farms', { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && Array.isArray(data.farms)) {
            const mappedFarms = data.farms.map(f => ({
              id: String(f.id),
              name: f.farm_name,
              location: f.location || 'Agro Zone',
              birdType: f.farm_type || 'Broiler',
              capacity: f.total_capacity || 5000,
              currentBirds: 0,
              farmSize: f.address || 'Main Facility',
              establishedDate: (f.created_at || '').split('T')[0],
              healthScore: 95,
              riskLevel: 'Low',
              mortalityRate: 0.0
            }));
            localStorage.setItem(STORAGE_KEYS.FARMS, JSON.stringify(mappedFarms));
            return mappedFarms;
          }
        }
      } catch (err) {
        console.warn('Network call /api/farms failed, falling back to local cache', err);
      }
    }
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.FARMS) || '[]');
  },

  async getFarmById(id) {
    const farms = await this.getFarms();
    return farms.find(f => f.id === id) || null;
  },

  async addFarm(farmData) {
    await this.delay(100);
    const token = localStorage.getItem('smart_poultry_jwt_token');
    if (token) {
      try {
        const res = await fetch(API_BASE_URL + '/api/farms/create', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            farm_name: farmData.name,
            location: farmData.location,
            farm_type: farmData.birdType || 'Broiler',
            total_capacity: parseInt(farmData.capacity) || 5000
          })
        });
        if (res.ok) {
          const result = await res.json();
          const serverFarm = result.farm || {};
          const newFarm = {
            id: String(serverFarm.id || Date.now()),
            name: serverFarm.farm_name || farmData.name,
            location: serverFarm.location || farmData.location,
            birdType: serverFarm.farm_type || farmData.birdType || 'Broiler',
            capacity: serverFarm.total_capacity || farmData.capacity || 5000,
            currentBirds: 0,
            farmSize: farmData.farmSize || 'Main Facility',
            establishedDate: new Date().toISOString().split('T')[0],
            healthScore: 95,
            riskLevel: 'Low',
            mortalityRate: 0.0,
            activeBatchesCount: 0
          };
          const farms = JSON.parse(localStorage.getItem(STORAGE_KEYS.FARMS) || '[]');
          farms.unshift(newFarm);
          localStorage.setItem(STORAGE_KEYS.FARMS, JSON.stringify(farms));
          if (!this.getSelectedFarmId()) {
            this.setSelectedFarmId(newFarm.id);
          }
          return newFarm;
        }
      } catch (err) {
        console.warn('Network call /api/farms/create failed, falling back to local', err);
      }
    }
    const farms = await this.getFarms();
    const newFarm = {
      id: 'F-' + String(farms.length + 1).padStart(3, '0'),
      healthScore: 95,
      riskLevel: 'Low',
      mortalityRate: 0.0,
      activeBatchesCount: 0,
      ...farmData
    };
    farms.unshift(newFarm);
    localStorage.setItem(STORAGE_KEYS.FARMS, JSON.stringify(farms));
    if (!this.getSelectedFarmId()) {
      this.setSelectedFarmId(newFarm.id);
    }
    return newFarm;
  },

  async updateFarm(id, updatedData) {
    await this.delay(100);
    let farms = await this.getFarms();
    farms = farms.map(f => f.id === id ? { ...f, ...updatedData } : f);
    localStorage.setItem(STORAGE_KEYS.FARMS, JSON.stringify(farms));
    return farms.find(f => f.id === id);
  },

  async deleteFarm(id) {
    await this.delay(100);
    let farms = await this.getFarms();
    farms = farms.filter(f => f.id !== id);
    localStorage.setItem(STORAGE_KEYS.FARMS, JSON.stringify(farms));
    // Also remove associated batches
    let batches = await this.getBatches();
    batches = batches.filter(b => b.farmId !== id);
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
    return { success: true };
  },

  // --- BATCHES API ---
  async getBatches(farmId = null) {
    await this.delay(50);
    const token = localStorage.getItem('smart_poultry_jwt_token');
    if (token) {
      try {
        const url = farmId ? `/api/flocks?farm_id=${farmId}` : '/api/flocks';
        const res = await fetch(API_BASE_URL + url, { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && Array.isArray(data.flocks)) {
            const mappedBatches = data.flocks.map(f => ({
              id: String(f.id),
              farmId: String(f.farm_id),
              name: f.batch_number || ('Batch ' + f.id),
              birdType: f.bird_type || 'Broiler',
              birdCount: f.current_bird_count || f.initial_bird_count,
              initialBirdCount: f.initial_bird_count,
              startDate: f.arrival_date,
              healthStatus: f.status === 'active' ? 'Good' : f.status,
              riskLevel: 'Low',
              avgWeightKg: parseFloat(f.target_weight_kg) || 1.5,
              dailyFeedKg: Math.round((f.current_bird_count || 1000) * 0.08),
              dailyWaterL: Math.round((f.current_bird_count || 1000) * 0.16),
              mortalityCount: 0
            }));
            localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(mappedBatches));
            if (farmId) {
              return mappedBatches.filter(b => b.farmId === String(farmId));
            }
            return mappedBatches;
          }
        }
      } catch (err) {
        console.warn('Network call /api/flocks failed, falling back to local cache', err);
      }
    }
    const batches = JSON.parse(localStorage.getItem(STORAGE_KEYS.BATCHES) || '[]');
    if (farmId) {
      return batches.filter(b => b.farmId === farmId);
    }
    return batches;
  },

  async addBatch(batchData) {
    await this.delay(100);
    const token = localStorage.getItem('smart_poultry_jwt_token');
    if (token) {
      try {
        const res = await fetch(API_BASE_URL + '/api/flocks/create', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            farm_id: parseInt(batchData.farmId) || 1,
            batch_number: batchData.name || ('Batch-' + Date.now().toString().slice(-4)),
            bird_type: batchData.birdType || 'Broiler',
            breed: batchData.breed || 'Cobb 500',
            initial_bird_count: parseInt(batchData.birdCount) || 1000,
            arrival_date: batchData.startDate || new Date().toISOString().split('T')[0],
            target_weight_kg: parseFloat(batchData.avgWeightKg) || 2.0
          })
        });
        if (res.ok) {
          const result = await res.json();
          const serverFlock = result.flock || {};
          const newBatch = {
            id: String(serverFlock.id || Date.now()),
            farmId: String(serverFlock.farm_id || batchData.farmId),
            name: serverFlock.batch_number || batchData.name,
            birdType: serverFlock.bird_type || batchData.birdType || 'Broiler',
            birdCount: serverFlock.current_bird_count || batchData.birdCount,
            healthStatus: 'Good',
            riskLevel: 'Low',
            avgWeightKg: parseFloat(batchData.avgWeightKg) || 0.45,
            dailyFeedKg: parseFloat(batchData.dailyFeedKg) || Math.round((parseInt(batchData.birdCount) || 1000) * 0.08),
            dailyWaterL: parseFloat(batchData.dailyWaterL) || Math.round((parseInt(batchData.birdCount) || 1000) * 0.16),
            mortalityCount: 0,
            ...batchData
          };
          const batches = JSON.parse(localStorage.getItem(STORAGE_KEYS.BATCHES) || '[]');
          batches.unshift(newBatch);
          localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
          return newBatch;
        }
      } catch (err) {
        console.warn('Network call /api/flocks/create failed, falling back to local', err);
      }
    }
    const batches = await this.getBatches();
    const newBatch = {
      id: 'B-' + Math.floor(100 + Math.random() * 900),
      healthStatus: batchData.healthStatus || 'Good',
      riskLevel: 'Low',
      avgWeightKg: parseFloat(batchData.avgWeightKg) || 0.45,
      dailyFeedKg: parseFloat(batchData.dailyFeedKg) || Math.round((parseInt(batchData.birdCount) || 1000) * 0.08),
      dailyWaterL: parseFloat(batchData.dailyWaterL) || Math.round((parseInt(batchData.birdCount) || 1000) * 0.16),
      mortalityCount: 0,
      ...batchData
    };
    batches.unshift(newBatch);
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
    return newBatch;
  },

  async updateBatch(id, updatedData) {
    await this.delay(100);
    let batches = await this.getBatches();
    batches = batches.map(b => b.id === id ? { ...b, ...updatedData } : b);
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
    return batches.find(b => b.id === id);
  },

  async deleteBatch(id) {
    await this.delay(100);
    let batches = await this.getBatches();
    batches = batches.filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
    return { success: true };
  },

  // --- CONDITIONS API ---
  async getConditions(batchId = null) {
    await this.delay(50);
    const conds = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONDITIONS) || '[]');
    if (batchId) {
      return conds.filter(c => c.batchId === batchId);
    }
    return conds;
  },

  async saveCondition(data) {
    await this.delay(100);
    const token = localStorage.getItem('smart_poultry_jwt_token');
    if (token && data.batchId) {
      try {
        await fetch(API_BASE_URL + '/api/records/daily', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            flock_id: parseInt(data.batchId) || 1,
            record_date: new Date().toISOString().split('T')[0],
            mortality: parseInt(data.mortality) || 0,
            culls: 0,
            average_weight_kg: parseFloat(data.avgWeight) || 1.5,
            feed_consumed_kg: parseFloat(data.feedConsumption) || 0,
            water_consumed_liters: parseFloat(data.waterConsumption) || 0,
            eggs_produced: parseInt(data.eggsCollected) || 0,
            notes: (data.symptoms || []).join(', ')
          })
        });
      } catch (err) {
        console.warn('Network call /api/records/daily failed, saving locally', err);
      }
    }
    const conds = await this.getConditions();
    const newCond = {
      id: 'COND-' + Date.now(),
      timestamp: new Date().toLocaleString(),
      ...data
    };
    conds.unshift(newCond);
    localStorage.setItem(STORAGE_KEYS.CONDITIONS, JSON.stringify(conds));

    // Also update batch mortality, feed, water, and risk
    if (data.batchId) {
      let batches = await this.getBatches();
      batches = batches.map(b => {
        if (b.id === data.batchId) {
          return {
            ...b,
            dailyFeedKg: parseFloat(data.feedConsumption) || b.dailyFeedKg,
            dailyWaterL: parseFloat(data.waterConsumption) || b.dailyWaterL,
            mortalityCount: parseInt(data.mortality) || b.mortalityCount,
            avgWeightKg: parseFloat(data.avgWeight) || b.avgWeightKg,
            riskLevel: data.riskLevel || b.riskLevel,
            healthStatus: data.riskLevel === 'High' ? 'Attention Required' : data.riskLevel === 'Medium' ? 'Monitor' : 'Good'
          };
        }
        return b;
      });
      localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));

      // Generate alert if high or medium risk
      if (data.riskLevel === 'High' || data.riskLevel === 'Medium') {
        const newAlert = {
          id: 'ALT-' + Date.now(),
          farmId: data.farmId,
          batchId: data.batchId,
          batchName: data.batchName || 'Batch ' + data.batchId,
          severity: data.riskLevel === 'High' ? 'Critical' : 'Warning',
          title: data.riskLevel === 'High' ? 'High Disease Risk Detected' : 'Health Anomaly Warning',
          description: `Logged condition with mortality ${data.mortality}, feed ${data.feedConsumption}kg. Symptoms: ${(data.symptoms || []).join(', ') || 'None'}.`,
          timestamp: 'Just now',
          isRead: false
        };
        const alerts = await this.getAlerts();
        alerts.unshift(newAlert);
        localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
      }
    }

    return newCond;
  },

  // --- ALERTS API ---
  async getAlerts(farmId = null) {
    await this.delay(50);
    const alerts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ALERTS) || '[]');
    if (farmId) {
      return alerts.filter(a => a.farmId === farmId);
    }
    return alerts;
  },

  async markAlertAsRead(alertId) {
    await this.delay(50);
    let alerts = await this.getAlerts();
    alerts = alerts.map(a => a.id === alertId ? { ...a, isRead: true } : a);
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
    return { success: true };
  },

  async markAllAlertsAsRead() {
    await this.delay(50);
    let alerts = await this.getAlerts();
    alerts = alerts.map(a => ({ ...a, isRead: true }));
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
    return { success: true };
  },

  // --- VACCINATIONS API ---
  async getVaccinations(batchId = null) {
    await this.delay(50);
    const vacs = JSON.parse(localStorage.getItem(STORAGE_KEYS.VACCINATIONS) || '[]');
    if (batchId) {
      return vacs.filter(v => v.batchId === batchId);
    }
    return vacs;
  },

  async addVaccination(vacData) {
    await this.delay(100);
    const vacs = await this.getVaccinations();
    const newVac = {
      id: 'VAC-' + String(vacs.length + 1).padStart(3, '0'),
      status: 'Upcoming',
      ...vacData
    };
    vacs.unshift(newVac);
    localStorage.setItem(STORAGE_KEYS.VACCINATIONS, JSON.stringify(vacs));
    return newVac;
  },

  async deleteVaccination(id) {
    await this.delay(50);
    let vacs = await this.getVaccinations();
    vacs = vacs.filter(v => v.id !== id);
    localStorage.setItem(STORAGE_KEYS.VACCINATIONS, JSON.stringify(vacs));
    return { success: true };
  },

  // --- PREDICTIONS API ---
  async getPredictions() {
    await this.delay(50);
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PREDICTIONS) || '[]');
  },

  async savePrediction(predData) {
    await this.delay(100);
    const preds = await this.getPredictions();
    const newPred = {
      id: 'PRED-' + Math.floor(500 + Math.random() * 500),
      timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      ...predData
    };
    preds.unshift(newPred);
    localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(preds));
    return newPred;
  },

  // --- SCAN & AI DIAGNOSIS HISTORY API ---
  async getScanHistory() {
    await this.delay(30);
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SCAN_HISTORY) || '[]');
  },

  async saveScanResult(scanData) {
    await this.delay(50);
    const history = await this.getScanHistory();
    const newRecord = {
      id: 'SCAN-' + Date.now(),
      timestamp: new Date().toLocaleString([], { 
        year: 'numeric', 
        month: 'short', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      createdAt: new Date().toISOString(),
      ...scanData
    };
    history.unshift(newRecord);
    // Keep up to 50 recent scans
    if (history.length > 50) history.pop();
    localStorage.setItem(STORAGE_KEYS.SCAN_HISTORY, JSON.stringify(history));
    window.dispatchEvent(new CustomEvent('scanHistoryUpdated', { detail: { record: newRecord } }));
    return newRecord;
  },

  async deleteScanResult(id) {
    await this.delay(30);
    let history = await this.getScanHistory();
    history = history.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.SCAN_HISTORY, JSON.stringify(history));
    window.dispatchEvent(new CustomEvent('scanHistoryUpdated'));
    return { success: true };
  },

  async clearScanHistory() {
    await this.delay(30);
    localStorage.setItem(STORAGE_KEYS.SCAN_HISTORY, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('scanHistoryUpdated'));
    return { success: true };
  },

  // --- CURRENT SELECTED FARM ---
  getSelectedFarmId() {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_FARM) || '';
  },

  setSelectedFarmId(id) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_FARM, id);
  },

  // --- USER PROFILE ---
  getUserProfile() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_PROFILE) || JSON.stringify(SAMPLE_DEMO_DATA.user));
  },

  updateUserProfile(userData) {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userData));
    return userData;
  },

  // --- EGG PRODUCTION API ---
  async getEggLogs(batchId = null) {
    await this.delay(50);
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.EGGS) || '[]');
    if (batchId) return logs.filter(l => l.batchId === batchId);
    return logs;
  },

  async addEggLog(entry) {
    await this.delay(80);
    const logs = await this.getEggLogs();
    const total = parseInt(entry.totalCollected) || 0;
    const damaged = parseInt(entry.damagedCracked) || 0;
    const good = Math.max(0, total - damaged);
    const trays = (total / 30).toFixed(1);

    const newLog = {
      id: 'EGG-' + Date.now().toString().slice(-6),
      date: entry.date || new Date().toISOString().split('T')[0],
      batchId: entry.batchId || 'B-101',
      totalCollected: total,
      goodEggs: good,
      damagedCracked: damaged,
      trays: parseFloat(trays),
      layRatePct: entry.layRatePct || 0,
      notes: entry.notes || ''
    };
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.EGGS, JSON.stringify(logs));
    return newLog;
  },

  async getEggSummary() {
    const logs = await this.getEggLogs();
    let totalEggs = 0;
    let totalDamaged = 0;
    let totalTrays = 0;
    logs.forEach(l => {
      totalEggs += (parseInt(l.totalCollected) || 0);
      totalDamaged += (parseInt(l.damagedCracked) || 0);
      totalTrays += (parseFloat(l.trays) || 0);
    });
    return {
      totalLogs: logs.length,
      totalEggs,
      totalDamaged,
      totalTrays: Math.round(totalTrays),
      recentLogs: logs.slice(0, 5)
    };
  },

  // --- DIRECT MARKETING (FARM-TO-BUYER MARKETPLACE) ---
  async getMarketListings() {
    await this.delay(50);
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MARKET) || '[]');
  },

  async addMarketListing(item) {
    await this.delay(80);
    const listings = await this.getMarketListings();
    const newListing = {
      id: 'MKT-' + Date.now().toString().slice(-6),
      title: item.title,
      category: item.category,
      pricePerUnit: parseFloat(item.pricePerUnit) || 0,
      unit: item.unit || 'Tray (30 eggs)',
      availableQty: parseInt(item.availableQty) || 1,
      contactPhone: item.contactPhone || '',
      farmLocation: item.farmLocation || 'Farm Pickup Available',
      notes: item.notes || '',
      postedDate: new Date().toISOString().split('T')[0]
    };
    listings.unshift(newListing);
    localStorage.setItem(STORAGE_KEYS.MARKET, JSON.stringify(listings));
    return newListing;
  },

  async deleteMarketListing(id) {
    await this.delay(50);
    let listings = await this.getMarketListings();
    listings = listings.filter(l => l.id !== id);
    localStorage.setItem(STORAGE_KEYS.MARKET, JSON.stringify(listings));
    return { success: true };
  },

  // --- CLEANLINESS & HYGIENE DETAILS ---
  async getHygieneLogs() {
    await this.delay(50);
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.HYGIENE) || '[]');
  },

  async saveHygieneAudit(auditData) {
    await this.delay(80);
    const logs = await this.getHygieneLogs();

    // Calculate score out of 100 based on checked tasks
    let score = 0;
    if (auditData.waterFlushed) score += 20;
    if (auditData.dryLitter) score += 20;
    if (auditData.footbathChanged) score += 20;
    if (auditData.pestControlActive) score += 15;
    if (auditData.deadBirdDisposed) score += 15;
    if (auditData.wallLimewash) score += 10;

    const newAudit = {
      id: 'HYG-' + Date.now().toString().slice(-6),
      timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      score: score,
      rating: score >= 80 ? 'Optimal' : score >= 60 ? 'Moderate' : 'Needs Action',
      ...auditData
    };
    logs.unshift(newAudit);
    localStorage.setItem(STORAGE_KEYS.HYGIENE, JSON.stringify(logs));
    return newAudit;
  },

  async getLatestHygieneScore() {
    const logs = await this.getHygieneLogs();
    if (logs.length === 0) return { score: 95, rating: 'Optimal' };
    return { score: logs[0].score, rating: logs[0].rating, lastAudit: logs[0] };
  },

  // --- FARM GEOGRAPHICAL & SHED STRUCTURE ---
  async getFarmGeo(farmId = 'F-001') {
    await this.delay(50);
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.GEO_STRUCTURE) || '{}');
    return all[farmId] || null;
  },

  async saveFarmGeo(farmId, geoData) {
    await this.delay(80);
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.GEO_STRUCTURE) || '{}');
    const length = parseFloat(geoData.lengthFt) || 100;
    const width = parseFloat(geoData.widthFt) || 30;
    const height = parseFloat(geoData.heightFt) || 12;
    const totalAreaSqFt = length * width;
    // Standard rule: ~1.2 sq.ft per broiler bird, ~1.8 sq.ft per layer bird
    const recommendedCapacity = Math.floor(totalAreaSqFt / 1.2);

    const saved = {
      farmId: farmId,
      latitude: geoData.latitude || '',
      longitude: geoData.longitude || '',
      address: geoData.address || '',
      orientation: geoData.orientation || 'East - West (Cross-Wind)',
      ventilationType: geoData.ventilationType || 'Tunnel Ventilation + Side Curtains',
      nearestFarmDistanceKm: geoData.nearestFarmDistanceKm || 2.5,
      lengthFt: length,
      widthFt: width,
      heightFt: height,
      totalAreaSqFt: totalAreaSqFt,
      recommendedCapacity: recommendedCapacity,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    all[farmId] = saved;
    localStorage.setItem(STORAGE_KEYS.GEO_STRUCTURE, JSON.stringify(all));
    return saved;
  }
};
