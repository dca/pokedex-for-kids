/**
 * 效能監控工具函式
 * 提供 FPS 追蹤、延遲測量、效能分析
 */

// ============================================================================
// FPS 追蹤
// ============================================================================

let fpsFrameCount = 0;
let fpsLastTime = performance.now();
let currentFps = 60;

/**
 * 開始 FPS 追蹤
 */
export function startFPSTracking(callback?: (fps: number) => void): () => void {
  let rafId: number;

  function measureFPS() {
    fpsFrameCount++;
    const now = performance.now();
    const delta = now - fpsLastTime;

    // 每秒更新一次 FPS
    if (delta >= 1000) {
      currentFps = Math.round((fpsFrameCount * 1000) / delta);
      fpsFrameCount = 0;
      fpsLastTime = now;

      callback?.(currentFps);
    }

    rafId = requestAnimationFrame(measureFPS);
  }

  rafId = requestAnimationFrame(measureFPS);

  // 返回停止函式
  return () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
  };
}

/**
 * 獲取當前 FPS
 */
export function getCurrentFPS(): number {
  return currentFps;
}

// ============================================================================
// 延遲測量
// ============================================================================

/**
 * 測量函式執行時間
 */
export async function measureExecutionTime<T>(
  fn: () => Promise<T> | T,
  label?: string
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();

  try {
    const result = await fn();
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (label) {
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    }

    return { result, duration };
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (label) {
      console.error(`[Performance] ${label} failed after ${duration.toFixed(2)}ms`, error);
    }

    throw error;
  }
}

/**
 * 測量非同步操作的延遲
 */
export function measureLatency(label: string): {
  start: () => void;
  end: () => number;
} {
  let startTime = 0;

  return {
    start: () => {
      startTime = performance.now();
    },
    end: () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`[Latency] ${label}: ${duration.toFixed(2)}ms`);
      return duration;
    },
  };
}

// ============================================================================
// 效能標記
// ============================================================================

/**
 * 建立效能標記
 */
export function mark(name: string): void {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name);
  }
}

/**
 * 測量兩個標記之間的時間
 */
export function measure(
  name: string,
  startMark: string,
  endMark: string
): number | null {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      performance.measure(name, startMark, endMark);
      const entries = performance.getEntriesByName(name, 'measure');
      if (entries.length > 0) {
        return entries[0].duration;
      }
    } catch (error) {
      console.warn('Performance measurement failed:', error);
    }
  }
  return null;
}

/**
 * 清除所有效能標記和測量
 */
export function clearMarks(): void {
  if (typeof performance !== 'undefined') {
    performance.clearMarks();
    performance.clearMeasures();
  }
}

// ============================================================================
// Core Web Vitals
// ============================================================================

interface WebVitals {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

/**
 * 獲取 Core Web Vitals 指標
 */
export function getCoreWebVitals(): Promise<WebVitals> {
  return new Promise((resolve) => {
    const vitals: WebVitals = {};

    // FCP
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0] as PerformanceEntry;
    if (fcpEntry) {
      vitals.fcp = fcpEntry.startTime;
    }

    // TTFB
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      vitals.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
    }

    // 使用 PerformanceObserver 獲取其他指標
    if ('PerformanceObserver' in window) {
      try {
        // LCP
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformancePaintTiming;
          vitals.lcp = lastEntry.startTime;
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

        // FID (目前無法直接測量，需要使用 web-vitals 庫)
        // CLS (同上)
      } catch (error) {
        console.warn('PerformanceObserver not fully supported:', error);
      }
    }

    setTimeout(() => {
      resolve(vitals);
    }, 3000); // 等待 3 秒收集指標
  });
}

// ============================================================================
// 節流與防抖
// ============================================================================

/**
 * 節流函式（Throttle）
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

/**
 * 防抖函式（Debounce）
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

// ============================================================================
// 記憶體使用
// ============================================================================

/**
 * 獲取記憶體使用資訊（Chrome only）
 */
export function getMemoryUsage(): {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
} | null {
  if ('memory' in performance) {
    const memory = (performance as Performance & { memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    } }).memory;

    if (memory) {
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }
  }

  return null;
}

/**
 * 格式化位元組大小
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
