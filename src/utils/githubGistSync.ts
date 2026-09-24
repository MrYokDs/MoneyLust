/**
 * Utility: githubGistSync.ts
 * จัดการระบบซิงค์ข้อมูลแผนการลงทุนกับ GitHub Gist (Private)
 * ช่วยให้ผู้ใช้ซิงค์ข้อมูลข้ามเครื่อง (คอมพิวเตอร์, มือถือ, Vercel) ได้ฟรี 100%
 */

import { getExportPayload, importBackupFromJson } from './dataBackup';

export interface GistSyncStatus {
  isConnected: boolean;
  gistId: string | null;
  gistUrl: string | null;
  lastSyncAt: string | null;
}

const STORAGE_GIST_TOKEN_KEY = 'moneylust_github_token';
const STORAGE_GIST_ID_KEY = 'moneylust_gist_id';
const STORAGE_LAST_SYNC_KEY = 'moneylust_last_sync_time';
const GIST_FILENAME = 'moneylust_data.json';
const GIST_DESCRIPTION = 'MoneyLust Cloud Backup & Investment Plans (Auto-sync)';

/**
 * ดึงสถานะการเชื่อมต่อ GitHub Gist ปัจจุบันจาก LocalStorage
 * 
 * @returns GistSyncStatus สถานะการเชื่อมต่อ รหัส Gist และเวลาซิงค์ล่าสุด
 */
export const getGistSyncStatus = (): GistSyncStatus => {
  const token = localStorage.getItem(STORAGE_GIST_TOKEN_KEY);
  const gistId = localStorage.getItem(STORAGE_GIST_ID_KEY);
  const lastSyncAt = localStorage.getItem(STORAGE_LAST_SYNC_KEY);

  return {
    isConnected: Boolean(token && token.trim()),
    gistId,
    gistUrl: gistId ? `https://gist.github.com/${gistId}` : null,
    lastSyncAt,
  };
};

/**
 * บันทึกหรือลบ GitHub Personal Access Token
 * 
 * @param token - GitHub PAT
 */
export const saveGitHubToken = (token: string): void => {
  if (token.trim()) {
    localStorage.setItem(STORAGE_GIST_TOKEN_KEY, token.trim());
  } else {
    localStorage.removeItem(STORAGE_GIST_TOKEN_KEY);
    localStorage.removeItem(STORAGE_GIST_ID_KEY);
    localStorage.removeItem(STORAGE_LAST_SYNC_KEY);
  }
};

/**
 * ค้นหาหรือสร้าง Secret Gist สำหรับ MoneyLust บนบัญชี GitHub
 * 
 * @param token - GitHub PAT
 * @returns Promise<{ success: boolean; gistId?: string; message: string }>
 */
export const initializeOrLinkGist = async (
  token: string
): Promise<{ success: boolean; gistId?: string; message: string }> => {
  const cleanToken = token.trim();
  if (!cleanToken) {
    return { success: false, message: 'กรุณากรอก GitHub Personal Access Token' };
  }

  const headers = {
    Authorization: `token ${cleanToken}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  try {
    // 1. ตรวจสอบว่าในบัญชีมี Gist ของ MoneyLust อยู่แล้วหรือไม่
    const listRes = await fetch('https://api.github.com/gists', { headers });
    if (!listRes.ok) {
      if (listRes.status === 401) {
        return { success: false, message: 'Token ไม่ถูกต้อง หรือไม่มีสิทธิ์เข้าถึง (ต้องมีสิทธิ์ gist)' };
      }
      return { success: false, message: `เกิดข้อผิดพลาดในการเชื่อมต่อ GitHub (${listRes.status})` };
    }

    const gists = await listRes.json();
    let existingGistId: string | null = null;

    if (Array.isArray(gists)) {
      const found = gists.find(
        (g: any) =>
          g.description === GIST_DESCRIPTION ||
          (g.files && g.files[GIST_FILENAME])
      );
      if (found) {
        existingGistId = found.id;
      }
    }

    // 2. หากพบ Gist เดิม ให้เชื่อมโยงทันที
    if (existingGistId) {
      localStorage.setItem(STORAGE_GIST_TOKEN_KEY, cleanToken);
      localStorage.setItem(STORAGE_GIST_ID_KEY, existingGistId);
      return {
        success: true,
        gistId: existingGistId,
        message: 'เชื่อมต่อกับ Gist ที่มีอยู่เดิมบน GitHub สำเร็จ!',
      };
    }

    // 3. หากยังไม่มี ให้สร้าง Secret Gist ใหม่
    const currentPayload = getExportPayload();
    const createBody = {
      description: GIST_DESCRIPTION,
      public: false, // Secret Gist (ส่วนตัว 100%)
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(currentPayload, null, 2),
        },
      },
    };

    const createRes = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers,
      body: JSON.stringify(createBody),
    });

    if (!createRes.ok) {
      return { success: false, message: `ไม่สามารถสร้าง Gist ใหม่ได้ (${createRes.status})` };
    }

    const newGist = await createRes.json();
    localStorage.setItem(STORAGE_GIST_TOKEN_KEY, cleanToken);
    localStorage.setItem(STORAGE_GIST_ID_KEY, newGist.id);
    localStorage.setItem(STORAGE_LAST_SYNC_KEY, new Date().toISOString());

    return {
      success: true,
      gistId: newGist.id,
      message: 'สร้าง Secret Gist ใหม่บน GitHub และอัปโหลดข้อมูลตั้งต้นสำเร็จ!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err.message || 'โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'}`,
    };
  }
};

/**
 * อัปโหลดข้อมูลปัจจุบันจากเครื่องขึ้นสู่ GitHub Gist
 * 
 * @returns Promise<{ success: boolean; message: string }>
 */
export const uploadDataToGist = async (): Promise<{ success: boolean; message: string }> => {
  const token = localStorage.getItem(STORAGE_GIST_TOKEN_KEY);
  let gistId = localStorage.getItem(STORAGE_GIST_ID_KEY);

  if (!token) {
    return { success: false, message: 'ยังไม่ได้ตั้งค่า GitHub Token' };
  }

  // หากไม่มี Gist ID ให้สร้างหรือเชื่อมโยงก่อน
  if (!gistId) {
    const init = await initializeOrLinkGist(token);
    if (!init.success || !init.gistId) {
      return { success: false, message: init.message };
    }
    gistId = init.gistId;
  }

  const payload = getExportPayload();
  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  try {
    const patchRes = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        description: GIST_DESCRIPTION,
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(payload, null, 2),
          },
        },
      }),
    });

    if (!patchRes.ok) {
      return { success: false, message: `อัปโหลดไม่สำเร็จ (${patchRes.status})` };
    }

    const now = new Date().toISOString();
    localStorage.setItem(STORAGE_LAST_SYNC_KEY, now);

    return {
      success: true,
      message: 'อัปโหลดข้อมูลขึ้น GitHub Gist สำเร็จเรียบร้อย!',
    };
  } catch (err: any) {
    return { success: false, message: `เกิดข้อผิดพลาด: ${err.message}` };
  }
};

/**
 * ดึงข้อมูลล่าสุดจาก GitHub Gist มาเขียนทับลงใน LocalStorage ของเครื่องนี้
 * 
 * @returns Promise<{ success: boolean; message: string; plansCount?: number }
 */
export const downloadDataFromGist = async (): Promise<{
  success: boolean;
  message: string;
  plansCount?: number;
}> => {
  const token = localStorage.getItem(STORAGE_GIST_TOKEN_KEY);
  const gistId = localStorage.getItem(STORAGE_GIST_ID_KEY);

  if (!token || !gistId) {
    return { success: false, message: 'ยังไม่ได้เชื่อมต่อกับ GitHub Gist' };
  }

  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
  };

  try {
    const getRes = await fetch(`https://api.github.com/gists/${gistId}`, { headers });
    if (!getRes.ok) {
      return { success: false, message: `ไม่สามารถดึงข้อมูลจาก Gist ได้ (${getRes.status})` };
    }

    const gistData = await getRes.json();
    const fileObj = gistData.files?.[GIST_FILENAME];

    if (!fileObj || !fileObj.content) {
      return { success: false, message: `ไม่พบไฟล์ ${GIST_FILENAME} ใน Gist นี้` };
    }

    const importRes = importBackupFromJson(fileObj.content);
    if (importRes.success) {
      localStorage.setItem(STORAGE_LAST_SYNC_KEY, new Date().toISOString());
      return {
        success: true,
        message: `ดึงข้อมูลจาก GitHub สำเร็จ! (${importRes.plansCount} แผน, ${importRes.portfoliosCount} พอร์ต)`,
        plansCount: importRes.plansCount,
      };
    } else {
      return { success: false, message: importRes.message };
    }
  } catch (err: any) {
    return { success: false, message: `เกิดข้อผิดพลาด: ${err.message}` };
  }
};

/**
 * ยกเลิกการเชื่อมต่อกับ GitHub Gist ในเครื่องนี้
 */
export const disconnectGist = (): void => {
  localStorage.removeItem(STORAGE_GIST_TOKEN_KEY);
  localStorage.removeItem(STORAGE_GIST_ID_KEY);
  localStorage.removeItem(STORAGE_LAST_SYNC_KEY);
};
