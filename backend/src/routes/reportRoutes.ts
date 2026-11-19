import { Router, Request, Response } from 'express';
import { prisma } from '../prisma/client';

export const reportRouter = Router();

/**
 * GET /api/reports/summary - Aggregate reporting metrics
 */
reportRouter.get('/summary', async (req: Request, res: Response) => {
  try {
    const { projectId, suiteId, startDate, endDate } = req.query;

    const runWhere: any = {};
    if (projectId) runWhere.projectId = String(projectId);
    if (suiteId) runWhere.suiteId = String(suiteId);
    if (startDate || endDate) {
      runWhere.createdAt = {};
      if (startDate) runWhere.createdAt.gte = new Date(String(startDate));
      if (endDate) runWhere.createdAt.lte = new Date(String(endDate));
    }

    // 1. Fetch runs matching filter
    const runs = await prisma.testRun.findMany({
      where: runWhere,
      orderBy: { createdAt: 'desc' },
      include: {
        testResults: {
          include: {
            testCase: {
              include: { endpoint: true },
            },
          },
        },
      },
    });

    // Calculate aggregated metrics
    let totalExecutedTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;
    let errorTests = 0;
    let totalDurationMs = 0;

    const endpointFailures: Record<string, { endpoint: string; method: string; failCount: number; path: string }> = {};
    const categoryStats: Record<string, { total: number; passed: number; failed: number }> = {};

    runs.forEach((run) => {
      totalDurationMs += run.durationMs;
      run.testResults.forEach((tr) => {
        totalExecutedTests++;
        if (tr.status === 'PASSED') passedTests++;
        else if (tr.status === 'FAILED') failedTests++;
        else if (tr.status === 'SKIPPED') skippedTests++;
        else errorTests++;

        // Category stats
        const cat = tr.testCase?.category || 'General';
        if (!categoryStats[cat]) {
          categoryStats[cat] = { total: 0, passed: 0, failed: 0 };
        }
        categoryStats[cat].total++;
        if (tr.status === 'PASSED') categoryStats[cat].passed++;
        else categoryStats[cat].failed++;

        // Endpoint failures
        if (tr.status === 'FAILED' && tr.testCase?.endpoint) {
          const ep = tr.testCase.endpoint;
          const key = `${ep.method} ${ep.path}`;
          if (!endpointFailures[key]) {
            endpointFailures[key] = {
              endpoint: ep.name,
              method: ep.method,
              path: ep.path,
              failCount: 0,
            };
          }
          endpointFailures[key].failCount++;
        }
      });
    });

    const passPercentage = totalExecutedTests > 0
      ? Number(((passedTests / totalExecutedTests) * 100).toFixed(1))
      : 0;

    const avgDurationMs = runs.length > 0
      ? Math.round(totalDurationMs / runs.length)
      : 0;

    // Execution trend (last 10 runs)
    const trends = runs.slice(0, 15).reverse().map((r) => ({
      id: r.id,
      date: r.createdAt.toISOString().slice(5, 10), // MM-DD
      pass: r.passedTests,
      fail: r.failedTests,
      duration: r.durationMs,
      status: r.status,
    }));

    // Bug distributions
    const bugWhere: any = {};
    if (projectId) bugWhere.projectId = String(projectId);
    const bugs = await prisma.bugReport.findMany({ where: bugWhere });

    const bugsBySeverity = {
      Critical: bugs.filter((b) => b.severity === 'Critical').length,
      High: bugs.filter((b) => b.severity === 'High').length,
      Medium: bugs.filter((b) => b.severity === 'Medium').length,
      Low: bugs.filter((b) => b.severity === 'Low').length,
    };

    const bugsByStatus = {
      Open: bugs.filter((b) => b.status === 'Open').length,
      InProgress: bugs.filter((b) => b.status === 'In Progress').length,
      Resolved: bugs.filter((b) => b.status === 'Resolved').length,
      Closed: bugs.filter((b) => b.status === 'Closed').length,
    };

    res.status(200).json({
      success: true,
      summary: {
        totalRuns: runs.length,
        totalExecutedTests,
        passedTests,
        failedTests,
        skippedTests,
        errorTests,
        passPercentage,
        totalDurationMs,
        avgDurationMs,
      },
      trends,
      frequentlyFailingEndpoints: Object.values(endpointFailures).sort((a, b) => b.failCount - a.failCount),
      categoryStats,
      bugsBySeverity,
      bugsByStatus,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/reports/export-csv - Generate CSV export of execution records
 */
reportRouter.get('/export-csv', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const where: any = {};
    if (projectId) where.testRun = { projectId: String(projectId) };

    const results = await prisma.testResult.findMany({
      where,
      include: {
        testCase: {
          include: { project: true, suite: true, endpoint: true },
        },
        testRun: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    // Build CSV
    const headers = [
      'Execution ID',
      'Date',
      'Project',
      'Test Suite',
      'Test Case ID',
      'Test Case Name',
      'Category',
      'Priority',
      'Method',
      'Path',
      'Status',
      'HTTP Status Code',
      'Response Time (ms)',
      'Error Message',
    ];

    const rows = results.map((r) => [
      r.testRunId,
      r.createdAt.toISOString(),
      `"${r.testCase?.project?.name || ''}"`,
      `"${r.testCase?.suite?.name || 'Default'}"`,
      r.testCase?.testCaseId || '',
      `"${(r.testCase?.name || '').replace(/"/g, '""')}"`,
      r.testCase?.category || '',
      r.testCase?.priority || '',
      r.testCase?.method || '',
      r.testCase?.path || '',
      r.status,
      r.statusCode || 'N/A',
      r.responseTimeMs || 0,
      `"${(r.errorMessage || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=qualitytrack-report-${Date.now()}.csv`);
    res.status(200).send(csvContent);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
