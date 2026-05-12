<script>
  import { sim } from '../stores/state.js';

  function getMetricColor(value, inverse = false) {
    const v = inverse ? (100 - value) : value;
    if (v > 70) return 'var(--color-green)';
    if (v >= 40) return 'var(--color-yellow)';
    return 'var(--color-red)';
  }
</script>

<div class="dashboard">
  <header class="dashboard-header">
    <h2>Project Dashboard</h2>
  </header>

  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-label">Delivery Health</div>
      <div class="metric-value" style="--mc: {getMetricColor($sim.delivery_health)}">
        {$sim.delivery_health || 0}%
      </div>
      <div class="progress-bar">
        <div class="track"></div>
        <div class="fill" style="width: {Math.max(0, $sim.delivery_health || 0)}%; --fc: {getMetricColor($sim.delivery_health)}"></div>
      </div>
    </div>

    <div class="metric-card">
      <div class="metric-label">Regulatory Pressure</div>
      <div class="metric-value" style="--mc: {getMetricColor($sim.regulatory_pressure, true)}">
        {$sim.regulatory_pressure || 0}%
      </div>
      <div class="progress-bar">
        <div class="track"></div>
        <div class="fill" style="width: {Math.min(100, $sim.regulatory_pressure || 0)}%; --fc: {getMetricColor($sim.regulatory_pressure, true)}"></div>
      </div>
    </div>

    <div class="metric-card">
      <div class="metric-label">Team Morale</div>
      <div class="metric-value" style="--mc: {getMetricColor($sim.team_morale)}">
        {$sim.team_morale || 0}%
      </div>
      <div class="progress-bar">
        <div class="track"></div>
        <div class="fill" style="width: {Math.max(0, $sim.team_morale || 0)}%; --fc: {getMetricColor($sim.team_morale)}"></div>
      </div>
    </div>

    <div class="metric-card">
      <div class="metric-label">Audit Risk</div>
      <div class="metric-value" style="--mc: {getMetricColor($sim.audit_risk, true)}">
        {$sim.audit_risk || 0}%
      </div>
      <div class="progress-bar">
        <div class="track"></div>
        <div class="fill" style="width: {Math.min(100, $sim.audit_risk || 0)}%; --fc: {getMetricColor($sim.audit_risk, true)}"></div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-label">Budget Variance</div>
      <div class="stat-value" style="--mc: {($sim.budget_variance || 0) > 5 ? 'var(--color-red)' : 'var(--color-green)'}">
        {#if ($sim.budget_variance || 0) >= 0}+{/if}{$sim.budget_variance || 0}%
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-label">Velocity vs Backlog</div>
      <div class="stat-compact">
        <span class="completed">{$sim.velocity || 0}</span>
        <span class="divider">/</span>
        <span class="total">{$sim.backlog_size || 0}</span>
        <span class="unit">stories</span>
      </div>
    </div>
  </div>
</div>

<style>
  .dashboard {
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .dashboard-header {
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }

  .dashboard-header h2 {
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-text);
  }

  .metrics-grid {
    padding: var(--space-4);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--space-4);
  }

  .metric-card, .stat-card {
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-4);
  }

  .metric-label, .stat-label {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.02em;
    margin-bottom: var(--space-2);
  }

  .metric-value {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--mc);
    font-family: var(--font-display);
    margin-bottom: var(--space-3);
  }

  .progress-bar {
    position: relative;
    height: 8px;
  }

  .track {
    position: absolute;
    inset: 0;
    background: var(--color-bg);
    border-radius: 4px;
  }

  .fill {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    background: var(--fc);
    border-radius: 4px;
    transition: width var(--transition-fast);
  }

  .stat-value {
    font-size: var(--text-3xl);
    font-weight: 700;
    color: var(--mc);
    font-family: var(--font-display);
  }

  .stat-compact {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
  }

  .completed {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-green);
    font-family: var(--font-display);
  }

  .divider {
    font-size: var(--text-xl);
    color: var(--color-text-muted);
  }

  .total {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-text-secondary);
    font-family: var(--font-display);
  }

  .unit {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }
</style>
