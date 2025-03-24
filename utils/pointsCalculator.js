// Points System Calculation
const pointsCalculator = (stats, role) => {
    let points = 0;
  
    // Batting Points
    points += stats.runs ? stats.runs * 1 : 0;          // 1 point per run
    points += stats.fours ? stats.fours * 1 : 0;        // 1 point per four
    points += stats.sixes ? stats.sixes * 2 : 0;        // 2 points per six
  
    // Bowling Points
    points += stats.wickets ? stats.wickets * 25 : 0;   // 25 points per wicket
  
    // Fielding Points
    points += stats.catches ? stats.catches * 10 : 0;   // 10 points per catch
    points += stats.runouts ? stats.runouts * 10 : 0;   // 10 points per runout
  
    // Role-Based Multiplier
    if (role === "C") points *= 2;  // Captain gets 2x points
    if (role === "VC") points *= 1.5; // Vice-Captain gets 1.5x points
  
    return points;
  };
  
  module.exports = pointsCalculator;
  