<script>
  import { onMount, onDestroy, afterUpdate } from 'svelte';
  import { Chart, RadarController, RadialLinearScale, PointElement, LineElement, Filler } from 'chart.js';

  Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler);

  export let labels = [];
  export let datasets = [];

  let canvas;
  let chart;

  function buildDatasets() {
    return datasets.map((ds) => ({
      label: ds.label,
      data: ds.data,
      backgroundColor: ds.color ? hexToRgba(ds.color, 0.15) : 'rgba(240, 136, 62, 0.15)',
      borderColor: ds.color || 'var(--color-accent-primary)',
      borderWidth: 2,
      pointBackgroundColor: ds.color || 'var(--color-accent-primary)',
      pointBorderColor: '#0d1117',
      pointBorderWidth: 1,
      pointRadius: 3,
      pointHoverRadius: 5
    }));
  }

  function hexToRgba(hex, alpha) {
    const h = hex.replace('#', '');
    return `rgba(${parseInt(h.substring(0, 2), 16)}, ${parseInt(h.substring(2, 4), 16)}, ${parseInt(h.substring(4, 6), 16)}, ${alpha})`;
  }

  function createChart() {
    if (!canvas) return;
    if (chart) chart.destroy();

    const ctx = canvas.getContext('2d');
    chart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels,
        datasets: buildDatasets()
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: {
          duration: 600,
          easing: 'easeOutQuart'
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#8b949e',
              font: {
                family: "'IBM Plex Sans', sans-serif",
                size: 12
              },
              padding: 16,
              usePointStyle: true
            }
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            grid: {
              color: 'rgba(48, 54, 61, 0.5)'
            },
            angleLines: {
              color: 'rgba(48, 54, 61, 0.5)'
            },
            pointLabels: {
              color: '#8b949e',
              font: {
                family: "'IBM Plex Mono', monospace",
                size: 11
              }
            },
            ticks: {
              backdropColor: 'transparent',
              color: '#8b949e',
              font: {
                size: 10
              },
              stepSize: 1
            }
          }
        }
      }
    });
  }

  onMount(createChart);
  afterUpdate(createChart);
  onDestroy(() => { if (chart) chart.destroy(); });
</script>

<div class="radar-chart" role="img" aria-label="Radar chart">
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  .radar-chart {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
  }
</style>
