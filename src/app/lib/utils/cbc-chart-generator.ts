import { createCanvas } from 'canvas';

// Types for CBC Data
export interface CBCData {
    // WBC Parameters (for 3-part diff simulation)
    wbc?: number;
    lymphocytes?: number; // %
    monocytes?: number;   // %
    granulocytes?: number; // % (Neut + Baso + Eos)

    // RBC Parameters
    rbc?: number;
    mcv?: number;
    rdw?: number;

    // PLT Parameters
    plt?: number;
    mpv?: number;
}

export interface ChartImages {
    wbcHistogram: string;
    rbcHistogram: string;
    pltHistogram: string;
}

/**
 * Generates a Gaussian distribution curve
 */
function getGaussianFunction(mean: number, stdDev: number, scale: number = 100) {
    return (x: number) => {
        const exponent = -((x - mean) ** 2) / (2 * stdDev ** 2);
        return scale * Math.exp(exponent);
    };
}

/**
 * Generates a Log-Normal distribution curve (for PLT)
 */
function getLogNormalFunction(mode: number, sigma: number, scale: number = 100) {
    const mu = Math.log(mode) + sigma ** 2; // Approximate relation
    return (x: number) => {
        if (x <= 0) return 0;
        const exponent = -((Math.log(x) - mu) ** 2) / (2 * sigma ** 2);
        return (scale / (x * sigma * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
    };
}

/**
 * Draw a single histogram chart on a canvas
 */
async function drawHistogram(
    title: string,
    minX: number,
    maxX: number,
    yFunc: (x: number) => number,
    xLabel: string,
    color: string = '#1e40af',
    width: number = 300,
    height: number = 200
): Promise<string> {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Margins
    const margin = { top: 30, right: 20, bottom: 30, left: 40 };
    const graphWidth = width - margin.left - margin.right;
    const graphHeight = height - margin.top - margin.bottom;

    // Draw axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    ctx.stroke();

    // X-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.stroke();

    // Draw grid lines (horizontal)
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    for (let i = 1; i <= 4; i++) {
        const y = margin.top + (graphHeight * i) / 5;
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(width - margin.right, y);
        ctx.stroke();
    }

    // Draw X-axis Ticks and Labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '9px Arial';
    ctx.textAlign = 'center';

    // Draw 5 tick marks
    const tickCount = 5;
    for (let i = 0; i <= tickCount; i++) {
        const value = minX + (i * (maxX - minX) / tickCount);
        const x = margin.left + (i * graphWidth / tickCount);

        // Draw tick
        ctx.beginPath();
        ctx.strokeStyle = '#374151';
        ctx.moveTo(x, height - margin.bottom);
        ctx.lineTo(x, height - margin.bottom + 5);
        ctx.stroke();

        // Draw label
        ctx.fillText(Math.round(value).toString(), x, height - margin.bottom + 15);
    }

    // Draw Title
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, 20);

    // Draw X Label
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(xLabel, width / 2, height - 10);

    // Calculate curve points
    const points: { x: number; y: number }[] = [];
    const step = (maxX - minX) / 100;

    // First pass: find max Y to normalize
    let maxY = 0;
    for (let x = minX; x <= maxX; x += step) {
        const y = yFunc(x);
        if (y > maxY) maxY = y;
        points.push({ x, y });
    }

    // Draw Curve
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    // Start at bottom left
    const startX = margin.left;
    const startY = height - margin.bottom;
    ctx.moveTo(startX, startY);

    points.forEach((p) => {
        // Map data x to screen x
        const px = margin.left + ((p.x - minX) / (maxX - minX)) * graphWidth;
        // Map data y to screen y (normalized)
        const py = height - margin.bottom - ((p.y / (maxY || 1)) * graphHeight * 0.9); // Use 90% of height

        ctx.lineTo(px, py);
    });

    // Close shape for fill
    ctx.lineTo(margin.left + graphWidth, height - margin.bottom);
    ctx.lineTo(margin.left, height - margin.bottom);

    // Fill
    ctx.fillStyle = `${color}20`; // Low opacity
    ctx.fill();

    // Stroke again to ensure sharp line
    ctx.stroke();

    return canvas.toDataURL('image/png');
}

/**
 * Generate all 3 CBC histograms
 */
export async function generateCBCCharts(data: CBCData): Promise<ChartImages> {
    // 1. RBC Histogram (Normal Distribution around MCV)
    // Default MCV ~85-90, Default RDW ~13-14
    const mcv = data.mcv || 88;
    const rdwCV = data.rdw || 13;
    // SD = MCV * (RDW-CV/100)
    const rbcSD = mcv * (rdwCV / 100);

    const rbcFunc = getGaussianFunction(mcv, rbcSD);
    // RBC range typically 50 - 150 fL ?? Or 0 - 200 ???
    // Standard analyzers show ~ 25/30 to 150/200 fL
    const rbcChart = await drawHistogram('RBC Histogram', 20, 150, rbcFunc, 'Volume (fL)');

    // 2. PLT Histogram (Log-Normal Distribution)
    // Default MPV ~9-10
    const mpv = data.mpv || 9;
    // Assuming a standard log-sigma for platelets
    const pltSigma = 0.5;

    // Log-normal usually peaks earlier.
    // We can approximate a curve that peaks at MPV.
    // For log-normal: Mode = exp(mu - sigma^2). 
    // We want Mode = MPV.
    // So mu = ln(MPV) + sigma^2

    const pltFunc = (x: number) => {
        // Use a simple log-normal shape
        if (x <= 1) return 0;
        // Peak at MPV
        // Simple approximation: Gamma-like or LogNormal
        const mu = Math.log(mpv) + (pltSigma ** 2);
        const val = (1 / (x * pltSigma * Math.sqrt(2 * Math.PI))) * Math.exp(- ((Math.log(x) - Math.log(mpv)) ** 2) / (2 * (pltSigma ** 2)));
        return val * 1000;
    };

    // PLT range typically 2 - 30 fL
    const pltChart = await drawHistogram('PLT Histogram', 0, 30, pltFunc, 'Volume (fL)');

    // 3. WBC Histogram (3-part differential simulation)
    // Lymphocytes (small), Monocytes (mid), Granulocytes (large)
    // Size ranges: Lymph ~35-90, Mono ~90-160, Gran ~160-300+
    // We sum 3 Gaussian curves.

    const total = (data.lymphocytes || 30) + (data.monocytes || 5) + (data.granulocytes || 65);
    // Normalize
    const pL = (data.lymphocytes || 30) / total;
    const pM = (data.monocytes || 5) / total;
    const pG = (data.granulocytes || 65) / total;

    const wbcFunc = (x: number) => {
        // Lymph peak ~ 70
        const lymph = pL * Math.exp(- ((x - 70) ** 2) / (2 * 15 ** 2));
        // Mono/Baso/Eos peak ~ 130
        const mono = pM * Math.exp(- ((x - 130) ** 2) / (2 * 15 ** 2));
        // Gran/Neut peak ~ 220
        const gran = pG * Math.exp(- ((x - 220) ** 2) / (2 * 30 ** 2));

        return (lymph + mono + gran) * 100;
    };

    // WBC range typically 30 - 400 fL equivalent (or arbitrary units)
    const wbcChart = await drawHistogram('WBC Histogram', 30, 350, wbcFunc, 'Volume (fL)');

    return {
        wbcHistogram: wbcChart,
        rbcHistogram: rbcChart,
        pltHistogram: pltChart,
    };
}
