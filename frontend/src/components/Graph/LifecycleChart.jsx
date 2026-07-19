import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';


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

    // 按生命周期阶段分组统计
    const stages = [
      { name: '萌芽期', range: [0, 20], count: 0 },
      { name: '成长期', range: [20, 40], count: 0 },
      { name: '爆发期', range: [40, 60], count: 0 },
      { name: '成熟期', range: [60, 80], count: 0 },
      { name: '衰退期', range: [80, 100], count: 0 },
    ];

    nodes.forEach((n) => {
      const stage = n.lifecycle_stage || 0;
      const s = stages.find((s) => stage >= s.range[0] && stage < s.range[1]) || stages[0];
      s.count++;
    });

    const option = {
      backgroundColor: 'transparent',
      grid: { left: 50, right: 20, top: 20, bottom: 30 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#1a2332',
        borderColor: '#2a3a52',
        textStyle: { color: '#e2e8f0' },
      },
      xAxis: {
        type: 'category',
        data: stages.map((s) => s.name),
        axisLabel: { color: '#8892a8', fontSize: 11 },
        axisLine: { lineStyle: { color: '#2a3a52' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#8892a8', fontSize: 11 },
        axisLine: { lineStyle: { color: '#2a3a52' } },
        splitLine: { lineStyle: { color: '#1a2332' } },
      },
      series: [
        {
          type: 'bar',
          data: stages.map((s, i) => ({
            value: s.count,
            itemStyle: {
              color: ['#6366f1', '#3da0c1', '#10b981', '#f59e0b', '#ef4444'][i],
              borderRadius: [4, 4, 0, 0],
            },
          })),
          barWidth: '60%',
        },
      ],
    };

    chartInstance.current.setOption(option);
  }, [nodes]);

  return (
    <div ref={chartRef} className="w-full h-full" />
  );
}
