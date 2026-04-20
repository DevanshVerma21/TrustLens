import express from 'express';
import DemoScenarioService from '../services/demoScenarioService.js';

const router = express.Router();

/**
 * GET /api/demo/scenarios
 * Get all available demo scenarios
 */
router.get('/scenarios', (req, res) => {
  try {
    const scenarios = DemoScenarioService.getAllScenarios();
    res.json({
      scenarios,
      count: scenarios.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/demo/scenarios/:scenarioId
 * Get details for a specific demo scenario
 */
router.get('/scenarios/:scenarioId', (req, res) => {
  try {
    const { scenarioId } = req.params;
    const details = DemoScenarioService.getScenarioDetails(scenarioId);

    if (!details) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    res.json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/demo/metrics
 * Get demo system metrics
 */
router.get('/metrics', (req, res) => {
  try {
    const metrics = DemoScenarioService.getDemoMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
