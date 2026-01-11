import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  component: string;
  mountTime: number;
  renderCount: number;
  averageRenderTime: number;
}

export function usePerformance(componentName: string) {
  const mountTimeRef = useRef(performance.now());
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(performance.now());
  const totalRenderTimeRef = useRef(0);

  useEffect(() => {
    const mountTime = performance.now() - mountTimeRef.current;

    // Log mount performance in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎯 ${componentName} mounted in ${mountTime.toFixed(2)}ms`);
    }

    // Track render performance
    renderCountRef.current++;
    const currentTime = performance.now();
    const renderTime = currentTime - lastRenderTimeRef.current;
    totalRenderTimeRef.current += renderTime;
    lastRenderTimeRef.current = currentTime;

    const averageRenderTime = totalRenderTimeRef.current / renderCountRef.current;

    // Log slow renders
    if (renderTime > 16 && process.env.NODE_ENV === 'development') { // 16ms = 60fps
      console.warn(`⚠️ ${componentName} slow render: ${renderTime.toFixed(2)}ms`);
    }

    return () => {
      // Log unmount with performance summary
      if (process.env.NODE_ENV === 'development') {
        const metrics: PerformanceMetrics = {
          component: componentName,
          mountTime,
          renderCount: renderCountRef.current,
          averageRenderTime
        };
        console.log('📊 Performance Summary:', metrics);
      }
    };
  });

  // Return metrics for external monitoring
  const getMetrics = (): PerformanceMetrics => ({
    component: componentName,
    mountTime: performance.now() - mountTimeRef.current,
    renderCount: renderCountRef.current,
    averageRenderTime: totalRenderTimeRef.current / Math.max(renderCountRef.current, 1)
  });

  return { getMetrics };
}