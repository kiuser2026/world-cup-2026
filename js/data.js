// 最后更新: 2026/6/25 14:46:32
// 数据来源: football-data.org (FIFA World Cup)
// ============================================================
// 2026 FIFA World Cup — 赛程 & 球队数据 (来自 openfootball)
// 主办国: 美国🇺🇸 加拿大🇨🇦 墨西哥🇲🇽
// 48 队 · 12 组 · 104 场
// 晋级规则: 各组前2名(24队) + 8个最佳第3名 = 32强
// ============================================================

const TEAMS = {
  // ── A 组 ──
  MEX:  { name:'墨西哥',      flag:'🇲🇽', rank:15, group:'A', conf:'CONCACAF' },
  RSA:  { name:'南非',       flag:'🇿🇦', rank:58, group:'A', conf:'CAF' },
  KOR:  { name:'韩国',       flag:'🇰🇷', rank:25, group:'A', conf:'AFC' },
  CZE:  { name:'捷克',       flag:'🇨🇿', rank:36, group:'A', conf:'UEFA' },

  // ── B 组 ──
  CAN:  { name:'加拿大',      flag:'🇨🇦', rank:43, group:'B', conf:'CONCACAF' },
  BIH:  { name:'波黑',       flag:'🇧🇦', rank:63, group:'B', conf:'UEFA' },
  QAT:  { name:'卡塔尔',      flag:'🇶🇦', rank:42, group:'B', conf:'AFC' },
  SUI:  { name:'瑞士',       flag:'🇨🇭', rank:19, group:'B', conf:'UEFA' },

  // ── C 组 ──
  BRA:  { name:'巴西',       flag:'🇧🇷', rank:3, group:'C', conf:'CONMEBOL' },
  MAR:  { name:'摩洛哥',      flag:'🇲🇦', rank:13, group:'C', conf:'CAF' },
  HAI:  { name:'海地',       flag:'🇭🇹', rank:87, group:'C', conf:'CONCACAF' },
  SCO:  { name:'苏格兰',      flag:'🏴󠁧󠁢󠁳󠁣󠁴󠁿', rank:40, group:'C', conf:'UEFA' },

  // ── D 组 ──
  USA:  { name:'美国',       flag:'🇺🇸', rank:16, group:'D', conf:'CONCACAF' },
  PAR:  { name:'巴拉圭',      flag:'🇵🇾', rank:49, group:'D', conf:'CONMEBOL' },
  AUS:  { name:'澳大利亚',    flag:'🇦🇺', rank:23, group:'D', conf:'AFC' },
  TUR:  { name:'土耳其',      flag:'🇹🇷', rank:27, group:'D', conf:'UEFA' },

  // ── E 组 ──
  GER:  { name:'德国',       flag:'🇩🇪', rank:9, group:'E', conf:'UEFA' },
  CUW:  { name:'库拉索',      flag:'🇨🇼', rank:150, group:'E', conf:'CONCACAF' },
  CIV:  { name:'科特迪瓦',    flag:'🇨🇮', rank:37, group:'E', conf:'CAF' },
  ECU:  { name:'厄瓜多尔',    flag:'🇪🇨', rank:31, group:'E', conf:'CONMEBOL' },

  // ── F 组 ──
  NED:  { name:'荷兰',       flag:'🇳🇱', rank:7, group:'F', conf:'UEFA' },
  JPN:  { name:'日本',       flag:'🇯🇵', rank:24, group:'F', conf:'AFC' },
  SWE:  { name:'瑞典',       flag:'🇸🇪', rank:32, group:'F', conf:'UEFA' },
  TUN:  { name:'突尼斯',      flag:'🇹🇳', rank:35, group:'F', conf:'CAF' },

  // ── G 组 ──
  BEL:  { name:'比利时',      flag:'🇧🇪', rank:8, group:'G', conf:'UEFA' },
  EGY:  { name:'埃及',       flag:'🇪🇬', rank:34, group:'G', conf:'CAF' },
  IRN:  { name:'伊朗',       flag:'🇮🇷', rank:22, group:'G', conf:'AFC' },
  NZL:  { name:'新西兰',      flag:'🇳🇿', rank:91, group:'G', conf:'OFC' },

  // ── H 组 ──
  ESP:  { name:'西班牙',      flag:'🇪🇸', rank:4, group:'H', conf:'UEFA' },
  CPV:  { name:'佛得角',      flag:'🇨🇻', rank:70, group:'H', conf:'CAF' },
  KSA:  { name:'沙特阿拉伯',  flag:'🇸🇦', rank:56, group:'H', conf:'AFC' },
  URU:  { name:'乌拉圭',      flag:'🇺🇾', rank:11, group:'H', conf:'CONMEBOL' },

  // ── I 组 ──
  FRA:  { name:'法国',       flag:'🇫🇷', rank:2, group:'I', conf:'UEFA' },
  SEN:  { name:'塞内加尔',    flag:'🇸🇳', rank:20, group:'I', conf:'CAF' },
  IRQ:  { name:'伊拉克',      flag:'🇮🇶', rank:55, group:'I', conf:'AFC' },
  NOR:  { name:'挪威',       flag:'🇳🇴', rank:44, group:'I', conf:'UEFA' },

  // ── J 组 ──
  ARG:  { name:'阿根廷',      flag:'🇦🇷', rank:1, group:'J', conf:'CONMEBOL' },
  ALG:  { name:'阿尔及利亚',  flag:'🇩🇿', rank:38, group:'J', conf:'CAF' },
  AUT:  { name:'奥地利',      flag:'🇦🇹', rank:22, group:'J', conf:'UEFA' },
  JOR:  { name:'约旦',       flag:'🇯🇴', rank:68, group:'J', conf:'AFC' },

  // ── K 组 ──
  POR:  { name:'葡萄牙',      flag:'🇵🇹', rank:6, group:'K', conf:'UEFA' },
  COD:  { name:'刚果民主',    flag:'🇨🇩', rank:57, group:'K', conf:'CAF' },
  UZB:  { name:'乌兹别克斯坦', flag:'🇺🇿', rank:62, group:'K', conf:'AFC' },
  COL:  { name:'哥伦比亚',    flag:'🇨🇴', rank:12, group:'K', conf:'CONMEBOL' },

  // ── L 组 ──
  ENG:  { name:'英格兰',      flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', rank:5, group:'L', conf:'UEFA' },
  CRO:  { name:'克罗地亚',    flag:'🇭🇷', rank:10, group:'L', conf:'UEFA' },
  GHA:  { name:'加纳',       flag:'🇬🇭', rank:60, group:'L', conf:'CAF' },
  PAN:  { name:'巴拿马',      flag:'🇵🇦', rank:48, group:'L', conf:'CONCACAF' },
};

const TEAM_CODES = Object.keys(TEAMS);

const VENUES = {
  'Mexico City':                'Estadio Azteca, 墨西哥城',
  'Guadalajara (Zapopan)':      'Estadio Akron, 瓜达拉哈拉',
  'Atlanta':                    'Mercedes-Benz Stadium, 亚特兰大',
  'Toronto':                    'BMO Field, 多伦多',
  'San Francisco Bay Area (Santa Clara)': "Levi's Stadium, 旧金山",
  'Los Angeles (Inglewood)':    'SoFi Stadium, 洛杉矶',
  'Vancouver':                  'BC Place, 温哥华',
  'New York/New Jersey (East Rutherford)': 'MetLife Stadium, 纽约',
  'Boston (Foxborough)':        'Gillette Stadium, 波士顿',
  'Philadelphia':               'Lincoln Financial Field, 费城',
  'Houston':                    'NRG Stadium, 休斯顿',
  'Dallas (Arlington)':         'AT&T Stadium, 达拉斯',
  'Monterrey (Guadalupe)':      'Estadio BBVA, 蒙特雷',
  'Seattle':                    'Lumen Field, 西雅图',
  'Miami (Miami Gardens)':      'Hard Rock Stadium, 迈阿密',
  'Kansas City':                'Arrowhead Stadium, 堪萨斯城',
};

const ADVANCEMENT_RULES = {
  description: '各组前2名(24队) + 8个成绩最好的第3名 = 32强',
  groupTop: 2,
  bestThird: 8,
  totalAdvance: 32,
  pointsForThird: '第3名按积分→净胜球→进球数排名，取前8',
};

// ============================================================
// 赛程 (来自 openfootball/world-cup.json — 104 场)
// ============================================================
const MATCHES = [
  // ── A 组 ──
  { id:1,  stage:'group', group:'A', matchday:1, date:'2026-06-11', time:'13:00', venue:'Mexico City', home:'MEX', away:'RSA', homeScore:2, awayScore:0 },
  { id:2,  stage:'group', group:'A', matchday:1, date:'2026-06-12', time:'20:00', venue:'Guadalajara (Zapopan)', home:'KOR', away:'CZE', homeScore:2, awayScore:1 },
  { id:3,  stage:'group', group:'A', matchday:2, date:'2026-06-18', time:'12:00', venue:'Atlanta', home:'CZE', away:'RSA', homeScore:1, awayScore:1 },
  { id:4,  stage:'group', group:'A', matchday:2, date:'2026-06-19', time:'19:00', venue:'Guadalajara (Zapopan)', home:'MEX', away:'KOR', homeScore:1, awayScore:0 },
  { id:5,  stage:'group', group:'A', matchday:3, date:'2026-06-25', time:'19:00', venue:'Mexico City', home:'CZE', away:'MEX', homeScore:0, awayScore:3 },
  { id:6,  stage:'group', group:'A', matchday:3, date:'2026-06-25', time:'19:00', venue:'Monterrey (Guadalupe)', home:'RSA', away:'KOR', homeScore:1, awayScore:0 },

  // ── B 组 ──
  { id:7,  stage:'group', group:'B', matchday:1, date:'2026-06-12', time:'15:00', venue:'Toronto', home:'CAN', away:'BIH', homeScore:1, awayScore:1 },
  { id:8,  stage:'group', group:'B', matchday:1, date:'2026-06-13', time:'12:00', venue:'San Francisco Bay Area (Santa Clara)', home:'QAT', away:'SUI', homeScore:1, awayScore:1 },
  { id:9,  stage:'group', group:'B', matchday:2, date:'2026-06-18', time:'12:00', venue:'Los Angeles (Inglewood)', home:'SUI', away:'BIH', homeScore:4, awayScore:1 },
  { id:10, stage:'group', group:'B', matchday:2, date:'2026-06-18', time:'15:00', venue:'Vancouver', home:'CAN', away:'QAT', homeScore:6, awayScore:0 },
  { id:11, stage:'group', group:'B', matchday:3, date:'2026-06-24', time:'12:00', venue:'Vancouver', home:'SUI', away:'CAN', homeScore:2, awayScore:1 },
  { id:12, stage:'group', group:'B', matchday:3, date:'2026-06-24', time:'12:00', venue:'Seattle', home:'BIH', away:'QAT', homeScore:3, awayScore:1 },

  // ── C 组 ──
  { id:13, stage:'group', group:'C', matchday:1, date:'2026-06-13', time:'18:00', venue:'New York/New Jersey (East Rutherford)', home:'BRA', away:'MAR', homeScore:1, awayScore:1 },
  { id:14, stage:'group', group:'C', matchday:1, date:'2026-06-14', time:'21:00', venue:'Boston (Foxborough)', home:'HAI', away:'SCO', homeScore:0, awayScore:1 },
  { id:15, stage:'group', group:'C', matchday:2, date:'2026-06-19', time:'18:00', venue:'Boston (Foxborough)', home:'SCO', away:'MAR', homeScore:0, awayScore:1 },
  { id:16, stage:'group', group:'C', matchday:2, date:'2026-06-20', time:'20:30', venue:'Philadelphia', home:'BRA', away:'HAI', homeScore:3, awayScore:0 },
  { id:17, stage:'group', group:'C', matchday:3, date:'2026-06-24', time:'18:00', venue:'Miami (Miami Gardens)', home:'SCO', away:'BRA', homeScore:0, awayScore:3 },
  { id:18, stage:'group', group:'C', matchday:3, date:'2026-06-24', time:'18:00', venue:'Atlanta', home:'MAR', away:'HAI', homeScore:4, awayScore:2 },

  // ── D 组 ──
  { id:19, stage:'group', group:'D', matchday:1, date:'2026-06-13', time:'18:00', venue:'Los Angeles (Inglewood)', home:'USA', away:'PAR', homeScore:4, awayScore:1 },
  { id:20, stage:'group', group:'D', matchday:1, date:'2026-06-14', time:'21:00', venue:'Vancouver', home:'AUS', away:'TUR', homeScore:2, awayScore:0 },
  { id:21, stage:'group', group:'D', matchday:2, date:'2026-06-19', time:'12:00', venue:'Seattle', home:'USA', away:'AUS', homeScore:2, awayScore:0 },
  { id:22, stage:'group', group:'D', matchday:2, date:'2026-06-20', time:'20:00', venue:'San Francisco Bay Area (Santa Clara)', home:'TUR', away:'PAR', homeScore:0, awayScore:1 },
  { id:23, stage:'group', group:'D', matchday:3, date:'2026-06-25', time:'19:00', venue:'Los Angeles (Inglewood)', home:'TUR', away:'USA', homeScore:null, awayScore:null },
  { id:24, stage:'group', group:'D', matchday:3, date:'2026-06-25', time:'19:00', venue:'San Francisco Bay Area (Santa Clara)', home:'PAR', away:'AUS', homeScore:null, awayScore:null },

  // ── E 组 ──
  { id:25, stage:'group', group:'E', matchday:1, date:'2026-06-14', time:'12:00', venue:'Houston', home:'GER', away:'CUW', homeScore:7, awayScore:1 },
  { id:26, stage:'group', group:'E', matchday:1, date:'2026-06-14', time:'19:00', venue:'Philadelphia', home:'CIV', away:'ECU', homeScore:1, awayScore:0 },
  { id:27, stage:'group', group:'E', matchday:2, date:'2026-06-20', time:'16:00', venue:'Toronto', home:'GER', away:'CIV', homeScore:2, awayScore:1 },
  { id:28, stage:'group', group:'E', matchday:2, date:'2026-06-21', time:'19:00', venue:'Kansas City', home:'ECU', away:'CUW', homeScore:0, awayScore:0 },
  { id:29, stage:'group', group:'E', matchday:3, date:'2026-06-25', time:'16:00', venue:'Philadelphia', home:'CUW', away:'CIV', homeScore:null, awayScore:null },
  { id:30, stage:'group', group:'E', matchday:3, date:'2026-06-25', time:'16:00', venue:'New York/New Jersey (East Rutherford)', home:'ECU', away:'GER', homeScore:null, awayScore:null },

  // ── F 组 ──
  { id:31, stage:'group', group:'F', matchday:1, date:'2026-06-14', time:'15:00', venue:'Dallas (Arlington)', home:'NED', away:'JPN', homeScore:2, awayScore:2 },
  { id:32, stage:'group', group:'F', matchday:1, date:'2026-06-15', time:'20:00', venue:'Monterrey (Guadalupe)', home:'SWE', away:'TUN', homeScore:5, awayScore:1 },
  { id:33, stage:'group', group:'F', matchday:2, date:'2026-06-20', time:'12:00', venue:'Houston', home:'NED', away:'SWE', homeScore:5, awayScore:1 },
  { id:34, stage:'group', group:'F', matchday:2, date:'2026-06-21', time:'22:00', venue:'Monterrey (Guadalupe)', home:'TUN', away:'JPN', homeScore:0, awayScore:4 },
  { id:35, stage:'group', group:'F', matchday:3, date:'2026-06-25', time:'18:00', venue:'Dallas (Arlington)', home:'JPN', away:'SWE', homeScore:null, awayScore:null },
  { id:36, stage:'group', group:'F', matchday:3, date:'2026-06-25', time:'18:00', venue:'Kansas City', home:'TUN', away:'NED', homeScore:null, awayScore:null },

  // ── G 组 ──
  { id:37, stage:'group', group:'G', matchday:1, date:'2026-06-15', time:'12:00', venue:'Seattle', home:'BEL', away:'EGY', homeScore:1, awayScore:1 },
  { id:38, stage:'group', group:'G', matchday:1, date:'2026-06-16', time:'18:00', venue:'Los Angeles (Inglewood)', home:'IRN', away:'NZL', homeScore:2, awayScore:2 },
  { id:39, stage:'group', group:'G', matchday:2, date:'2026-06-21', time:'12:00', venue:'Los Angeles (Inglewood)', home:'BEL', away:'IRN', homeScore:0, awayScore:0 },
  { id:40, stage:'group', group:'G', matchday:2, date:'2026-06-22', time:'18:00', venue:'Vancouver', home:'NZL', away:'EGY', homeScore:1, awayScore:3 },
  { id:41, stage:'group', group:'G', matchday:3, date:'2026-06-26', time:'20:00', venue:'Seattle', home:'EGY', away:'IRN', homeScore:null, awayScore:null },
  { id:42, stage:'group', group:'G', matchday:3, date:'2026-06-26', time:'20:00', venue:'Vancouver', home:'NZL', away:'BEL', homeScore:null, awayScore:null },

  // ── H 组 ──
  { id:43, stage:'group', group:'H', matchday:1, date:'2026-06-15', time:'12:00', venue:'Atlanta', home:'ESP', away:'CPV', homeScore:0, awayScore:0 },
  { id:44, stage:'group', group:'H', matchday:1, date:'2026-06-15', time:'18:00', venue:'Miami (Miami Gardens)', home:'KSA', away:'URU', homeScore:1, awayScore:1 },
  { id:45, stage:'group', group:'H', matchday:2, date:'2026-06-21', time:'12:00', venue:'Atlanta', home:'ESP', away:'KSA', homeScore:4, awayScore:0 },
  { id:46, stage:'group', group:'H', matchday:2, date:'2026-06-21', time:'18:00', venue:'Miami (Miami Gardens)', home:'URU', away:'CPV', homeScore:2, awayScore:2 },
  { id:47, stage:'group', group:'H', matchday:3, date:'2026-06-26', time:'19:00', venue:'Houston', home:'CPV', away:'KSA', homeScore:null, awayScore:null },
  { id:48, stage:'group', group:'H', matchday:3, date:'2026-06-26', time:'18:00', venue:'Guadalajara (Zapopan)', home:'URU', away:'ESP', homeScore:null, awayScore:null },

  // ── I 组 ──
  { id:49, stage:'group', group:'I', matchday:1, date:'2026-06-16', time:'15:00', venue:'New York/New Jersey (East Rutherford)', home:'FRA', away:'SEN', homeScore:3, awayScore:1 },
  { id:50, stage:'group', group:'I', matchday:1, date:'2026-06-16', time:'18:00', venue:'Boston (Foxborough)', home:'IRQ', away:'NOR', homeScore:1, awayScore:4 },
  { id:51, stage:'group', group:'I', matchday:2, date:'2026-06-22', time:'17:00', venue:'Philadelphia', home:'FRA', away:'IRQ', homeScore:3, awayScore:0 },
  { id:52, stage:'group', group:'I', matchday:2, date:'2026-06-23', time:'20:00', venue:'New York/New Jersey (East Rutherford)', home:'NOR', away:'SEN', homeScore:3, awayScore:2 },
  { id:53, stage:'group', group:'I', matchday:3, date:'2026-06-26', time:'15:00', venue:'Boston (Foxborough)', home:'NOR', away:'FRA', homeScore:null, awayScore:null },
  { id:54, stage:'group', group:'I', matchday:3, date:'2026-06-26', time:'15:00', venue:'Toronto', home:'SEN', away:'IRQ', homeScore:null, awayScore:null },

  // ── J 组 ──
  { id:55, stage:'group', group:'J', matchday:1, date:'2026-06-17', time:'20:00', venue:'Kansas City', home:'ARG', away:'ALG', homeScore:3, awayScore:0 },
  { id:56, stage:'group', group:'J', matchday:1, date:'2026-06-17', time:'21:00', venue:'San Francisco Bay Area (Santa Clara)', home:'AUT', away:'JOR', homeScore:3, awayScore:1 },
  { id:57, stage:'group', group:'J', matchday:2, date:'2026-06-22', time:'12:00', venue:'Dallas (Arlington)', home:'ARG', away:'AUT', homeScore:2, awayScore:0 },
  { id:58, stage:'group', group:'J', matchday:2, date:'2026-06-23', time:'20:00', venue:'San Francisco Bay Area (Santa Clara)', home:'JOR', away:'ALG', homeScore:1, awayScore:2 },
  { id:59, stage:'group', group:'J', matchday:3, date:'2026-06-27', time:'21:00', venue:'Kansas City', home:'ALG', away:'AUT', homeScore:null, awayScore:null },
  { id:60, stage:'group', group:'J', matchday:3, date:'2026-06-27', time:'21:00', venue:'Dallas (Arlington)', home:'JOR', away:'ARG', homeScore:null, awayScore:null },

  // ── K 组 ──
  { id:61, stage:'group', group:'K', matchday:1, date:'2026-06-17', time:'12:00', venue:'Houston', home:'POR', away:'COD', homeScore:1, awayScore:1 },
  { id:62, stage:'group', group:'K', matchday:1, date:'2026-06-18', time:'20:00', venue:'Mexico City', home:'UZB', away:'COL', homeScore:1, awayScore:3 },
  { id:63, stage:'group', group:'K', matchday:2, date:'2026-06-23', time:'12:00', venue:'Houston', home:'POR', away:'UZB', homeScore:5, awayScore:0 },
  { id:64, stage:'group', group:'K', matchday:2, date:'2026-06-24', time:'20:00', venue:'Guadalajara (Zapopan)', home:'COL', away:'COD', homeScore:1, awayScore:0 },
  { id:65, stage:'group', group:'K', matchday:3, date:'2026-06-27', time:'19:30', venue:'Miami (Miami Gardens)', home:'COL', away:'POR', homeScore:null, awayScore:null },
  { id:66, stage:'group', group:'K', matchday:3, date:'2026-06-27', time:'19:30', venue:'Atlanta', home:'COD', away:'UZB', homeScore:null, awayScore:null },

  // ── L 组 ──
  { id:67, stage:'group', group:'L', matchday:1, date:'2026-06-17', time:'15:00', venue:'Dallas (Arlington)', home:'ENG', away:'CRO', homeScore:4, awayScore:2 },
  { id:68, stage:'group', group:'L', matchday:1, date:'2026-06-17', time:'19:00', venue:'Toronto', home:'GHA', away:'PAN', homeScore:1, awayScore:0 },
  { id:69, stage:'group', group:'L', matchday:2, date:'2026-06-23', time:'16:00', venue:'Boston (Foxborough)', home:'ENG', away:'GHA', homeScore:0, awayScore:0 },
  { id:70, stage:'group', group:'L', matchday:2, date:'2026-06-23', time:'19:00', venue:'Toronto', home:'PAN', away:'CRO', homeScore:0, awayScore:1 },
  { id:71, stage:'group', group:'L', matchday:3, date:'2026-06-27', time:'17:00', venue:'New York/New Jersey (East Rutherford)', home:'PAN', away:'ENG', homeScore:null, awayScore:null },
  { id:72, stage:'group', group:'L', matchday:3, date:'2026-06-27', time:'17:00', venue:'Philadelphia', home:'CRO', away:'GHA', homeScore:null, awayScore:null },

  // ── 32 强 ──
  { id:73, stage:'r32', date:'2026-06-28', time:'12:00', venue:'Los Angeles (Inglewood)', home:'2A', away:'2B', homeScore:null, awayScore:null },
  { id:74, stage:'r32', date:'2026-06-29', time:'16:30', venue:'Boston (Foxborough)', home:'1E', away:'3ABDF', homeScore:null, awayScore:null },
  { id:75, stage:'r32', date:'2026-06-29', time:'19:00', venue:'Monterrey (Guadalupe)', home:'1F', away:'2C', homeScore:null, awayScore:null },
  { id:76, stage:'r32', date:'2026-06-29', time:'12:00', venue:'Houston', home:'1C', away:'2F', homeScore:null, awayScore:null },
  { id:77, stage:'r32', date:'2026-06-30', time:'17:00', venue:'New York/New Jersey (East Rutherford)', home:'1I', away:'3CDFH', homeScore:null, awayScore:null },
  { id:78, stage:'r32', date:'2026-06-30', time:'12:00', venue:'Dallas (Arlington)', home:'2E', away:'2I', homeScore:null, awayScore:null },
  { id:79, stage:'r32', date:'2026-06-30', time:'19:00', venue:'Mexico City', home:'1A', away:'3CEFI', homeScore:null, awayScore:null },
  { id:80, stage:'r32', date:'2026-07-01', time:'12:00', venue:'Atlanta', home:'1L', away:'3EHIJ', homeScore:null, awayScore:null },
  { id:81, stage:'r32', date:'2026-07-01', time:'17:00', venue:'San Francisco Bay Area (Santa Clara)', home:'1D', away:'3BEFIJ', homeScore:null, awayScore:null },
  { id:82, stage:'r32', date:'2026-07-01', time:'13:00', venue:'Seattle', home:'1G', away:'3AEHJ', homeScore:null, awayScore:null },
  { id:83, stage:'r32', date:'2026-07-02', time:'19:00', venue:'Toronto', home:'2K', away:'2L', homeScore:null, awayScore:null },
  { id:84, stage:'r32', date:'2026-07-02', time:'12:00', venue:'Los Angeles (Inglewood)', home:'1H', away:'2J', homeScore:null, awayScore:null },
  { id:85, stage:'r32', date:'2026-07-02', time:'20:00', venue:'Vancouver', home:'1B', away:'3EFGIJ', homeScore:null, awayScore:null },
  { id:86, stage:'r32', date:'2026-07-03', time:'18:00', venue:'Miami (Miami Gardens)', home:'1J', away:'2H', homeScore:null, awayScore:null },
  { id:87, stage:'r32', date:'2026-07-03', time:'20:30', venue:'Kansas City', home:'1K', away:'3DEIJL', homeScore:null, awayScore:null },
  { id:88, stage:'r32', date:'2026-07-03', time:'13:00', venue:'Dallas (Arlington)', home:'2D', away:'2G', homeScore:null, awayScore:null },

  // ── 16 强 ──
  { id:89, stage:'r16', date:'2026-07-04', time:'17:00', venue:'Philadelphia', home:'W74', away:'W77', homeScore:null, awayScore:null },
  { id:90, stage:'r16', date:'2026-07-04', time:'12:00', venue:'Houston', home:'W73', away:'W75', homeScore:null, awayScore:null },
  { id:91, stage:'r16', date:'2026-07-05', time:'16:00', venue:'New York/New Jersey (East Rutherford)', home:'W76', away:'W78', homeScore:null, awayScore:null },
  { id:92, stage:'r16', date:'2026-07-05', time:'18:00', venue:'Mexico City', home:'W79', away:'W80', homeScore:null, awayScore:null },
  { id:93, stage:'r16', date:'2026-07-06', time:'14:00', venue:'Dallas (Arlington)', home:'W83', away:'W84', homeScore:null, awayScore:null },
  { id:94, stage:'r16', date:'2026-07-06', time:'17:00', venue:'Seattle', home:'W81', away:'W82', homeScore:null, awayScore:null },
  { id:95, stage:'r16', date:'2026-07-07', time:'12:00', venue:'Atlanta', home:'W86', away:'W88', homeScore:null, awayScore:null },
  { id:96, stage:'r16', date:'2026-07-07', time:'13:00', venue:'Vancouver', home:'W85', away:'W87', homeScore:null, awayScore:null },

  // ── 8 强 ──
  { id:97, stage:'qf', date:'2026-07-09', time:'16:00', venue:'Boston (Foxborough)', home:'W89', away:'W90', homeScore:null, awayScore:null },
  { id:98, stage:'qf', date:'2026-07-10', time:'12:00', venue:'Los Angeles (Inglewood)', home:'W93', away:'W94', homeScore:null, awayScore:null },
  { id:99, stage:'qf', date:'2026-07-11', time:'17:00', venue:'Miami (Miami Gardens)', home:'W91', away:'W92', homeScore:null, awayScore:null },
  { id:100, stage:'qf', date:'2026-07-11', time:'20:00', venue:'Kansas City', home:'W95', away:'W96', homeScore:null, awayScore:null },

  // ── 半决赛 ──
  { id:101, stage:'sf', date:'2026-07-14', time:'14:00', venue:'Dallas (Arlington)', home:'W97', away:'W98', homeScore:null, awayScore:null },
  { id:102, stage:'sf', date:'2026-07-15', time:'15:00', venue:'Atlanta', home:'W99', away:'W100', homeScore:null, awayScore:null },

  // ── 三四名 ──
  { id:103, stage:'third', date:'2026-07-18', time:'17:00', venue:'Miami (Miami Gardens)', home:'L101', away:'L102', homeScore:null, awayScore:null },

  // ── 决赛 ──
  { id:104, stage:'final', date:'2026-07-19', time:'15:00', venue:'New York/New Jersey (East Rutherford)', home:'W101', away:'W102', homeScore:null, awayScore:null },
];

const STAGE_NAMES = {
  group: '小组赛',
  r32:   '32 强',
  r16:   '16 强',
  qf:    '8 强',
  sf:    '半决赛',
  third: '三四名决赛',
  final: '决赛',
};

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'];
