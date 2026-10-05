/**
 * นิยามค่าคงที่เส้นทาง (Route Paths) ทั้งหมดในแอปพลิเคชัน
 * รวมศูนย์ไว้ที่เดียวเพื่อป้องกันการพิมพ์ผิด (Typo) และง่ายต่อการปรับเปลี่ยนในอนาคต
 */
export const PATHS = {
  /** หน้าภาพรวมตลาดหุ้น (US Stock Market Screener: Pre-market, After-hours, Top Gainers/Losers) - เมนูเริ่มต้น */
  MARKET: '/market',

  /** หน้าคำนวณและวางแผนการซื้อหุ้น (Stock Grid Planner) */
  PLANNER: '/planner',
  
  /** หน้าหลัก (Alias เพื่อความเข้ากันได้ย้อนหลัง): นำทางไปยังหน้าคำนวณและวางแผน */
  HOME: '/planner',

  /** หน้าสร้างแผนการลงทุนและคำนวณการเติบโตทบต้น (Investment Growth Plan) */
  INVESTMENT_PLAN: '/investment-plan',

  /**
   * สร้าง Path สำหรับหน้ารายละเอียดพอร์ตการลงทุน
   * 
   * @param id - รหัสพอร์ตการลงทุน (หากไม่ระบุจะใช้ ':id' สำหรับ Route Definition)
   * @returns URL Path เช่น '/portfolio/unassigned' หรือ '/portfolio/123'
   */
  PORTFOLIO: (id: string = ':id'): string => `/portfolio/${id}`,
} as const;
