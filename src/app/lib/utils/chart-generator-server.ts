// app/lib/utils/chart-generator-server.ts (UPDATED WITH KINETIC CHART)
import { createCanvas } from 'canvas';

// Types
interface MotilityData {
  grade: string;
  percentage: number;
  ideal?: number;
}

interface ChartDataPoint {
  [key: string]: any;
  name: string;
  value: number;
  fill?: string;
}

// Simple canvas-based chart generator (server-side only)

export async function generateKineticRadarChartCanvas(kineticData: any[], width = 350, height = 250): Promise<string> {
  try {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Calculate center and radius
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 80;

    // Draw polar grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;

    // Draw concentric circles
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius / 4) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw axes (8 axes for 8 parameters)
    const parameters = kineticData.map(item => item.name);
    const numAxes = parameters.length;

    for (let i = 0; i < numAxes; i++) {
      const angle = (i * 2 * Math.PI) / numAxes;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      // Axis line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Parameter label
      const labelAngle = angle;
      const labelDistance = radius + 25;
      const labelX = centerX + labelDistance * Math.cos(labelAngle);
      const labelY = centerY + labelDistance * Math.sin(labelAngle);

      ctx.save();
      ctx.translate(labelX, labelY);

      // Rotate text for better readability
      if (labelAngle > Math.PI / 2 && labelAngle < 3 * Math.PI / 2) {
        ctx.rotate(labelAngle + Math.PI);
        ctx.textAlign = 'right';
      } else {
        ctx.rotate(labelAngle);
        ctx.textAlign = 'left';
      }

      ctx.fillStyle = '#4b5563';
      ctx.font = 'bold 8px Arial';
      ctx.fillText(parameters[i], 0, 0);
      ctx.restore();
    }

    // Normalize values for radar chart (0-100 scale)
    const maxValues: Record<string, number> = {
      'VCL': 100,  // µm/s
      'VSL': 100,  // µm/s
      'VAP': 100,  // µm/s
      'LIN': 100,  // %
      'STR': 100,  // %
      'WOB': 100,  // %
      'ALH': 10,   // µm
      'BCF': 20    // Hz
    };

    // Draw radar polygon
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.lineWidth = 2;

    kineticData.forEach((item, index) => {
      const normalizedValue = Math.min((item.value / maxValues[item.name]) * 100, 100);
      const distance = (normalizedValue / 100) * radius;
      const angle = (index * 2 * Math.PI) / numAxes;
      const x = centerX + distance * Math.cos(angle);
      const y = centerY + distance * Math.sin(angle);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      // Draw data point
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();

      // Value label
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 8px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.value.toFixed(1), x, y - 8);
    });

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating kinetic radar chart:', error);
    // Return a simple placeholder
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }
}

export async function generateMotilityBarChartCanvas(motilityData: MotilityData[], width = 400, height = 250): Promise<string> {
  try {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Chart area
    const chartX = 50;
    const chartY = 30;
    const chartWidth = width - 80;
    const chartHeight = height - 80;

    // Title
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Motility Grade Distribution', width / 2, 20);

    // Draw bars
    const barWidth = chartWidth / motilityData.length * 0.8;
    const gap = chartWidth / motilityData.length * 0.2;
    const maxValue = 100;

    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

    motilityData.forEach((item, index) => {
      const x = chartX + index * (barWidth + gap);
      const barHeight = (item.percentage / maxValue) * chartHeight;
      const y = chartY + chartHeight - barHeight;

      // Bar
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw ideal line if exists
      if (item.ideal && item.ideal > 0) {
        const idealY = chartY + chartHeight - (item.ideal / maxValue) * chartHeight;
        ctx.strokeStyle = '#000000';
        ctx.setLineDash([5, 3]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, idealY);
        ctx.lineTo(x + barWidth, idealY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Ideal label
        ctx.fillStyle = '#6b7280';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Ideal: ${item.ideal}%`, x + barWidth / 2, idealY - 5);
      }

      // Bar value
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${item.percentage.toFixed(1)}%`, x + barWidth / 2, y - 5);

      // Grade label
      ctx.fillStyle = '#4b5563';
      ctx.font = '10px Arial';
      ctx.fillText(item.grade, x + barWidth / 2, chartY + chartHeight + 15);
    });

    // Y-axis label
    ctx.save();
    ctx.translate(20, chartY + chartHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px Arial';
    ctx.fillText('Percentage (%)', 0, 0);
    ctx.restore();

    // X-axis label
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Grade', width / 2, height - 10);

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating motility chart:', error);
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }
}

export async function generateMorphologyPieChartCanvas(defectsData: ChartDataPoint[], width = 350, height = 250): Promise<string> {
  try {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Title
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Defect Distribution', width / 2, 20);

    // Calculate total
    const total = defectsData.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
      // No data message
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px Arial';
      ctx.fillText('No defects found', width / 2, height / 2);
      return canvas.toDataURL('image/png');
    }

    // Draw pie chart
    const centerX = width / 2;
    const centerY = height / 2 + 10;
    const radius = 80;

    const colors = ['#ef4444', '#f59e0b', '#3b82f6'];
    let startAngle = 0;

    defectsData.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();

      // Draw slice border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw label
      const angle = startAngle + sliceAngle / 2;
      const labelX = centerX + (radius + 30) * Math.cos(angle);
      const labelY = centerY + (radius + 30) * Math.sin(angle);

      ctx.fillStyle = '#111827';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';

      // Calculate percentage
      const percentage = (item.value / total) * 100;
      ctx.fillText(`${item.name}: ${percentage.toFixed(1)}%`, labelX, labelY);

      // Count label
      ctx.fillStyle = '#6b7280';
      ctx.font = '9px Arial';
      ctx.fillText(`(${item.value} defects)`, labelX, labelY + 12);

      startAngle = endAngle;
    });

    // Center total
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Total: ${total}`, centerX, centerY);

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating morphology chart:', error);
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }
}

export async function generateVitalityProgressChartCanvas(livePercent: number, deadPercent: number, width = 400, height = 120): Promise<string> {
  try {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Title
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Sperm Vitality', width / 2, 15);

    // Draw bars
    const barHeight = 30;
    const barY = 40;
    const barMaxWidth = width - 100;

    // Live sperm bar
    const liveWidth = (livePercent / 100) * barMaxWidth;
    ctx.fillStyle = '#10b981';
    ctx.fillRect(50, barY, liveWidth, barHeight);

    // Dead sperm bar
    const deadWidth = (deadPercent / 100) * barMaxWidth;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(50 + liveWidth, barY, deadWidth, barHeight);

    // Draw border
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.strokeRect(50, barY, barMaxWidth, barHeight);

    // Labels
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Live:', 10, barY + 20);
    ctx.textAlign = 'right';
    ctx.fillText('Dead:', width - 10, barY + 20);

    // Percentages inside bars
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';

    if (liveWidth > 30) {
      ctx.fillText(`${livePercent.toFixed(1)}%`, 50 + liveWidth / 2, barY + 20);
    }

    if (deadWidth > 30) {
      ctx.fillText(`${deadPercent.toFixed(1)}%`, 50 + liveWidth + deadWidth / 2, barY + 20);
    }

    // Percentages outside bars (if too small inside)
    if (liveWidth <= 30) {
      ctx.fillStyle = '#111827';
      ctx.fillText(`${livePercent.toFixed(1)}%`, 50 + liveWidth / 2, barY - 5);
    }

    if (deadWidth <= 30) {
      ctx.fillStyle = '#111827';
      ctx.fillText(`${deadPercent.toFixed(1)}%`, 50 + liveWidth + deadWidth / 2, barY - 5);
    }

    // WHO reference line (54%)
    const referenceX = 50 + (54 / 100) * barMaxWidth;
    ctx.strokeStyle = '#000000';
    ctx.setLineDash([5, 3]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(referenceX, barY - 5);
    ctx.lineTo(referenceX, barY + barHeight + 5);
    ctx.stroke();
    ctx.setLineDash([]);

    // Reference label
    ctx.fillStyle = '#6b7280';
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('WHO Ref: 54%', referenceX, barY + barHeight + 15);

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating vitality chart:', error);
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }
}

export async function generateCasaChartsServer(casaData: any): Promise<{
  motilityChart: string;
  morphologyChart: string;
  vitalityChart: string;
  kineticChart: string;
}> {
  try {
    // Prepare data
    const motilityData = [
      { grade: 'Grade A', percentage: casaData.motility?.gradeA?.value || 0, ideal: 25 },
      { grade: 'Grade B', percentage: casaData.motility?.gradeB?.value || 0 },
      { grade: 'Grade C', percentage: casaData.motility?.gradeC?.value || 0 },
      { grade: 'Grade D', percentage: casaData.motility?.gradeD?.value || 0 }
    ];

    const morphologyData = [
      { name: 'Head Defects', value: casaData.morphology?.headDefects?.total || 0 },
      { name: 'Midpiece Defects', value: casaData.morphology?.midpieceDefects?.total || 0 },
      { name: 'Tail Defects', value: casaData.morphology?.tailDefects?.total || 0 }
    ];

    // Prepare kinetic data for radar chart
    const kineticData = [
      { name: 'VCL', value: casaData.kinetics?.vcl?.value || 0 },
      { name: 'VSL', value: casaData.kinetics?.vsl?.value || 0 },
      { name: 'VAP', value: casaData.kinetics?.vap?.value || 0 },
      { name: 'LIN', value: casaData.kinetics?.lin?.value || 0 },
      { name: 'STR', value: casaData.kinetics?.str?.value || 0 },
      { name: 'WOB', value: casaData.kinetics?.wob?.value || 0 },
      { name: 'ALH', value: casaData.kinetics?.alh?.value || 0 },
      { name: 'BCF', value: casaData.kinetics?.bcf?.value || 0 }
    ];

    // Generate all charts in parallel
    const [motilityChart, morphologyChart, vitalityChart, kineticChart] = await Promise.all([
      generateMotilityBarChartCanvas(motilityData),
      generateMorphologyPieChartCanvas(morphologyData),
      generateVitalityProgressChartCanvas(
        casaData.vitality?.liveSperm?.value || 0,
        casaData.vitality?.deadSperm?.value || 0
      ),
      generateKineticRadarChartCanvas(kineticData)
    ]);

    return {
      motilityChart,
      morphologyChart,
      vitalityChart,
      kineticChart
    };
  } catch (error) {
    console.error('Error generating CASA charts:', error);

    // Return placeholders
    const placeholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    return {
      motilityChart: placeholder,
      morphologyChart: placeholder,
      vitalityChart: placeholder,
      kineticChart: placeholder
    };
  }
}