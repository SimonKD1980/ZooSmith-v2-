// --- Attraction & Visitor Generation ---
function calculateAttraction() {
  let score = 0;
  const allExhibits = getAllExhibits();
  
  for (const { exhibit } of allExhibits) {
    if (exhibit.buildDaysRemaining > 0) continue;
    if (exhibit.animals) {
      exhibit.animals.forEach(animal => {
        const baseAnimal = data.animals.find(a => a.id === animal.id);
        score += baseAnimal ? (baseAnimal.attractionValue || 10) : 10;
      });
    }
    score += getExhibitHappiness(exhibit) * 0.5;
  }
  return score;
}

function generateVisitors() {
  const attraction = calculateAttraction();
  if (attraction <= 0) return 0;

  // Base visitors from amenities
  const hasRestroom = (state.amenities.restroom || 0) > 0 || (state.amenities.toilet || 0) > 0;
  const hasFood = (state.amenities.food_stand || 0) > 0 || 
                  (state.amenities.cafe || 0) > 0 || 
                  (state.amenities.restaurant || 0) > 0;
  
  let baseVisitors = 0;
  if (hasRestroom && hasFood) baseVisitors = 5;
  else if (hasRestroom || hasFood) baseVisitors = 2;

  let visitors = baseVisitors + Math.floor(2 * Math.sqrt(attraction));

  // Novelty decay
  const decayFactor = Math.min(1, (state.daysSinceNewAnimal || 0) / 20);
  visitors = Math.floor(visitors * (1 - (decayFactor * 0.4)));

  // Ticket price impact
  const priceImpact = state.ticketPriceImpact || 0;
  const priceMultiplier = Math.max(0.1, 1 + (priceImpact / 100));
  visitors = Math.floor(visitors * priceMultiplier);

  // Satisfaction multiplier
  const satisfaction = state.visitorSatisfaction || 50;
  visitors = Math.max(0, Math.floor(visitors * (satisfaction / 100)));

  return visitors;
}

function calculateGuestHappiness() {
  let satisfaction = 50; // Base
  const complaints = [];

  // Amenity bonuses
  if ((state.amenities.restroom || 0) > 0 || (state.amenities.toilet || 0) > 0) satisfaction += 20;
  else complaints.push("No restrooms!");
  
  if ((state.amenities.bin || 0) > 0) satisfaction += 15;
  else complaints.push("Not enough bins!");
  
  if ((state.amenities.bench || 0) > 0) satisfaction += 15;
  
  if ((state.amenities.food_stand || 0) > 0 || (state.amenities.cafe || 0) > 0) satisfaction += 20;
  else complaints.push("No food available!");
  
  if ((state.amenities.gift_shop || 0) > 0) satisfaction += 10;

  // Penalty from complaints
  satisfaction -= complaints.length * 10;

  // Cleanliness penalty
  const avgCleanliness = getAllExhibits().reduce((sum, {exhibit}) => sum + (exhibit.cleanliness || 100), 0) / Math.max(1, getAllExhibits().length);
  if (avgCleanliness < 50) satisfaction -= (50 - avgCleanliness);

  state.visitorComplaints = complaints;
  state.visitorSatisfaction = Math.max(0, Math.min(100, satisfaction));
  return state.visitorSatisfaction;
}

// --- Ticket Pricing ---
function updateTicketPrice(newPrice) {
  state.ticketPrice = parseInt(newPrice);
  
  const basePrice = 20;
  const zooRating = state.zooRating || 0;
  const premiumMultiplier = zooRating >= 80 ? 1.5 : zooRating >= 60 ? 1.2 : 1.0;
  const adjustedPrice = basePrice * premiumMultiplier;
  const effectiveDiff = state.ticketPrice - adjustedPrice;

  state.ticketPriceImpact = effectiveDiff > 0 ? -3 * effectiveDiff : 2 * Math.abs(effectiveDiff);
  state.ticketSatisfactionImpact = effectiveDiff > 0 ? -2 * effectiveDiff : 1 * Math.abs(effectiveDiff);
  
  if (typeof updateUI === 'function') updateUI();
}

// --- Income Processing ---
function processDayIncome() {
  // 1. Calculate visitors and satisfaction
  const visitors = generateVisitors();
  state.dailyVisitors = visitors;
  calculateGuestHappiness();

  // 2. Ticket revenue
  const ticketRevenue = visitors * state.ticketPrice;
  state.money += ticketRevenue;
  state.monthlyIncomeTracker += ticketRevenue;

  // 3. Amenity revenue
  let amenityRevenue = 0;
  if (visitors > 0) {
    const foodStands = (state.amenities.food_stand || 0) + (state.amenities.cafe || 0);
    const giftShops = state.amenities.gift_shop || 0;
    
    const foodBuyers = Math.min(visitors * 0.5, foodStands * 50);
    amenityRevenue += foodBuyers * 5; // $5 per food item
    
    const giftBuyers = Math.min(visitors * 0.2, giftShops * 30);
    amenityRevenue += giftBuyers * 10; // $10 per gift
  }
  
  state.money += amenityRevenue;
  state.monthlyIncomeTracker += amenityRevenue;
  state.visitorSpending = { food: foodBuyers * 5 || 0, gifts: giftBuyers * 10 || 0, total: amenityRevenue };

  // 4. Pay staff salaries
  let staffCost = 0;
  state.hiredStaff.forEach(instance => {
    const staffData = data.staff.find(s => s.id === instance.typeId);
    if (staffData) staffCost += staffData.salary || 0;
  });
  state.money -= staffCost;
  state.monthlyIncomeTracker -= staffCost;

  if (visitors > 0) {
    addTicker(`${visitors} visitors enjoyed your zoo today! Earned $${ticketRevenue + amenityRevenue}.`);
  } else {
    addTicker("No visitors today. Build more exhibits and amenities!");
  }
}

function processAnimalIncome() {
  let totalIncome = 0;
  getAllAnimals().forEach(animal => {
    const baseAnimal = data.animals.find(a => a.id === animal.id);
    if (baseAnimal) {
      const income = (baseAnimal.dailyIncome || 0) * getIncomeMultiplier(animal.age);
      totalIncome += income;
    }
  });
  
  state.money += totalIncome;
  state.monthlyIncomeTracker += totalIncome;
}