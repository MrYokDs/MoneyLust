/**
 * Utility: finnhubMarketHolidays.ts
 * จัดการข้อมูลวันหยุดตลาดหุ้นสหรัฐฯ (NYSE/NASDAQ)
 * รองรับการดึงข้อมูลจาก Finnhub API (/stock/market-holiday?exchange=US)
 * พร้อมระบบ Fallback ปฏิทินวันหยุดอัตโนมัติ และระบบตรวจสอบว่าวันถัดไปตลาดปิดหรือไม่ (รวมเสาร์-อาทิตย์)
 */

export interface MarketHolidayItem {
  eventName: string;
  eventNameTh: string;
  atDate: string; // YYYY-MM-DD (US date)
  thaiDateStr: string; // วันที่ในเวลาไทย เช่น "19 ม.ค. 2026 (คืนวันจันทร์)"
  tradingHour: string; // "" = ปิดเต็มวัน, "09:30-13:00" = ปิดเร็วกว่าปกติ
  isClosedAllDay: boolean;
  isEarlyClose: boolean;
  isBankHolidayOnly: boolean; // วันหยุดเฉพาะธนาคารสหรัฐฯ (ตลาดหุ้นเปิดปกติ)
  descriptionTh: string;
}

export interface UpcomingClosureCheck {
  isClosedTomorrow: boolean;
  isClosedToday: boolean;
  reason: string;
  closureType: 'weekend' | 'holiday' | 'none';
  holidayName?: string;
  thaiDateStr?: string;
  adviceText: string;
}

const STORAGE_HOLIDAYS_KEY = 'moneylust_finnhub_holidays_cache_v2';
const STORAGE_API_KEY = 'moneylust_finnhub_api_token';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 ชั่วโมง

/**
 * คำนวณวันศุกร์ประเสริฐ (Good Friday) ตามขั้นตอนวิธีคำนวณวันอีสเตอร์ (Anonymous Gregorian Algorithm)
 * 
 * @param year - ปี ค.ศ.
 * @returns วันที่ของ Good Friday ในรูปแบบ Date
 */
export const calculateGoodFriday = (year: number): Date => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = มี.ค., 4 = เม.ย.
  const day = ((h + l - 7 * m + 114) % 31) + 1; // วันที่ Easter Sunday

  const easterDate = new Date(Date.UTC(year, month - 1, day));
  // Good Friday คือ 2 วันก่อนหน้า Easter Sunday
  const goodFriday = new Date(easterDate);
  goodFriday.setUTCDate(easterDate.getUTCDate() - 2);
  return goodFriday;
};

/**
 * แปลงชื่อวันหยุดภาษาอังกฤษของตลาดหุ้นสหรัฐฯ เป็นภาษาไทย
 * 
 * @param eventName - ชื่อวันหยุดจาก Finnhub หรือปฏิทินสหรัฐฯ
 * @returns ชื่อวันหยุดภาษาไทยที่กระชับ เข้าใจง่าย
 */
export const translateHolidayName = (eventName: string): { th: string; desc: string } => {
  const lower = eventName.toLowerCase();
  if (lower.includes("new year")) {
    return { th: 'วันขึ้นปีใหม่ (New Year\'s Day)', desc: 'ตลาดปิดทำการต้อนรับวันปีใหม่' };
  }
  if (lower.includes("martin luther king") || lower.includes("mlk")) {
    return { th: 'วันมาร์ติน ลูเธอร์ คิง จูเนียร์ (MLK Day)', desc: 'วันรำลึก มาร์ติน ลูเธอร์ คิง จูเนียร์' };
  }
  if (lower.includes("president") || lower.includes("washington")) {
    return { th: 'วันประธานาธิบดี (Presidents\' Day)', desc: 'วันรำลึกประธานาธิบดีสหรัฐฯ' };
  }
  if (lower.includes("good friday")) {
    return { th: 'วันศุกร์ประเสริฐ (Good Friday)', desc: 'วันสำคัญทางศาสนาคริสต์ก่อนวันอีสเตอร์' };
  }
  if (lower.includes("memorial")) {
    return { th: 'วันรำลึกผู้เสียสละชีพ (Memorial Day)', desc: 'วันรำลึกถึงทหารผู้เสียสละชีพ' };
  }
  if (lower.includes("juneteenth")) {
    return { th: 'วันปลดปล่อยทาส (Juneteenth)', desc: 'วันประกาศอิสรภาพแห่งชาติ Juneteenth' };
  }
  if (lower.includes("independence") || lower.includes("4th of july")) {
    return { th: 'วันชาติสหรัฐฯ (Independence Day)', desc: 'วันประกาศอิสรภาพ 4 กรกฎาคม' };
  }
  if (lower.includes("labor")) {
    return { th: 'วันแรงงานสหรัฐฯ (Labor Day)', desc: 'วันแรงงานแห่งชาติสหรัฐอเมริกา' };
  }
  if (lower.includes("columbus") || lower.includes("indigenous")) {
    return { th: 'วันโคลัมบัส (Columbus Day)', desc: 'วันหยุดธนาคารสหรัฐฯ (ตลาดหุ้นเปิดทำการปกติ)' };
  }
  if (lower.includes("veteran")) {
    return { th: 'วันทหารผ่านศึก (Veterans Day)', desc: 'วันหยุดธนาคารสหรัฐฯ (ตลาดหุ้นเปิดทำการปกติ)' };
  }
  if (lower.includes("day after thanksgiving") || lower.includes("black friday")) {
    return { th: 'วันหลังวันขอบคุณพระเจ้า (Day After Thanksgiving)', desc: 'เปิดทำการครึ่งวัน (ปิด 13:00 น. สหรัฐฯ)' };
  }
  if (lower.includes("thanksgiving")) {
    return { th: 'วันขอบคุณพระเจ้า (Thanksgiving Day)', desc: 'วันขอบคุณพระเจ้า ตลาดปิดเต็มวัน' };
  }
  if (lower.includes("christmas eve")) {
    return { th: 'วันคริสต์มาสอีฟ (Christmas Eve)', desc: 'เปิดทำการครึ่งวัน (ปิด 13:00 น. สหรัฐฯ)' };
  }
  if (lower.includes("christmas")) {
    return { th: 'วันคริสต์มาส (Christmas Day)', desc: 'เทศกาลวันคริสต์มาส ตลาดปิดทำการ' };
  }
  return { th: eventName, desc: 'วันหยุดทำการพิเศษของตลาดหุ้นสหรัฐฯ' };
};

/**
 * สร้างวันที่แสดงผลภาษาไทยจาก YYYY-MM-DD
 * 
 * @param dateStr - สตริงวันที่ในรูปแบบ YYYY-MM-DD
 * @returns วันที่ภาษาไทย เช่น "19 ม.ค. 2026 (คืนวันจันทร์)"
 */
export const formatUsDateToThai = (dateStr: string): string => {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const monthNames = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
    ];
    const dayOfWeek = dayNames[date.getUTCDay()];
    const monthName = monthNames[m - 1];
    return `${d} ${monthName} ${y} (คืนวัน${dayOfWeek})`;
  } catch {
    return dateStr;
  }
};

/**
 * สร้างรายการวันหยุดตลาดหุ้นสหรัฐฯ ประจำปี (Built-in Calendar Fallback)
 * คำนวณวันหยุดทางการของตลาด NYSE/NASDAQ และวันหยุดธนาคารสหรัฐฯ ครบถ้วนตามมาตรฐาน
 * 
 * @param year - ปี ค.ศ. ที่ต้องการสร้างปฏิทิน
 * @returns รายการ MarketHolidayItem ที่พร้อมแสดงผลครบถ้วน 14 วันสำคัญ
 */
export const getFallbackHolidays = (year: number): MarketHolidayItem[] => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const makeDateStr = (m: number, d: number) => `${year}-${pad(m)}-${pad(d)}`;

  const findNthDayOfWeek = (month: number, targetDayOfWeek: number, n: number): number => {
    let count = 0;
    for (let day = 1; day <= 31; day++) {
      const dt = new Date(Date.UTC(year, month - 1, day));
      if (dt.getUTCMonth() !== month - 1) break;
      if (dt.getUTCDay() === targetDayOfWeek) {
        count++;
        if (count === n) return day;
      }
    }
    return 1;
  };

  const findLastDayOfWeek = (month: number, targetDayOfWeek: number): number => {
    let last = 1;
    for (let day = 1; day <= 31; day++) {
      const dt = new Date(Date.UTC(year, month - 1, day));
      if (dt.getUTCMonth() !== month - 1) break;
      if (dt.getUTCDay() === targetDayOfWeek) {
        last = day;
      }
    }
    return last;
  };

  const holidaysRaw: { name: string; date: string; hour: string; isBankOnly?: boolean }[] = [];

  // 1. New Year's Day (1 ม.ค.)
  const nyDate = new Date(Date.UTC(year, 0, 1));
  const nyDay = nyDate.getUTCDay();
  const nyObserved = nyDay === 0 ? makeDateStr(1, 2) : (nyDay === 6 ? makeDateStr(1, 1) : makeDateStr(1, 1));
  holidaysRaw.push({ name: "New Year's Day", date: nyObserved, hour: "" });

  // 2. Martin Luther King Jr. Day (วันจันทร์ที่ 3 ของเดือน ม.ค.)
  const mlkDay = findNthDayOfWeek(1, 1, 3);
  holidaysRaw.push({ name: "Martin Luther King, Jr. Day", date: makeDateStr(1, mlkDay), hour: "" });

  // 3. Washington's Birthday / Presidents' Day (วันจันทร์ที่ 3 ของเดือน ก.พ.)
  const presDay = findNthDayOfWeek(2, 1, 3);
  holidaysRaw.push({ name: "Presidents' Day", date: makeDateStr(2, presDay), hour: "" });

  // 4. Good Friday (วันศุกร์ก่อนวันอีสเตอร์)
  const gf = calculateGoodFriday(year);
  const gfMonth = gf.getUTCMonth() + 1;
  const gfDay = gf.getUTCDate();
  holidaysRaw.push({ name: "Good Friday", date: makeDateStr(gfMonth, gfDay), hour: "" });

  // 5. Memorial Day (วันจันทร์สุดท้ายของเดือน พ.ค.)
  const memDay = findLastDayOfWeek(5, 1);
  holidaysRaw.push({ name: "Memorial Day", date: makeDateStr(5, memDay), hour: "" });

  // 6. Juneteenth (19 มิ.ย.)
  const juneDate = new Date(Date.UTC(year, 5, 19));
  const juneDay = juneDate.getUTCDay();
  const juneObserved = juneDay === 0 ? makeDateStr(6, 20) : (juneDay === 6 ? makeDateStr(6, 18) : makeDateStr(6, 19));
  holidaysRaw.push({ name: "Juneteenth National Independence Day", date: juneObserved, hour: "" });

  // 7. Independence Day (4 ก.ค.)
  const julyDate = new Date(Date.UTC(year, 6, 4));
  const julyDay = julyDate.getUTCDay();
  if (julyDay === 6) {
    holidaysRaw.push({ name: "Independence Day (Observed)", date: makeDateStr(7, 3), hour: "" });
  } else if (julyDay === 0) {
    holidaysRaw.push({ name: "Independence Day (Observed)", date: makeDateStr(7, 5), hour: "" });
  } else {
    holidaysRaw.push({ name: "Independence Day", date: makeDateStr(7, 4), hour: "" });
  }

  // 8. Labor Day (วันจันทร์แรกของเดือน ก.ย.)
  const laborDay = findNthDayOfWeek(9, 1, 1);
  holidaysRaw.push({ name: "Labor Day", date: makeDateStr(9, laborDay), hour: "" });

  // 9. Columbus Day (วันจันทร์ที่ 2 ของเดือน ต.ค.) - วันหยุดธนาคารสหรัฐฯ (ตลาดหุ้นเปิดปกติ)
  const columbusDay = findNthDayOfWeek(10, 1, 2);
  holidaysRaw.push({ name: "Columbus Day", date: makeDateStr(10, columbusDay), hour: "open", isBankOnly: true });

  // 10. Veterans Day (11 พ.ย.) - วันหยุดธนาคารสหรัฐฯ (ตลาดหุ้นเปิดปกติ)
  holidaysRaw.push({ name: "Veterans Day", date: makeDateStr(11, 11), hour: "open", isBankOnly: true });

  // 11. Thanksgiving Day (วันพฤหัสบดีที่ 4 ของเดือน พ.ย.)
  const tgDay = findNthDayOfWeek(11, 4, 4);
  holidaysRaw.push({ name: "Thanksgiving Day", date: makeDateStr(11, tgDay), hour: "" });

  // 12. Day After Thanksgiving (วันศุกร์หลัง Thanksgiving - เปิดทำการครึ่งวัน)
  holidaysRaw.push({ name: "Day After Thanksgiving (Early Close)", date: makeDateStr(11, tgDay + 1), hour: "09:30-13:00" });

  // 13. Christmas Eve (24 ธ.ค. - เปิดทำการครึ่งวัน)
  holidaysRaw.push({ name: "Christmas Eve (Early Close)", date: makeDateStr(12, 24), hour: "09:30-13:00" });

  // 14. Christmas Day (25 ธ.ค.)
  const xmasDate = new Date(Date.UTC(year, 11, 25));
  const xmasDay = xmasDate.getUTCDay();
  const xmasObserved = xmasDay === 0 ? makeDateStr(12, 26) : (xmasDay === 6 ? makeDateStr(12, 24) : makeDateStr(12, 25));
  holidaysRaw.push({ name: "Christmas Day", date: xmasObserved, hour: "" });

  return holidaysRaw
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((h) => {
      const trans = translateHolidayName(h.name);
      const isBankOnly = Boolean(h.isBankOnly);
      const isEarly = !isBankOnly && h.hour !== '' && h.hour !== 'open';
      const isClosedAllDay = !isBankOnly && !isEarly;
      return {
        eventName: h.name,
        eventNameTh: trans.th,
        atDate: h.date,
        thaiDateStr: formatUsDateToThai(h.date),
        tradingHour: h.hour,
        isClosedAllDay,
        isEarlyClose: isEarly,
        isBankHolidayOnly: isBankOnly,
        descriptionTh: isBankOnly
          ? 'วันหยุดธนาคารสหรัฐฯ (ตลาดหุ้นเปิดทำการปกติ)'
          : isEarly
            ? 'เปิดทำการครึ่งวัน (ปิด 13:00 น. สหรัฐฯ)'
            : trans.desc,
      };
    });
};

/**
 * ดึงข้อมูลวันหยุดตลาดหุ้นสหรัฐฯ จาก Finnhub API พร้อมแคชใน localStorage
 * หากไม่มี API key หรือเชื่อมต่อไม่ได้ จะใช้ข้อมูล Fallback อัตโนมัติ
 * 
 * @param customToken - API token ตัวเลือกพิเศษ
 * @returns สัญญารายการ MarketHolidayItem
 */
export const fetchFinnhubHolidays = async (customToken?: string): Promise<{ data: MarketHolidayItem[]; source: 'finnhub' | 'fallback' }> => {
  const currentYear = new Date().getFullYear();
  const token = customToken || localStorage.getItem(STORAGE_API_KEY) || (import.meta.env?.VITE_FINNHUB_API_KEY as string | undefined);

  // ตรวจสอบแคชก่อน
  try {
    const cached = localStorage.getItem(STORAGE_HOLIDAYS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_DURATION_MS && Array.isArray(parsed.data)) {
        return { data: parsed.data, source: parsed.source || 'finnhub' };
      }
    }
  } catch (e) {
    console.warn('Error reading holidays cache:', e);
  }

  // หากมี Token ให้เรียก Finnhub API
  if (token && token.trim().length > 0) {
    try {
      const response = await fetch(`https://finnhub.io/api/v1/stock/market-holiday?exchange=US&token=${token.trim()}`);
      if (response.ok) {
        const json = await response.json();
        if (json && Array.isArray(json.data) && json.data.length > 0) {
          const mapped: MarketHolidayItem[] = json.data.map((item: any) => {
            const trans = translateHolidayName(item.eventName || '');
            const isEarly = Boolean(item.tradingHour && item.tradingHour.trim() !== '' && item.tradingHour !== 'open');
            const lowerName = (item.eventName || '').toLowerCase();
            const isBankOnly = lowerName.includes('columbus') || lowerName.includes('veteran') || item.tradingHour === 'open';
            return {
              eventName: item.eventName,
              eventNameTh: trans.th,
              atDate: item.atDate,
              thaiDateStr: formatUsDateToThai(item.atDate),
              tradingHour: item.tradingHour || '',
              isClosedAllDay: !isEarly && !isBankOnly,
              isEarlyClose: isEarly,
              isBankHolidayOnly: isBankOnly,
              descriptionTh: isBankOnly
                ? 'วันหยุดธนาคารสหรัฐฯ (ตลาดหุ้นเปิดทำการปกติ)'
                : isEarly
                  ? `ปิดทำการเวลา ${item.tradingHour} น. สหรัฐฯ`
                  : trans.desc,
            };
          });

          // บันทึกแคช
          try {
            localStorage.setItem(
              STORAGE_HOLIDAYS_KEY,
              JSON.stringify({ timestamp: Date.now(), data: mapped, source: 'finnhub' })
            );
          } catch {
            // ignore localStorage quota errors
          }

          return { data: mapped, source: 'finnhub' };
        }
      }
    } catch (err) {
      console.warn('Failed to fetch from Finnhub API, fallback to offline calendar:', err);
    }
  }

  // Fallback ประจำปี
  const fallback = getFallbackHolidays(currentYear);
  return { data: fallback, source: 'fallback' };
};

/**
 * ตรวจสอบว่า "วันถัดไป" หรือ "วันนี้" เป็นวันปิดทำการของตลาดหุ้นสหรัฐฯ หรือไม่
 * โดยนับรวมวันหยุดเสาร์-อาทิตย์ และวันหยุดนักขัตฤกษ์ของตลาดหุ้นสหรัฐฯ
 * 
 * @param now - เวลาปัจจุบัน (Date)
 * @param holidays - รายการวันหยุดของตลาดหุ้นสหรัฐฯ
 * @returns วัตถุ UpcomingClosureCheck สรุปผลการตรวจสอบพร้อมคำเตือน
 */
export const checkUpcomingMarketClosure = (
  now: Date = new Date(),
  holidays: MarketHolidayItem[] = []
): UpcomingClosureCheck => {
  // ดึงวันปัจจุบันในเขตเวลา New York (America/New_York)
  const nyFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });
  const parts = nyFormatter.formatToParts(now);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '';

  const nyYear = getPart('year');
  const nyMonth = getPart('month');
  const nyDay = getPart('day');
  const nyWeekday = getPart('weekday'); // 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'

  const todayNyDateStr = `${nyYear}-${nyMonth}-${nyDay}`;

  // คำนวณวันพรุ่งนี้ในเวลา New York
  const tomorrowDateObj = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowParts = nyFormatter.formatToParts(tomorrowDateObj);
  const getTomorrowPart = (type: string) => tomorrowParts.find((p) => p.type === type)?.value || '';
  const tomorrowNyYear = getTomorrowPart('year');
  const tomorrowNyMonth = getTomorrowPart('month');
  const tomorrowNyDay = getTomorrowPart('day');
  const tomorrowNyWeekday = getTomorrowPart('weekday');
  const tomorrowNyDateStr = `${tomorrowNyYear}-${tomorrowNyMonth}-${tomorrowNyDay}`;

  // ตรวจสอบวันหยุดเทศกาลวันนี้และพรุ่งนี้ (เฉพาะที่ตลาดหุ้นปิด ไม่รวมกรณีหยุดเฉพาะธนาคาร)
  const holidayToday = holidays.find((h) => h.atDate === todayNyDateStr && h.isClosedAllDay && !h.isBankHolidayOnly);
  const holidayTomorrow = holidays.find((h) => h.atDate === tomorrowNyDateStr && h.isClosedAllDay && !h.isBankHolidayOnly);

  // ตรวจสอบวันเสาร์-อาทิตย์
  const isTodayWeekend = nyWeekday === 'Sat' || nyWeekday === 'Sun';
  const isTomorrowWeekend = tomorrowNyWeekday === 'Sat' || tomorrowNyWeekday === 'Sun';

  // 1. กรณีวันนี้ตลาดปิดทำการ
  if (isTodayWeekend || holidayToday) {
    const reason = holidayToday
      ? `วันนี้ตลาดปิดทำการเนื่องใน${holidayToday.eventNameTh}`
      : `วันนี้ตลาดปิดทำการ (${nyWeekday === 'Sat' ? 'วันเสาร์' : 'วันอาทิตย์'})`;

    return {
      isClosedTomorrow: isTomorrowWeekend || Boolean(holidayTomorrow),
      isClosedToday: true,
      reason,
      closureType: holidayToday ? 'holiday' : 'weekend',
      holidayName: holidayToday?.eventNameTh,
      thaiDateStr: formatUsDateToThai(todayNyDateStr),
      adviceText: 'คำแนะนำ: งดส่งคำสั่งซื้อ • แนะนำรอเปิดตลาดในรอบถัดไป',
    };
  }

  // 2. กรณีวันพรุ่งนี้เป็นวันปิดทำการ (เตือนล่วงหน้า)
  if (isTomorrowWeekend || holidayTomorrow) {
    const reason = holidayTomorrow
      ? `พรุ่งนี้ตลาดปิดเนื่องใน${holidayTomorrow.eventNameTh}`
      : `พรุ่งนี้ตลาดปิดทำการ (${tomorrowNyWeekday === 'Sat' ? 'วันเสาร์' : 'วันอาทิตย์'})`;

    return {
      isClosedTomorrow: true,
      isClosedToday: false,
      reason,
      closureType: holidayTomorrow ? 'holiday' : 'weekend',
      holidayName: holidayTomorrow?.eventNameTh,
      thaiDateStr: formatUsDateToThai(tomorrowNyDateStr),
      adviceText: 'คำแนะนำ: งดเปิดสถานะใหม่ • หลีกเลี่ยงการถือหุ้นข้ามวันหยุด',
    };
  }

  // ตลาดเปิดทำการปกติทั้งวันนี้และวันพรุ่งนี้
  return {
    isClosedTomorrow: false,
    isClosedToday: false,
    reason: 'ตลาดหุ้นเปิดทำการตามปกติ',
    closureType: 'none',
    adviceText: '',
  };
};

/**
 * บันทึก Finnhub API Key ลงใน localStorage
 * 
 * @param token - API token
 */
export const saveFinnhubApiKey = (token: string): void => {
  if (token.trim()) {
    localStorage.setItem(STORAGE_API_KEY, token.trim());
    localStorage.removeItem(STORAGE_HOLIDAYS_KEY); // ล้างแคชเพื่อให้ดึงใหม่
  } else {
    localStorage.removeItem(STORAGE_API_KEY);
  }
};

/**
 * ดึง Finnhub API Key ที่บันทึกไว้ใน localStorage
 * 
 * @returns string หรือ null
 */
export const getStoredFinnhubApiKey = (): string => {
  return localStorage.getItem(STORAGE_API_KEY) || '';
};
