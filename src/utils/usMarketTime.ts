/**
 * Utility: usMarketTime.ts
 * รวบรวมฟังก์ชันคำนวณเวลาทำการตลาดหุ้นสหรัฐฯ (NYSE/NASDAQ)
 * ตรวจจับ Daylight Saving Time (DST) และคำนวณช่วงเวลาเข้าซื้อที่ปรับตามฤดูกาล
 */

export interface TradingWindowItem {
  id: number;
  timeRange: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  title: string;
  desc: string;
  badgeLabel: string;
  badgeColor: 'primary' | 'success' | 'warning' | 'error' | 'default';
  isDowntrend: boolean;
}

export interface UsMarketSeasonInfo {
  isDst: boolean;
  tzName: string;
  seasonName: string;
  seasonPeriod: string;
  marketOpenTimeStr: string;
  marketCloseTimeStr: string;
  marketHoursDesc: string;
  isMarketOpenNow: boolean;
  windows: TradingWindowItem[];
}

export interface ActiveTradingWindow {
  text: string;
  isHot: boolean;
  windowId: number;
}

/**
 * ตรวจสอบว่าวันที่ที่ระบุอยู่ในช่วงเวลา Daylight Saving Time (DST) ของสหรัฐฯ หรือไม่
 * โดยใช้ Intl.DateTimeFormat ของ Timezone America/New_York (EDT = DST, EST = Standard Time)
 * 
 * @param date - วันที่ที่ต้องการตรวจสอบ (ค่าเริ่มต้น: เวลาปัจจุบัน)
 * @returns true หากอยู่ในช่วง DST (ฤดูร้อน มี.ค. - พ.ย.), false หากเป็น Standard Time (ฤดูหนาว พ.ย. - มี.ค.)
 */
export const isUsDaylightSavingTime = (date: Date = new Date()): boolean => {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      timeZoneName: 'short',
      hour: 'numeric',
      minute: 'numeric',
    }).formatToParts(date);

    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    const tzName = tzPart ? tzPart.value : '';
    return tzName === 'EDT' || tzName.includes('Daylight');
  } catch (error) {
    console.warn('Could not determine US DST from Intl, falling back to month check:', error);
    // Fallback: มีนาคม (เดือน 2) ถึง พฤศจิกายน (เดือน 10)
    const month = date.getMonth();
    return month >= 2 && month <= 10;
  }
};

/**
 * ตรวจสอบว่าตลาดหุ้นสหรัฐฯ (NYSE/NASDAQ) กำลังเปิดทำการอยู่ ณ เวลาปัจจุบันหรือไม่ (เวลาไทย)
 * 
 * - ช่วง DST (มี.ค. - พ.ย.): เปิด 20:30 - 03:00 น.
 * - ช่วง Standard Time (พ.ย. - มี.ค.): เปิด 21:30 - 04:00 น.
 * - ไม่รวมวันเสาร์และวันอาทิตย์ (ตามเวลาสหรัฐฯ)
 * 
 * @param date - เวลาปัจจุบัน
 * @returns true หากตลาดเปิดทำการอยู่
 */
export const isUsMarketOpen = (date: Date = new Date()): boolean => {
  // ดึงเวลาปัจจุบันในนิวยอร์ก (America/New_York)
  const nyDateStr = date.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const nyDate = new Date(nyDateStr);

  const nyDay = nyDate.getDay();
  // ตลาดปิดทำการวันเสาร์ (6) และวันอาทิตย์ (0)
  if (nyDay === 0 || nyDay === 6) {
    return false;
  }

  // เวลาทำการปกติของตลาดสหรัฐฯ คือ 09:30 - 16:00 น. (ET)
  const nyHours = nyDate.getHours();
  const nyMinutes = nyDate.getMinutes();
  const currentNyMinutes = nyHours * 60 + nyMinutes;

  const marketOpenMinutes = 9 * 60 + 30; // 09:30
  const marketCloseMinutes = 16 * 60; // 16:00

  return currentNyMinutes >= marketOpenMinutes && currentNyMinutes < marketCloseMinutes;
};

/**
 * ดึงข้อมูลฤดูกาลและช่วงเวลาทำการของตลาดสหรัฐฯ ตามเดือนปัจจุบัน
 * พร้อมคำนวณช่วงเวลาเข้าซื้อที่ปรับตามเวลาของแต่ละช่วงเดือน
 * 
 * @param date - วันที่และเวลาปัจจุบัน
 * @returns วัตถุ UsMarketSeasonInfo สรุปข้อมูลฤดูกาล เวลาเปิดปิด และช่วงเวลาเข้าซื้อ
 */
export const getUsMarketSeasonInfo = (date: Date = new Date()): UsMarketSeasonInfo => {
  const isDst = isUsDaylightSavingTime(date);
  const isMarketOpenNow = isUsMarketOpen(date);

  // กำหนดเวลาเปิด-ปิดตลาดตามฤดูกาล
  const marketOpenTimeStr = isDst ? '20:30' : '21:30';
  const marketCloseTimeStr = isDst ? '03:00' : '04:00';
  const seasonName = isDst ? 'Daylight Saving Time (DST)' : 'Standard Time (เวลาปกติ)';
  const seasonPeriod = isDst ? 'มี.ค. - พ.ย.' : 'พ.ย. - มี.ค.';

  // คำนวณช่วงเวลาเข้าซื้อ:
  // - ช่วง DST (มี.ค. - พ.ย. เช่น เดือนปัจจุบัน): 03:00-03:05, 03:25-03:30, 04:25-04:30
  // - ช่วง Standard Time (พ.ย. - มี.ค.): ปรับช้าลง 1 ชั่วโมง ➔ 04:00-04:05, 04:25-04:30, 05:25-05:30
  const hourOffset = isDst ? 0 : 1;

  const windows: TradingWindowItem[] = [
    {
      id: 1,
      timeRange: `${3 + hourOffset}:00 - ${3 + hourOffset}:05`,
      startHour: 3 + hourOffset,
      startMinute: 0,
      endHour: 3 + hourOffset,
      endMinute: 5,
      title: 'จังหวะเข้าซื้อที่ดีที่สุด (Primary Entry)',
      desc: isDst
        ? 'ช่วงปิดตลาดรอบ DST (03:00 น.)'
        : 'ช่วงปิดตลาดรอบ Standard Time (04:00 น.)',
      badgeLabel: 'Best Time',
      badgeColor: 'success',
      isDowntrend: false,
    },
    {
      id: 2,
      timeRange: `${3 + hourOffset}:25 - ${3 + hourOffset}:30`,
      startHour: 3 + hourOffset,
      startMinute: 25,
      endHour: 3 + hourOffset,
      endMinute: 30,
      title: 'เฉพาะเมื่อกราฟเป็นขาลง (Downtrend 1)',
      desc: 'รอสัญญาณแท่งเทียนรอบย่อ',
      badgeLabel: 'Downtrend',
      badgeColor: 'warning',
      isDowntrend: true,
    },
    {
      id: 3,
      timeRange: `${4 + hourOffset}:25 - ${4 + hourOffset}:30`,
      startHour: 4 + hourOffset,
      startMinute: 25,
      endHour: 4 + hourOffset,
      endMinute: 30,
      title: 'เฉพาะเมื่อกราฟเป็นขาลง (Downtrend 2)',
      desc: 'รอสัญญาณแท่งเทียนรอบย่อถัดไป',
      badgeLabel: 'Downtrend',
      badgeColor: 'warning',
      isDowntrend: true,
    },
  ];

  return {
    isDst,
    tzName: isDst ? 'EDT' : 'EST',
    seasonName,
    seasonPeriod,
    marketOpenTimeStr,
    marketCloseTimeStr,
    marketHoursDesc: `${marketOpenTimeStr} - ${marketCloseTimeStr} น.`,
    isMarketOpenNow,
    windows,
  };
};

/**
 * ตรวจสอบว่าเวลาปัจจุบัน (Date) ตรงกับช่วงเวลาเข้าซื้อช่วงใดหรือไม่
 * 
 * @param date - เวลาปัจจุบัน
 * @param seasonInfo - ข้อมูลช่วงเวลาและฤดูกาล
 * @returns วัตถุแจ้งเตือนสถานะ หรือ null หากไม่อยู่ในช่วงเวลา
 */
export const checkActiveTradingWindow = (
  date: Date,
  seasonInfo: UsMarketSeasonInfo
): { text: string; isHot: boolean; windowId: number } | null => {
  const currentHours = date.getHours();
  const currentMinutes = date.getMinutes();
  const currentSeconds = date.getSeconds();

  const currentTotalSeconds = currentHours * 3600 + currentMinutes * 60 + currentSeconds;

  for (const w of seasonInfo.windows) {
    const startSec = w.startHour * 3600 + w.startMinute * 60;
    const endSec = w.endHour * 3600 + w.endMinute * 60;

    // รองรับทั้งเวลาเช้ามืด (03:xx / 04:xx / 05:xx) และบ่าย (15:xx / 16:xx / 17:xx)
    const afternoonStartSec = (w.startHour + 12) * 3600 + w.startMinute * 60;
    const afternoonEndSec = (w.endHour + 12) * 3600 + w.endMinute * 60;

    const isMatchMorning = currentTotalSeconds >= startSec && currentTotalSeconds <= endSec;
    const isMatchAfternoon = currentTotalSeconds >= afternoonStartSec && currentTotalSeconds <= afternoonEndSec;

    if (isMatchMorning || isMatchAfternoon) {
      return {
        text: `⚡ กำลังอยู่ในช่วง ${w.timeRange} น. (${w.badgeLabel})!`,
        isHot: true,
        windowId: w.id,
      };
    }
  }

  return null;
};
