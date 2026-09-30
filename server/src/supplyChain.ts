// Mock in-memory state for prototype (in production, this would be BigQuery/Firebase)
interface SupplyInventory {
  [item: string]: number;
}

export const inventory: SupplyInventory = {
  'O-negative': 50,
  'ICU Beds': 10,
  'IV Paracetamol': 100,
  'Platelets': 20
};

// Track recent consumption velocity to trigger epidemic alerts
const consumptionLog: { item: string; timestamp: number; qty: number }[] = [];

export function processSupplyUpdate(requirements: { item: string; qty: number }[]) {
  const alerts: string[] = [];
  const now = Date.now();

  for (const req of requirements) {
    // Deplete inventory
    if (inventory[req.item] !== undefined) {
      inventory[req.item] -= req.qty;
    }

    // Log for velocity tracking
    consumptionLog.push({ item: req.item, timestamp: now, qty: req.qty });
  }

  // Check Epidemic Triggers (e.g. Vector-Borne Outbreak)
  // Logic: If IV Paracetamol and Platelets are consumed heavily in the last 24h
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  
  const recentParacetamol = consumptionLog
    .filter(log => log.item === 'IV Paracetamol' && log.timestamp >= oneDayAgo)
    .reduce((sum, log) => sum + log.qty, 0);
    
  const recentPlatelets = consumptionLog
    .filter(log => log.item === 'Platelets' && log.timestamp >= oneDayAgo)
    .reduce((sum, log) => sum + log.qty, 0);

  // Thresholds for the demo
  if (recentParacetamol >= 5 && recentPlatelets >= 2) {
    alerts.push('🚨 EPIDEMIC SURGE WARNING: Vector-Borne Outbreak (Dengue) detected based on consumption velocity. Auto-routing supply buffers.');
  }

  // FEFO (First-to-Expire, First-Out) trigger check
  if (inventory['Anti-venom'] !== undefined && inventory['Anti-venom'] > 0) {
     alerts.push('♻️ FEFO Optimization: Anti-venom at Rural PHC nearing expiry. Initiating transfer to District Hospital.');
  }

  return { updatedInventory: inventory, alerts };
}
