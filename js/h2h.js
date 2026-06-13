// ============================================================
// 历史交锋数据库 (按字母顺序排列 key)
// ============================================================

const H2H = {
  // ── 重要交锋 ──
  'ARG-BRA': [
    { date:'2023-11', comp:'世界杯预选赛', score:'0-1', winner:'ARG' },
    { date:'2023-09', comp:'世界杯预选赛', score:'1-0', winner:'BRA' },
    { date:'2021-07', comp:'美洲杯决赛', score:'1-0', winner:'ARG' },
  ],
  'ARG-FRA': [
    { date:'2022-12', comp:'世界杯决赛', score:'3-3(点球4-2)', winner:'ARG' },
    { date:'2018-06', comp:'世界杯十六强', score:'3-4', winner:'FRA' },
  ],
  'BEL-ESP': [
    { date:'2021-10', comp:'欧国联半决赛', score:'2-3', winner:'ESP' },
  ],
  'BRA-ENG': [
    { date:'2024-03', comp:'友谊赛', score:'1-0', winner:'BRA' },
    { date:'2023-03', comp:'友谊赛', score:'2-2', winner:'draw' },
  ],
  'BRA-MAR': [
    { date:'2024-03', comp:'友谊赛', score:'1-0', winner:'BRA' },
  ],
  'BRA-SCO': [
    { date:'2024-03', comp:'友谊赛', score:'2-0', winner:'BRA' },
  ],
  'CAN-BIH': [
    { date:'2026-06-12', comp:'世界杯小组赛', score:'1-1', winner:'draw' },
  ],
  'CIV-ECU': [
    { date:'2022-11', comp:'世界杯小组赛', score:'1-2', winner:'ECU' },
  ],
  'COL-POR': [
    { date:'2024-07', comp:'美洲杯半决赛', score:'1-0', winner:'COL' },
  ],
  'CRO-ENG': [
    { date:'2018-07', comp:'世界杯半决赛', score:'2-1(加时)', winner:'CRO' },
    { date:'2021-06', comp:'欧洲杯小组赛', score:'1-0', winner:'ENG' },
  ],
  'CRO-GHA': [
    { date:'2022-11', comp:'世界杯小组赛', score:'0-0', winner:'draw' },
  ],
  'CRO-PAN': [
    { date:'2018-06', comp:'世界杯小组赛', score:'3-0', winner:'CRO' },
  ],
  'DEN-GER': [
    { date:'2024-06', comp:'友谊赛', score:'1-1', winner:'draw' },
  ],
  'ECU-GER': [
    { date:'2024-06', comp:'友谊赛', score:'0-3', winner:'GER' },
  ],
  'EGY-IRN': [
    { date:'2018-06', comp:'世界杯小组赛', score:'0-1', winner:'IRN' },
  ],
  'ENG-CRO': [
    { date:'2018-07', comp:'世界杯半决赛', score:'1-2(加时)', winner:'CRO' },
    { date:'2021-06', comp:'欧洲杯小组赛', score:'1-0', winner:'ENG' },
  ],
  'ENG-GHA': [
    { date:'2011-03', comp:'友谊赛', score:'1-1', winner:'draw' },
  ],
  'ENG-PAN': [
    { date:'2018-06', comp:'世界杯小组赛', score:'6-1', winner:'ENG' },
  ],
  'ESP-CPV': [],
  'ESP-KSA': [
    { date:'2022-11', comp:'世界杯小组赛', score:'1-2', winner:'KSA' },
  ],
  'ESP-URU': [
    { date:'2024-06', comp:'友谊赛', score:'0-1', winner:'URU' },
  ],
  'ESP-NED': [
    { date:'2014-06', comp:'世界杯小组赛', score:'1-5', winner:'NED' },
    { date:'2010-07', comp:'世界杯决赛', score:'1-0(加时)', winner:'ESP' },
  ],
  'FRA-SEN': [
    { date:'2022-11', comp:'世界杯小组赛', score:'1-0', winner:'FRA' },
  ],
  'FRA-IRQ': [],
  'FRA-NOR': [
    { date:'2022-06', comp:'友谊赛', score:'2-1', winner:'FRA' },
  ],
  'GER-CIV': [
    { date:'2014-06', comp:'世界杯小组赛', score:'2-2', winner:'draw' },
  ],
  'GER-CUW': [],
  'GHA-PAN': [
    { date:'2006-06', comp:'世界杯小组赛', score:'0-2', winner:'GHA' },
  ],
  'IRN-BEL': [
    { date:'2022-11', comp:'世界杯小组赛', score:'0-2', winner:'BEL' },
  ],
  'IRQ-NOR': [],
  'JPN-NED': [
    { date:'2010-06', comp:'世界杯小组赛', score:'0-1', winner:'NED' },
  ],
  'JPN-SWE': [
    { date:'2011-01', comp:'友谊赛', score:'2-1', winner:'JPN' },
  ],
  'JPN-TUN': [
    { date:'2023-03', comp:'友谊赛', score:'2-0', winner:'JPN' },
  ],
  'KOR-CZE': [
    { date:'2026-06-11', comp:'世界杯小组赛', score:'2-1', winner:'KOR' },
  ],
  'KOR-RSA': [],
  'MEX-KOR': [
    { date:'2018-06', comp:'世界杯小组赛', score:'1-2', winner:'MEX' },
  ],
  'MEX-RSA': [
    { date:'2026-06-11', comp:'世界杯小组赛', score:'2-0', winner:'MEX' },
  ],
  'NED-JPN': [
    { date:'2010-06', comp:'世界杯小组赛', score:'1-0', winner:'NED' },
  ],
  'NED-SWE': [
    { date:'2018-10', comp:'欧国联', score:'3-0', winner:'NED' },
  ],
  'NED-TUN': [
    { date:'2018-06', comp:'世界杯小组赛', score:'1-0', winner:'NED' },
  ],
  'NOR-FRA': [
    { date:'2022-06', comp:'友谊赛', score:'1-2', winner:'FRA' },
  ],
  'NZL-BEL': [],
  'NZL-EGY': [],
  'PAR-AUS': [],
  'POR-COL': [
    { date:'2024-07', comp:'美洲杯半决赛', score:'0-1', winner:'COL' },
  ],
  'POR-COD': [],
  'QAT-SUI': [
    { date:'2022-11', comp:'世界杯小组赛', score:'0-1', winner:'SUI' },
  ],
  'SEN-IRQ': [],
  'SWE-TUN': [
    { date:'2018-06', comp:'世界杯小组赛', score:'1-0', winner:'SWE' },
  ],
  'SUI-BIH': [],
  'TUR-USA': [],
  'URU-CPV': [],
  'URU-ESP': [
    { date:'2024-06', comp:'友谊赛', score:'1-0', winner:'URU' },
  ],
  'USA-PAR': [
    { date:'2026-06-12', comp:'世界杯小组赛', score:'3-0', winner:'USA' },
  ],
  'USA-AUS': [
    { date:'2023-06', comp:'友谊赛', score:'2-0', winner:'USA' },
  ],
};

function getH2H(codeA, codeB) {
  const key1 = [codeA, codeB].sort().join('-');
  const key2 = [codeB, codeA].sort().join('-');
  const meetings = H2H[key1] || H2H[key2] || [];
  let teamAWins = 0, draws = 0, teamBWins = 0;
  meetings.forEach(m => {
    if (m.winner === codeA) teamAWins++;
    else if (m.winner === 'draw') draws++;
    else if (m.winner === codeB) teamBWins++;
  });
  return {
    total: meetings.length, teamAWins, draws, teamBWins, meetings,
    trend: meetings.length > 0 ? (teamAWins - teamBWins) / meetings.length : 0,
  };
}
