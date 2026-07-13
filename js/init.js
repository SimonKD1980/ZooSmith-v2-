// 1. Load saved game
loadGame();

// 2. Ensure food exists
state.food = state.food || { hay: 30, meat: 20, produce: 15 };

// 3. Load all JSON data
loadAllData().then(() => {
  // 4. Initial render
  updateUI();
  renderShop();
  renderExhibits();
  renderStaff();
  renderSupplies();
  renderAmenities();
  renderResearch();
  renderAchievements();
  
  // 5. Auto-save every 10 seconds
  setInterval(saveGame, 10000);
  
  // 6. Save on page unload
  window.addEventListener("beforeunload", saveGame);
  
  // 7. Bind End Day button
  document.getElementById("endDayBtn").onclick = advanceDay;
  
  console.log("ZooSmith V0.7.0 initialized successfully!");
});