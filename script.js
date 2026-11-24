let costChartInstance = null;

// Elemen DOM
const volInput = document.getElementById('volume');
const volSlider = document.getElementById('volumeSlider');
const c1Input = document.getElementById('hargaTutup');
const c1Slider = document.getElementById('hargaTutupSlider');
const c2Input = document.getElementById('hargaSelimut');
const c2Slider = document.getElementById('hargaSelimutSlider');

// Sinkronisasi dua arah antara Input Angka dan Range Slider
function bindInputAndSlider(inputEl, sliderEl) {
    inputEl.addEventListener('input', () => {
        sliderEl.value = inputEl.value;
        clearActivePresets();
        hitungOptimasi();
    });

    sliderEl.addEventListener('input', () => {
        inputEl.value = sliderEl.value;
        clearActivePresets();
        hitungOptimasi();
    });
}

bindInputAndSlider(volInput, volSlider);
bindInputAndSlider(c1Input, c1Slider);
bindInputAndSlider(c2Input, c2Slider);

// Tombol Preset Kemasan Populer
const presetButtons = document.querySelectorAll('.preset-btn');
function clearActivePresets() {
    presetButtons.forEach(btn => btn.classList.remove('active'));
}

presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        clearActivePresets();
        btn.classList.add('active');

        const v = btn.getAttribute('data-v');
        const c1 = btn.getAttribute('data-c1');
        const c2 = btn.getAttribute('data-c2');

        volInput.value = volSlider.value = v;
        c1Input.value = c1Slider.value = c1;
        c2Input.value = c2Slider.value = c2;

        hitungOptimasi();
    });
});

// Fungsi Utama Perhitungan Kalkulus Diferensial
function hitungOptimasi() {
    const V = parseFloat(volInput.value);
    const c1 = parseFloat(c1Input.value);
    const c2 = parseFloat(c2Input.value);

    if (isNaN(V) || isNaN(c1) || isNaN(c2) || V <= 0 || c1 <= 0 || c2 <= 0) {
        return;
    }

    // 1. Turunan Pertama C'(r) = 0 -> r_opt = cbrt((V * c2) / (2 * pi * c1))
    const rOpt = Math.cbrt((V * c2) / (2 * Math.PI * c1));
    const diameterOpt = 2 * rOpt;

    // 2. Tinggi Optimal h = V / (pi * r^2)
    const hOpt = V / (Math.PI * Math.pow(rOpt, 2));

    // 3. Uji Turunan Kedua C''(r) = 4*pi*c1 + (4*V*c2)/r^3
    const cDoublePrime = (4 * Math.PI * c1) + ((4 * V * c2) / Math.pow(rOpt, 3));

    // 4. Luas & Biaya Minimum
    const luasTutupAlas = 2 * Math.PI * Math.pow(rOpt, 2);
    const luasSelimut = 2 * Math.PI * rOpt * hOpt;
    const luasTotal = luasTutupAlas + luasSelimut;
    const biayaMin = (luasTutupAlas * c1) + (luasSelimut * c2);

    // Update KPI Cards
    document.getElementById('resJariJari').textContent = `${rOpt.toFixed(2)} cm`;
    document.getElementById('resDiameter').textContent = `Diameter (d): ${diameterOpt.toFixed(2)} cm`;
    
    document.getElementById('resTinggi').textContent = `${hOpt.toFixed(2)} cm`;
    document.getElementById('resRasio').textContent = `Rasio h : d = ${(hOpt / diameterOpt).toFixed(2)}`;
    
    document.getElementById('resLuas').textContent = `${luasTotal.toFixed(2)} cm²`;
    document.getElementById('resBiaya').textContent = `Rp ${biayaMin.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Update Visualisasi Silinder Blueprint
    updateBlueprintVisual(diameterOpt, hOpt);

    // Update Penurunan Rumus Langkah demi Langkah
    updateMathSteps(V, c1, c2, rOpt, hOpt, cDoublePrime);

    // Update Grafik Kurva Biaya
    renderCostChart(V, c1, c2, rOpt, biayaMin);
}

// Mengatur skala proporsional silinder 3D pada area Blueprint
function updateBlueprintVisual(d, h) {
    const cyl = document.getElementById('cylinderVisual');
    const cylText = document.getElementById('cylinderText');
    const maxDimension = 155;

    let widthPx, heightPx;
    if (d > h) {
        widthPx = maxDimension;
        heightPx = Math.max(42, (h / d) * maxDimension);
    } else {
        heightPx = maxDimension;
        widthPx = Math.max(42, (d / h) * maxDimension);
    }

    cyl.style.width = `${widthPx}px`;
    cyl.style.height = `${heightPx}px`;
    cylText.textContent = `${d.toFixed(1)}×${h.toFixed(1)}`;

    document.getElementById('readoutDiameter').textContent = `d = ${d.toFixed(2)} cm`;
    document.getElementById('readoutHeight').textContent = `h = ${h.toFixed(2)} cm`;
}

// Menampilkan langkah pembuktian kalkulus secara dinamis
function updateMathSteps(V, c1, c2, r, h, cDoublePrime) {
    const k1 = (2 * Math.PI * c1).toFixed(2);
    const k2 = (2 * V * c2).toFixed(2);
    const dk1 = (4 * Math.PI * c1).toFixed(2);

    const container = document.getElementById('stepContent');
    container.innerHTML = `
        <div class="step-box">
            <strong>1. Substitusi Kendala ke Fungsi Biaya</strong>
            $$C(r) = 2\\pi(${c1})r^2 + \\frac{2(${V})(${c2})}{r} = ${k1}r^2 + \\frac{${k2}}{r}$$
        </div>
        <div class="step-box">
            <strong>2. Turunan Pertama ($C'(r) = 0$)</strong>
            $$C'(r) = ${dk1}r - \\frac{${k2}}{r^2} = 0 \\implies r^3 = \\frac{${k2}}{${dk1}}$$
        </div>
        <div class="step-box">
            <strong>3. Dimensi Titik Stasioner</strong>
            $$r = \\mathbf{${r.toFixed(2)}\\text{ cm}}, \\quad h = \\frac{${V}}{\\pi(${r.toFixed(2)})^2} = \\mathbf{${h.toFixed(2)}\\text{ cm}}$$
        </div>
        <div class="step-box">
            <strong>4. Uji Turunan Kedua ($C''(r) > 0$)</strong>
            $$C''(${r.toFixed(2)}) = ${dk1} + \\frac{2(${k2})}{(${r.toFixed(2)})^3} = \\mathbf{${cDoublePrime.toFixed(2)} > 0}$$
        </div>
    `;

    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise([container]);
    }
}

// Render Grafik Kurva C(r) dengan penanda titik minimum (Scatter + Line)
function renderCostChart(V, c1, c2, rOpt, biayaMin) {
    const ctx = document.getElementById('costChart').getContext('2d');

    const startR = Math.max(0.6, rOpt * 0.45);
    const endR = rOpt * 2.1;
    const steps = 40;
    const stepSize = (endR - startR) / steps;

    const curvePoints = [];
    for (let i = 0; i <= steps; i++) {
        const r = startR + i * stepSize;
        const cost = (2 * Math.PI * c1 * Math.pow(r, 2)) + ((2 * V * c2) / r);
        curvePoints.push({ x: parseFloat(r.toFixed(2)), y: parseFloat(cost.toFixed(2)) });
    }

    if (costChartInstance) {
        costChartInstance.destroy();
    }

    costChartInstance = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Titik Minimum Optimal',
                    data: [{ x: parseFloat(rOpt.toFixed(2)), y: parseFloat(biayaMin.toFixed(2)) }],
                    backgroundColor: '#ef4444',
                    borderColor: '#ffffff',
                    borderWidth: 2,
                    pointRadius: 7,
                    pointHoverRadius: 9,
                    order: 1
                },
                {
                    label: 'Kurva Biaya C(r)',
                    data: curvePoints,
                    showLine: true,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.08)',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 0,
                    pointHitRadius: 10,
                    order: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'nearest',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { usePointStyle: true, font: { family: 'Plus Jakarta Sans', size: 12 } }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            return ` r = ${ctx.parsed.x} cm | Biaya = Rp ${ctx.parsed.y.toLocaleString('id-ID')}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'Jari-jari Kemasan r (cm)', font: { weight: '600' } },
                    grid: { color: '#f1f5f9' }
                },
                y: {
                    title: { display: true, text: 'Total Biaya Bahan (Rp)', font: { weight: '600' } },
                    grid: { color: '#f1f5f9' }
                }
            }
        }
    });
}

document.getElementById('optimasiForm').addEventListener('submit', (e) => {
    e.preventDefault();
    hitungOptimasi();
});

window.addEventListener('DOMContentLoaded', hitungOptimasi);