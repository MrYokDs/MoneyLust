/**
 * นิยามค่าคงที่เส้นทาง (Route Paths) ทั้งหมดในแอปพลิเคชัน
 * รวมศูนย์ไว้ที่เดียวเพื่อป้องกันการพิมพ์ผิด (Typo) และง่ายต่อการปรับเปลี่ยนในอนาคต
 */
export const PATHS = {
  /** หน้าหลัก: วางแผนการแบ่งไม้เข้าซื้อหุ้น (Stock Grid Planner) */
  HOME: '/',
  
  /** หน้าหลัก (Alias): แผนการลงทุน */
  PLANNER: '/',

  /**
   * สร้าง Path สำหรับหน้ารายละเอียดพอร์ตการลงทุน
   * 
   * @param id - รหัสพอร์ตการลงทุน (หากไม่ระบุจะใช้ ':id' สำหรับ Route Definition)
   * @returns URL Path เช่น '/portfolio/unassigned' หรือ '/portfolio/123'
   */
  PORTFOLIO: (id: string = ':id'): string => `/portfolio/${id}`,
} as const;
