import { Router, Request, Response } from 'express';
import { prisma } from '../prisma/client';

export const dashboardRouter = Router();

/**
 * GET /api/dashboard/stats
 * Real calculated metrics from DB records
 */
dashboardRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;

    const whereProject: any = {};
    if (projectId) whereProject.projectId = String(projectId);

    // 1. Fetch counts
    const [
      totalProjects,
      totalEndpoints,
      totalTestCases,
      totalRuns,
      allResults,
      recentRuns,
      recentBugs,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.aPIEndpoint.count({ where: whereProject }),
      prisma.testCase.count({ where: whereProject }),
      prisma.testRun.count({ where: whereProject }),
      prisma.testResult.findMany({
        where: projectId ? { testRun: { projectId: String(projectId) } } : {},
        select: { status: true, responseTimeMs: true, testCase: { select: { endpoint: true } } },
      }),
      prisma.testRun.findMany({
        where: whereProject,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { id: true, name: true } },
          suite: { select: { id: true, name: true } },
        },
      }),
      prisma.bugReport.findMany({
        where: whereProject,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { id: true, name: true } },
          testCase: { select: { id: true, testCaseId: true, name: true } },
        },
      }),
    ]);

    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;
    let errorTests = 0;
    const endpointFails: Record<string, { name: string; method: string; path: string; count: number }> = {};

    allResults.forEach((r) => {
      if (r.status === 'PASSED') passedTests++;
      else if (r.status === 'FAILED') failedTests++;
      else if (r.status === 'SKIPPED') skippedTests++;
      else errorTests++;

      if (r.status === 'FAILED' && r.testCase?.endpoint) {
        const ep = r.testCase.endpoint;
        const key = `${ep.method} ${ep.path}`;
        if (!endpointFails[key]) {
          endpointFails[key] = { name: ep.name, method: ep.method, path: ep.path, count: 0 };
        }
        endpointFails[key].count++;
      }
    });

    const totalExecutions = passedTests + failedTests + skippedTests + errorTests;
    const passRate = totalExecutions > 0 ? Number(((passedTests / totalExecutions) * 100).toFixed(1)) : 0;

    // Trend calculation (last 7 runs)
    const trends = recentRuns.slice(0, 7).reverse().map((r) => ({
      name: r.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pass: r.passedTests,
      fail: r.failedTests,
      duration: r.durationMs,
    }));

    // Status distribution
    const statusDistribution = [
      { name: 'Passed', value: passedTests, color: '#10b981' }, // emerald-500
      { name: 'Failed', value: failedTests, color: '#ef4444' }, // red-500
      { name: 'Errors', value: errorTests, color: '#f59e0b' },  // amber-500
      { name: 'Skipped', value: skippedTests, color: '#64748b' }, // slate-500
    ].filter((item) => item.value > 0);

    res.status(200).json({
      success: true,
      stats: {
        totalProjects,
        totalEndpoints,
        totalTestCases,
        totalRuns,
        totalExecutions,
        passedTests,
        failedTests,
        skippedTests,
        errorTests,
        passRate,
      },
      trends,
      statusDistribution,
      recentRuns,
      recentBugs,
      frequentlyFailingEndpoints: Object.values(endpointFails).sort((a, b) => b.count - a.count).slice(0, 5),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
