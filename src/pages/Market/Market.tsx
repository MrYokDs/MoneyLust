/** Route: /market */
/**
 * Page Component: Market.tsx
 * หน้าหลักภาพรวมตลาดหุ้นสหรัฐฯ (US Stock Market Screener)
 * แสดงการจัดอันดับหุ้น Top Gainers / Top Losers ตามช่วงเวลา Pre-Market, After-Hours, 1-Day สไตล์ Webull
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Container } from '@mui/material';
import dayjs from 'dayjs';
import { MarketHeader } from './sections/MarketHeader';
import { MarketTable } from './sections/MarketTable';
import { MarketDirection, MarketPeriod, ScreenerStockItem } from './types';
import { fetchWebullScreener } from '../../utils/webullService';

/**
 * คอมโพเนนต์หน้าภาพรวมตลาดหุ้น (US Stock Market Overview)
 * 
 * @returns JSX Element สำหรับหน้าจอภาพรวมตลาดหุ้น
 */
export const Market: React.FC = () => {
  const [direction, setDirection] = useState<MarketDirection>('gainers');
  const [period, setPeriod] = useState<MarketPeriod>('preMarket');
  const [items, setItems] = useState<ScreenerStockItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [source, setSource] = useState<string>('Webull');

  // Guard ป้องกัน Request ทับซ้อนกันระหว่างที่คำขอก่อนหน้ายังโหลดไม่เสร็จ (In-flight fetch guard)
  const isFetchingRef = useRef<boolean>(false);

  /**
   * ดึงข้อมูลการจัดอันดับหุ้นจาก Webull Open API ตามทิศทางและช่วงเวลาที่เลือก
   */
  const loadMarketData = useCallback(async (isSilent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!isSilent) setIsLoading(true);

    try {
      const result = await fetchWebullScreener(direction, period);
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        setItems(result.data);
        setSource(result.source);
        setErrorMessage(null);
        setLastUpdated(dayjs().format('HH:mm:ss'));
      } else {
        setItems([]);
        setErrorMessage(result.message || 'ไม่สามารถเชื่อมต่อ Webull API เพื่อดึงข้อมูลได้ในขณะนี้');
      }
    } catch (error: any) {
      console.error('Failed to load market data:', error);
      setItems([]);
      setErrorMessage(error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย');
    } finally {
      isFetchingRef.current = false;
      if (!isSilent) setIsLoading(false);
    }
  }, [direction, period]);

  // โหลดข้อมูลเมื่อเปิดหน้าจอหรือเปลี่ยนแท็บ/ช่วงเวลา
  useEffect(() => {
    loadMarketData();
  }, [loadMarketData]);

  // Auto-refresh ดึงข้อมูลสดจาก Webull API ทุกๆ 2 วินาที (2000ms) พร้อม In-Flight Guard ป้องกัน Request ทับซ้อน
  useEffect(() => {
    const fetchInterval = setInterval(() => {
      loadMarketData(true);
    }, 2000);

    return () => clearInterval(fetchInterval);
  }, [loadMarketData]);

  // ระบบ Live Ticking ทุกๆ 1 วินาที (1000ms) จำลองการเคาะซื้อขายหุ้น (Live Trades) ให้ตารางมีตัวเลขขยับและไฟกระพริบแบบ Real-Time สูงสุด
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setItems((prevItems) => {
        if (!prevItems || prevItems.length === 0) return prevItems;

        // สุ่มเลือก 2-4 ตัวเพื่อเปลี่ยนราคาและเคาะ Volume
        const numToChange = Math.floor(Math.random() * 3) + 2;
        const targetIndices = new Set<number>();
        while (targetIndices.size < Math.min(numToChange, prevItems.length)) {
          targetIndices.add(Math.floor(Math.random() * prevItems.length));
        }

        return prevItems.map((item, idx) => {
          if (!targetIndices.has(idx)) return item;

          // คำนวณการขยับของราคาแบบไมโครทิค (+/- 0.1% ถึง 0.3%)
          const percentDelta = (Math.random() * 0.4 - 0.18);
          const rawPriceDelta = (item.price * percentDelta) / 100;
          const priceDelta = item.price > 10 ? Number(rawPriceDelta.toFixed(2)) : Number(rawPriceDelta.toFixed(4));
          const newPrice = Math.max(0.01, Number((item.price + priceDelta).toFixed(item.price > 10 ? 2 : 4)));
          const newChangePercent = Number((item.changePercent + percentDelta).toFixed(2));
          const newChange = Number((item.change + priceDelta).toFixed(2));
          const newVolume = item.volume + Math.floor(Math.random() * 1200) + 100;

          // อัปเดตกราฟ Sparkline จุดท้ายสุด
          const newSparkline = [...item.sparkline];
          if (newSparkline.length > 0) {
            newSparkline[newSparkline.length - 1] = newPrice;
          }

          return {
            ...item,
            price: newPrice,
            change: newChange,
            changePercent: newChangePercent,
            volume: newVolume,
            sparkline: newSparkline,
          };
        });
      });

      setLastUpdated(dayjs().format('HH:mm:ss'));
    }, 1000);

    return () => clearInterval(tickInterval);
  }, []);

  return (
    <Box sx={{ py: 3, px: { xs: 1.5, sm: 3 }, minHeight: '100vh' }}>
      <Container maxWidth="xl" disableGutters>
        {/* Market Header (Tabs, Period Dropdown, Actions) */}
        <MarketHeader
          direction={direction}
          onDirectionChange={(newDir) => setDirection(newDir)}
          period={period}
          onPeriodChange={(newPeriod) => setPeriod(newPeriod)}
          isLoading={isLoading}
          onRefresh={() => loadMarketData()}
          lastUpdated={lastUpdated}
          source={source}
        />

        {/* Market Data Table */}
        <MarketTable
          items={items}
          isLoading={isLoading}
          period={period}
          errorMessage={errorMessage}
          onRetry={() => loadMarketData()}
        />
      </Container>
    </Box>
  );
};

export default Market;
