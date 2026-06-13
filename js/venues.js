// ============================================================
// 球场环境数据 (来自 openfootball)
// ============================================================

const VenueData = {
  'Mexico City': {
    name:'Estadio Azteca', city:'墨西哥城', capacity:87000, altitude:2240,
    climate:'temperate', timezone:'UTC-6', surface:'natural',
    weatherNote:'海拔2240米，空气稀薄，体能消耗大',
    homeAdvantage:['MEX'], envFactor:-1.5,
  },
  'Guadalajara (Zapopan)': {
    name:'Estadio Akron', city:'瓜达拉哈拉', capacity:49850, altitude:1566,
    climate:'temperate', timezone:'UTC-6', surface:'natural',
    weatherNote:'中高海拔，温暖干燥',
    homeAdvantage:['MEX'], envFactor:-0.8,
  },
  'Monterrey (Guadalupe)': {
    name:'Estadio BBVA', city:'蒙特雷', capacity:53500, altitude:540,
    climate:'hot', timezone:'UTC-6', surface:'natural',
    weatherNote:'炎热干燥，6月可达38°C+',
    homeAdvantage:['MEX'], envFactor:-0.5,
  },
  'New York/New Jersey (East Rutherford)': {
    name:'MetLife Stadium', city:'纽约/新泽西', capacity:82500, altitude:0,
    climate:'temperate', timezone:'UTC-4', surface:'natural',
    weatherNote:'6-7月温暖潮湿，偶有雷阵雨',
    homeAdvantage:['USA'], envFactor:0,
  },
  'Los Angeles (Inglewood)': {
    name:'SoFi Stadium', city:'洛杉矶', capacity:70240, altitude:0,
    climate:'dry', timezone:'UTC-7', surface:'natural',
    weatherNote:'干燥温暖，阳光充足',
    homeAdvantage:[], envFactor:0,
  },
  'Dallas (Arlington)': {
    name:'AT&T Stadium', city:'达拉斯', capacity:80000, altitude:0,
    climate:'hot', timezone:'UTC-5', surface:'natural',
    weatherNote:'炎热，6月可达35°C+',
    homeAdvantage:[], envFactor:-0.5,
  },
  'Miami (Miami Gardens)': {
    name:'Hard Rock Stadium', city:'迈阿密', capacity:65326, altitude:0,
    climate:'humid', timezone:'UTC-4', surface:'natural',
    weatherNote:'高温高湿，对体能消耗大',
    homeAdvantage:[], envFactor:-0.3,
  },
  'Kansas City': {
    name:'Arrowhead Stadium', city:'堪萨斯城', capacity:76416, altitude:0,
    climate:'hot', timezone:'UTC-5', surface:'natural',
    weatherNote:'夏季炎热',
    homeAdvantage:[], envFactor:0,
  },
  'Houston': {
    name:'NRG Stadium', city:'休斯顿', capacity:72220, altitude:0,
    climate:'humid', timezone:'UTC-5', surface:'natural',
    weatherNote:'高温高湿，室内空调',
    homeAdvantage:[], envFactor:0,
  },
  'Seattle': {
    name:'Lumen Field', city:'西雅图', capacity:68740, altitude:0,
    climate:'temperate', timezone:'UTC-7', surface:'natural',
    weatherNote:'温和，球迷氛围极佳',
    homeAdvantage:['USA'], envFactor:0,
  },
  'Vancouver': {
    name:'BC Place', city:'温哥华', capacity:54500, altitude:0,
    climate:'temperate', timezone:'UTC-7', surface:'artificial',
    weatherNote:'室内场馆，人工草皮',
    homeAdvantage:['CAN'], envFactor:-0.3,
  },
  'Toronto': {
    name:'BMO Field', city:'多伦多', capacity:30000, altitude:0,
    climate:'temperate', timezone:'UTC-4', surface:'natural',
    weatherNote:'温暖潮湿',
    homeAdvantage:['CAN'], envFactor:0,
  },
  'Boston (Foxborough)': {
    name:'Gillette Stadium', city:'波士顿', capacity:65878, altitude:0,
    climate:'temperate', timezone:'UTC-4', surface:'natural',
    weatherNote:'温暖潮湿',
    homeAdvantage:[], envFactor:0,
  },
  'Philadelphia': {
    name:'Lincoln Financial Field', city:'费城', capacity:69176, altitude:0,
    climate:'temperate', timezone:'UTC-4', surface:'natural',
    weatherNote:'温暖',
    homeAdvantage:[], envFactor:0,
  },
  'San Francisco Bay Area (Santa Clara)': {
    name:"Levi's Stadium", city:'旧金山', capacity:68500, altitude:0,
    climate:'temperate', timezone:'UTC-7', surface:'natural',
    weatherNote:'温和干燥',
    homeAdvantage:[], envFactor:0,
  },
  'Atlanta': {
    name:'Mercedes-Benz Stadium', city:'亚特兰大', capacity:71000, altitude:0,
    climate:'humid', timezone:'UTC-4', surface:'natural',
    weatherNote:'高温高湿，室内空调',
    homeAdvantage:[], envFactor:0,
  },
};

function getVenueImpact(venueName, homeCode, awayCode) {
  const venue = VenueData[venueName];
  if (!venue) return { homeBonus:0, awayPenalty:0, notes:[] };

  let homeBonus = 0, awayPenalty = 0;
  const notes = [];

  // 高海拔影响
  if (venue.altitude > 1500) {
    const homeConf = TEAMS[homeCode]?.conf || '';
    const awayConf = TEAMS[awayCode]?.conf || '';
    if (['CONCACAF','CONMEBOL'].includes(awayConf)) awayPenalty -= 0.3;
    else { awayPenalty -= 1.0; notes.push(`海拔${venue.altitude}m，对${awayCode}体能消耗大`); }
    if (['CONCACAF','CONMEBOL'].includes(homeConf)) { homeBonus += 0.5; notes.push(`${homeCode}适应高海拔环境`); }
  }

  // 人工草皮
  if (venue.surface === 'artificial') {
    notes.push('人工草皮，对技术型球队不利');
    awayPenalty -= 0.3;
  }

  // 湿热气候
  if (venue.climate === 'humid' || venue.climate === 'hot') {
    notes.push('高温/高湿环境，体能消耗大');
    awayPenalty -= 0.2;
  }

  // 主场加成
  if (venue.homeAdvantage.includes(homeCode)) { homeBonus += 1.0; notes.push(`${homeCode}主场作战，球迷加成`); }
  if (venue.homeAdvantage.includes(awayCode)) awayPenalty += 0.5;

  return { homeBonus:+homeBonus.toFixed(2), awayPenalty:+awayPenalty.toFixed(2), notes };
}
