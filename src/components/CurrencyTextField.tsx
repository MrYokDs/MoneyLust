/**
 * Component: CurrencyTextField
 * วัตถุประสงค์: คอมโพเนนต์ช่องกรอกข้อมูลตัวเลขทางการเงิน (Currency / Numeric Input)
 * ที่แสดงเครื่องหมายจุลภาค (Comma separator เช่น 1,000 หรือ 54,899,318,000) ขณะพิมพ์โดยอัตโนมัติ
 * และส่งค่าดิบที่เป็นตัวเลขไร้ลูกน้ำกลับไปยัง onChange ตามปกติ
 */

import React, { useMemo } from 'react';
import { TextField, TextFieldProps } from '@mui/material';

export interface CurrencyTextFieldProps extends Omit<TextFieldProps, 'onChange'> {
  /**
   * ค่าตัวเลขดิบที่ต้องการแสดงผล (อาจเป็นตัวเลขหรือสตริงตัวเลข เช่น "1000" หรือ 1000)
   */
  value: string | number;
  /**
   * ฟังก์ชัน Callback เมื่อผู้ใช้พิมพ์หรือแก้ไขค่า
   * @param value - สตริงตัวเลขดิบที่ตัดเครื่องหมายจุลภาคออกแล้ว เช่น "1000" หรือ "1000.50"
   * @param event - React ChangeEvent ดั้งเดิม
   */
  onChange?: (value: string, event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /**
   * กำหนดว่าจะอนุญาตให้กรอกทศนิยมได้หรือไม่ (ค่าเริ่มต้นคือ true)
   */
  allowDecimals?: boolean;
  /**
   * กำหนดจำนวนตำแหน่งทศนิยมสูงสุดที่อนุญาต (ค่าเริ่มต้นไม่จำกัด)
   */
  maxDecimals?: number;
}

/**
 * ฟังก์ชันจัดรูปแบบสตริงตัวเลขให้มีเครื่องหมายจุลภาคคั่นหลักพัน
 * 
 * @param val - สตริงตัวเลขดิบ
 * @returns สตริงที่จัดรูปแบบลูกน้ำแล้ว
 */
export const formatNumberWithCommas = (val: string | number): string => {
  if (val === undefined || val === null || val === '') return '';
  const str = val.toString().trim();
  if (str === '') return '';

  // แยกส่วนจำนวนเต็มและทศนิยม
  const parts = str.split('.');
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? parts[1] : null;

  // ใส่เครื่องหมายจุลภาคในส่วนจำนวนเต็ม
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (decimalPart !== null) {
    return `${formattedInteger}.${decimalPart}`;
  }
  return formattedInteger;
};

/**
 * คอมโพเนนต์ Material-UI TextField สำหรับกรอกตัวเลขทางการเงินพร้อม Comma คั่นหลักพัน
 */
export const CurrencyTextField: React.FC<CurrencyTextFieldProps> = ({
  value,
  onChange,
  allowDecimals = true,
  maxDecimals,
  type,
  inputMode = 'decimal',
  ...restProps
}) => {
  // แปลงค่าดิบที่ส่งเข้ามาเป็นสตริงที่จัด format ลูกน้ำ
  const formattedDisplayValue = useMemo(() => {
    return formatNumberWithCommas(value);
  }, [value]);

  /**
   * จัดการเหตุการณ์เมื่อผู้ใช้พิมพ์หรือแก้ไขข้อความใน Input
   */
  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const rawInput = event.target.value;

    // ลบเครื่องหมายจุลภาคออกทั้งหมด
    const sanitized = rawInput.replace(/,/g, '');

    // ตรวจสอบความถูกต้องของตัวเลข
    if (sanitized === '') {
      if (onChange) onChange('', event);
      return;
    }

    if (allowDecimals) {
      // อนุญาตเฉพาะตัวเลขและจุดทศนิยม 1 จุด
      if (!/^\d*\.?\d*$/.test(sanitized)) {
        return;
      }
      if (maxDecimals !== undefined) {
        const parts = sanitized.split('.');
        if (parts.length > 1 && parts[1].length > maxDecimals) {
          return;
        }
      }
    } else {
      // อนุญาตเฉพาะตัวเลขจำนวนเต็ม
      if (!/^\d*$/.test(sanitized)) {
        return;
      }
    }

    if (onChange) {
      onChange(sanitized, event);
    }
  };

  return (
    <TextField
      {...restProps}
      type="text"
      value={formattedDisplayValue}
      onChange={handleChange}
      slotProps={{
        htmlInput: {
          inputMode,
          autoComplete: 'off',
          ...restProps.slotProps?.htmlInput,
        },
      }}
    />
  );
};

export default CurrencyTextField;
