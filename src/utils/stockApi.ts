import { StockDetail, CompanyFinancials } from '../pages/StockPlanner/types';
import { formatNumber } from './stockMath';

/**
 * จัดรูปแบบค่า Market Cap ให้อ่านง่าย เช่น $1.25T, $500.00B, $20.50M
 * 
 * @param rawMarketCap - สตริงมูลค่าตลาดดิบที่ได้จาก API
 * @returns สตริงมูลค่าตลาดที่ผ่านการฟอร์แมตแล้ว
 */
export const formatMarketCap = (rawMarketCap: string): string => {
  if (!rawMarketCap || rawMarketCap === 'N/A') return '-';
  const cleanNum = parseFloat(rawMarketCap.replace(/,/g, ''));
  if (isNaN(cleanNum)) return rawMarketCap;

  if (cleanNum >= 1e12) {
    return `$${(cleanNum / 1e12).toFixed(2)}T`;
  } else if (cleanNum >= 1e9) {
    return `$${(cleanNum / 1e9).toFixed(2)}B`;
  } else if (cleanNum >= 1e6) {
    return `$${(cleanNum / 1e6).toFixed(2)}M`;
  }
  return `$${formatNumber(cleanNum, 0)}`;
};

/**
 * จัดรูปแบบวันที่รอบงบการเงินให้อยู่ในรูปแบบ วัน/เดือน/ปี (DD/MM/YYYY)
 * เช่น "6/30/2026" -> "30/06/2026" โดยเติม 0 หน้าเดือน/วันที่เป็นหลักเดียว
 * 
 * @param rawDate - สตริงวันที่ดิบจาก API เช่น M/D/YYYY หรือ YYYY-MM-DD
/**
 * แปลงรูปแบบวันที่ปีงบการเงินให้อยู่ในรูปแบบสากลของไทย วัน/เดือน/ปี (DD/MM/YYYY)
 * เช่น "6/30/2026" หรือ "06/30/2026" -> "30/06/2026"
 * และป้องกันการสลับซ้ำซ้อนหากสตริงเป็น DD/MM/YYYY อยู่แล้ว
 * 
 * @param rawDate - ข้อความวันที่ต้นฉบับ เช่น "6/30/2026" หรือ "2026-06-30"
 * @returns วันที่ที่ผ่านการจัดรูปแบบเป็น DD/MM/YYYY
 */
export const formatFinancialPeriod = (rawDate: string): string => {
  if (!rawDate || rawDate === 'ล่าสุด') return rawDate;

  // รูปแบบ M/D/YYYY, MM/DD/YYYY หรือ DD/MM/YYYY
  const slashParts = rawDate.split('/');
  if (slashParts.length === 3) {
    const p0 = parseInt(slashParts[0].trim(), 10);
    const p1 = parseInt(slashParts[1].trim(), 10);
    const year = slashParts[2].trim();

    if (!isNaN(p0) && !isNaN(p1)) {
      // หากส่วนแรก > 12 แสดงว่าเป็น วัน อยู่แล้ว (DD/MM/YYYY) เช่น 30/06/2026 ห้ามสลับซ้ำ
      if (p0 > 12) {
        const day = String(p0).padStart(2, '0');
        const month = String(p1).padStart(2, '0');
        return `${day}/${month}/${year}`;
      }

      // หากส่วนที่สอง > 12 แสดงว่าส่วนแรกคือเดือน ส่วนที่สองคือวัน (MM/DD/YYYY) เช่น 6/30/2026
      if (p1 > 12) {
        const month = String(p0).padStart(2, '0');
        const day = String(p1).padStart(2, '0');
        return `${day}/${month}/${year}`;
      }

      // หากทั้งสองค่าน้อยกว่าหรือเท่ากับ 12 ค่าเริ่มต้นจาก Nasdaq US API จะเป็น เดือน/วัน (M/D/YYYY)
      const month = String(p0).padStart(2, '0');
      const day = String(p1).padStart(2, '0');
      return `${day}/${month}/${year}`;
    }
  }

  // รูปแบบ YYYY-MM-DD
  const dashParts = rawDate.split('-');
  if (dashParts.length === 3 && dashParts[0].length === 4) {
    const year = dashParts[0].trim();
    const month = dashParts[1].trim().padStart(2, '0');
    const day = dashParts[2].trim().padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  return rawDate;
};

/**
 * แปลข้อความภาษาอังกฤษเป็นภาษาไทยผ่าน Google Translate Public API (บริการฟรี ไม่ต้องใช้ API Key)
 * 
 * @param text - ข้อความภาษาอังกฤษที่ต้องการแปล
 * @returns สตริงข้อความภาษาไทยที่แปลแล้ว หรือข้อความเดิมหากแปลไม่สำเร็จ
 */
export const translateToThai = async (text: string): Promise<string> => {
  if (!text || !text.trim()) return text;
  try {
    const url = `/api/translate?client=gtx&sl=en&tl=th&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    if (!response.ok) return text;
    const data = await response.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translatedText = data[0].map((item: any) => item[0]).join('');
      return translatedText || text;
    }
    return text;
  } catch (error) {
    console.warn('Translation failed, fallback to original text:', error);
    return text;
  }
};

/**
 * ดึงข้อมูลสรุปราคาและมูลค่าตลาดจาก Nasdaq Summary API (รองรับทั้งหุ้นและ ETF)
 * 
 * @param symbol - รหัสย่อหุ้น เช่น AAPL, IPDN, SPY
 * @returns ข้อมูลสรุปย่อของหุ้น หรือ null หากเกิดข้อผิดพลาด
 */
export const fetchStockSummary = async (
  symbol: string
): Promise<{
  name: string;
  marketCap: string;
  rawMarketCapNumber?: number;
  sector: string;
  industry: string;
  fiftyTwoWeekRange: string;
  previousClose: string;
  yield: string;
} | null> => {
  try {
    let assetClass = 'stocks';
    let response = await fetch(`/api/nasdaq-summary/${symbol}/summary?assetclass=${assetClass}`);
    let json = await response.json();

    if (!json || json.status?.rCode !== 200 || !json.data?.summaryData) {
      assetClass = 'etf';
      response = await fetch(`/api/nasdaq-summary/${symbol}/summary?assetclass=${assetClass}`);
      json = await response.json();
    }

    if (json && json.status?.rCode === 200 && json.data?.summaryData) {
      const d = json.data.summaryData;

      let rawMarketCap = '';
      if (d.MarketCap?.value) {
        rawMarketCap = d.MarketCap.value;
      } else if (d.AUM?.value) {
        rawMarketCap = d.AUM.value;
      }

      const cleanCap = rawMarketCap ? parseFloat(rawMarketCap.replace(/,/g, '')) : undefined;

      return {
        name: json.data.companyName || d.Exchange?.value || '',
        marketCap: formatMarketCap(rawMarketCap),
        rawMarketCapNumber: cleanCap && !isNaN(cleanCap) ? cleanCap : undefined,
        sector: d.Sector?.value || '-',
        industry: d.Industry?.value || '-',
        fiftyTwoWeekRange: d.FiftTwoWeekHighLow?.value || '-',
        previousClose: d.PreviousClose?.value || '-',
        yield: d.Yield?.value || d.ExpenseRatio?.value || '-',
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching stock summary:', error);
    return null;
  }
};

/**
 * ดึงข้อมูลประวัติบริษัท รายละเอียดธุรกิจ กลุ่มอุตสาหกรรม (Company Profile) จาก Nasdaq API
 * 
 * @param symbol - รหัสย่อหุ้น เช่น AAPL, IPDN
 * @returns ข้อมูลโปรไฟล์และรายละเอียดธุรกิจ หรือ null หากไม่พบข้อมูล
 */
export const fetchCompanyProfile = async (
  symbol: string
): Promise<{
  description?: string;
  sector?: string;
  industry?: string;
  companyName?: string;
} | null> => {
  try {
    const response = await fetch(`/api/nasdaq-company/${symbol}/company-profile`);
    const json = await response.json();

    if (json && json.status?.rCode === 200 && json.data) {
      return {
        description: json.data.CompanyDescription?.value || undefined,
        sector: json.data.Sector?.value || undefined,
        industry: json.data.Industry?.value || undefined,
        companyName: json.data.CompanyName?.value || undefined,
      };
    }
    return null;
  } catch (error) {
    console.warn(`Could not fetch company profile for ${symbol}:`, error);
    return null;
  }
};

/**
 * ดึงข้อมูลงบการเงินไตรมาสล่าสุด (Quarterly Income Statement) จาก Nasdaq API
 * 
 * @param symbol - รหัสย่อหุ้น เช่น AAPL, IPDN
 * @returns ข้อมูลงบการเงินสรุปของไตรมาสล่าสุด หรือ null หากไม่พบข้อมูล
 */
export const fetchCompanyFinancials = async (
  symbol: string
): Promise<CompanyFinancials | null> => {
  try {
    const response = await fetch(`/api/nasdaq-company/${symbol}/financials?frequency=2`);
    const json = await response.json();

    if (
      json &&
      json.status?.rCode === 200 &&
      json.data?.incomeStatementTable?.rows &&
      json.data.incomeStatementTable.headers
    ) {
      const headers = json.data.incomeStatementTable.headers;
      const rows = json.data.incomeStatementTable.rows as Array<{ [key: string]: string }>;

      // ไตรมาสล่าสุดจะอยู่ที่คอลัมน์ value2 และงวดก่อนหน้าอยู่ที่ value3 จัดรูปแบบเป็น DD/MM/YYYY
      const period = formatFinancialPeriod(headers.value2 || 'ล่าสุด');
      const prevPeriod = headers.value3 && headers.value3 !== '--' ? formatFinancialPeriod(headers.value3) : undefined;

      const findValues = (label: string): { current?: string; prev?: string } => {
        const row = rows.find(
          (r) => r.value1 && r.value1.trim().toLowerCase() === label.toLowerCase()
        );
        const current = row && row.value2 && row.value2 !== '--' ? row.value2 : undefined;
        const prev = row && row.value3 && row.value3 !== '--' ? row.value3 : undefined;
        return { current, prev };
      };

      const revenueData = findValues('Total Revenue');
      const grossData = findValues('Gross Profit');
      const operatingData = findValues('Operating Income');
      const netIncomeData = findValues('Net Income');
      const netIncomeCommonData = findValues('Net Income Applicable to Common Shareholders');

      // ดึงข้อมูลภาระหนี้สิน (Liabilities & Debt) และ Total Equity จาก Balance Sheet
      let totalEquityThousands: number | undefined;
      let totalLiabilities: string | undefined;
      let prevTotalLiabilities: string | undefined;
      let longTermDebt: string | undefined;

      const bRows = json.data?.balanceSheetTable?.rows as Array<{ [key: string]: string }> | undefined;
      if (bRows) {
        const findBalanceRow = (name: string): { current?: string; prev?: string } => {
          const row = bRows.find((r) => r.value1 && r.value1.trim().toLowerCase() === name.toLowerCase());
          const current = row && row.value2 && row.value2 !== '--' ? row.value2 : undefined;
          const prev = row && row.value3 && row.value3 !== '--' ? row.value3 : undefined;
          return { current, prev };
        };

        const liabData = findBalanceRow('Total Liabilities');
        totalLiabilities = liabData.current;
        prevTotalLiabilities = liabData.prev;

        const debtData = findBalanceRow('Long-Term Debt');
        longTermDebt = debtData.current;

        const eqRow = bRows.find((r) => r.value1 === 'Total Equity' && r.value2 && r.value2 !== '--');
        if (eqRow && eqRow.value2) {
          const cleanEq = eqRow.value2.replace(/[^0-9.-]/g, '');
          const eqNum = parseFloat(cleanEq);
          if (!isNaN(eqNum)) {
            totalEquityThousands = eqNum;
          }
        }
      }

      // ตรวจสอบว่ามีข้อมูลอย่างน้อยหนึ่งตัว
      if (
        revenueData.current ||
        grossData.current ||
        operatingData.current ||
        netIncomeData.current ||
        netIncomeCommonData.current ||
        totalLiabilities ||
        totalEquityThousands
      ) {
        return {
          period,
          prevPeriod,
          totalRevenue: revenueData.current,
          prevTotalRevenue: revenueData.prev,
          grossProfit: grossData.current,
          prevGrossProfit: grossData.prev,
          operatingIncome: operatingData.current,
          prevOperatingIncome: operatingData.prev,
          netIncome: netIncomeData.current || netIncomeCommonData.current,
          prevNetIncome: netIncomeData.prev || netIncomeCommonData.prev,
          netIncomeCommon: netIncomeCommonData.current || netIncomeData.current,
          prevNetIncomeCommon: netIncomeCommonData.prev || netIncomeData.prev,
          totalLiabilities,
          prevTotalLiabilities,
          longTermDebt,
          currency: 'USD',
          totalEquityThousands,
        };
      }
    }
    return null;
  } catch (error) {
    console.warn(`Could not fetch company financials for ${symbol}:`, error);
    return null;
  }
};

/**
 * ดึงค่าอัตราส่วน P/E (Price-to-Earnings Ratio) จาก Nasdaq Analyst PEG API
 * 
 * @param symbol - รหัสย่อหุ้น เช่น AAPL, NVDA, TSLA
 * @returns สตริงค่า P/E เช่น "45.44" หรือ "-" หากไม่มีข้อมูล
 */
export const fetchPeRatio = async (symbol: string): Promise<string> => {
  try {
    const response = await fetch(`/api/nasdaq-analyst/${symbol}/peg-ratio`);
    const json = await response.json();
    const peChart = json?.data?.per?.peRatioChart;
    if (Array.isArray(peChart) && peChart.length > 0 && typeof peChart[0].y === 'number') {
      return peChart[0].y.toFixed(2);
    }
    return '-';
  } catch (error) {
    console.warn(`Could not fetch P/E ratio for ${symbol}:`, error);
    return '-';
  }
};

/**
 * ดึงข้อมูลหุ้นฉบับสมบูรณ์ (สรุปราคา + โปรไฟล์ธุรกิจ + งบการเงินไตรมาสล่าสุด + P/E + P/B)
 * โดยใช้ Promise.allSettled เพื่อให้ข้อมูลสรุปหลักยังทำงานได้แม้ Profile/Financials ไม่มีข้อมูล
 * 
 * @param symbol - รหัสย่อหุ้น
 * @returns วัตถุ StockDetail พร้อมรายละเอียดธุรกิจ งบการเงิน และอัตราส่วน P/E, P/B
 */
export const fetchCompleteStockDetail = async (
  symbol: string
): Promise<StockDetail | null> => {
  const cleanSymbol = symbol.trim().toUpperCase();
  if (!cleanSymbol) return null;

  // ดึงข้อมูลทุกส่วนพร้อมกัน
  const [summaryResult, profileResult, financialsResult, peResult] = await Promise.allSettled([
    fetchStockSummary(cleanSymbol),
    fetchCompanyProfile(cleanSymbol),
    fetchCompanyFinancials(cleanSymbol),
    fetchPeRatio(cleanSymbol),
  ]);

  const summary = summaryResult.status === 'fulfilled' ? summaryResult.value : null;
  if (!summary) return null;

  const profile = profileResult.status === 'fulfilled' ? profileResult.value : null;
  const financials = financialsResult.status === 'fulfilled' ? financialsResult.value : null;
  const peRatio = peResult.status === 'fulfilled' ? peResult.value : '-';

  // คำนวณ P/B Ratio (Market Cap / Total Equity)
  let pbRatio = '-';
  if (financials?.totalEquityThousands && summary.rawMarketCapNumber) {
    const totalEquity = financials.totalEquityThousands * 1000;
    if (totalEquity > 0 && summary.rawMarketCapNumber > 0) {
      pbRatio = (summary.rawMarketCapNumber / totalEquity).toFixed(2);
    }
  }

  return {
    name: summary.name || profile?.companyName || cleanSymbol,
    marketCap: summary.marketCap,
    sector: summary.sector !== '-' ? summary.sector : profile?.sector || '-',
    industry: summary.industry !== '-' ? summary.industry : profile?.industry || '-',
    fiftyTwoWeekRange: summary.fiftyTwoWeekRange,
    previousClose: summary.previousClose,
    yield: summary.yield,
    peRatio,
    pbRatio,
    description: profile?.description,
    financials: financials || null,
  };
};
