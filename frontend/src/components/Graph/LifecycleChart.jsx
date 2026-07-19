import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { lifecycleLabel } from '../../types/constants';

export default function LifecycleChart({ nodes }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;
    chartInstance.current = echarts.init(chartRef.current);
    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (!chartInstance.current || !nodes.length) return;

    const stages = [
      { name: '萌芽期', range: [0, 20], count: 0 },
      { name: '成长期', range: [20, 40], count: 0 },
      { name: '爆发期', range: [40, 60], count: 0 },
      { name: '成熟期', range: [60, 80], count: 0 },
      { name: '衰退期', range: [80, 100], count: 0 },
    ];

    nodes.forEach((n) => {
      const stage = n.lifecycle_stage || n.lifecycleStage || 0;
      const found = stages.find(s => stage >= s.range[0] && stage < s.range[1]);
      if (found) found.count++;
    });

    const colors = ['#6C5CE7', '#00F0FF', '#00D9A5', '#FF6B35', '#FF2E63'];

    const option = {
      grid: { top: 20, right: 10, bottom: 24, left: 30 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(5,7,10,0.9)',
        borderColor: 'rgba(0,240,255,0.3)',
        textStyle: { color: '#E8ECF1', fontSize: 11 },
      },
      xAxis: {
        type: 'category',
        data: stages.map(s => s.name),
        axisLabel: { color: '#8B95A5', fontSize: 10 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#8B95A5', fontSize: 10 },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
      },
      series: [{
        type: 'bar',
        data: stages.map((s, i) => ({
          value: s.count,
          itemStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: colors[i] },
                { offset: 1, color: colors[i] + '20' },
              ],
            },
            borderRadius: [3, 3, 0, 0],
            shadowColor: colors[i],
            shadowBlur: 8,
          },
        })),
        barWidth: '50%',
      }],
    };

    chartInstance.current.setOption(option);
  }, [nodes]);

  return <div ref={chartRef} className="w-full h-full" />;
}
