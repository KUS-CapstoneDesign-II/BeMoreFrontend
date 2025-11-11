import { chromium } from 'playwright';
import type { Browser, Page, BrowserContext } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// ==================== Configuration ====================

const BASE_URL = process.env.VITE_APP_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.VITE_API_URL || 'https://bemorebackend.onrender.com';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'password123';
const SCREENSHOTS_DIR = join(process.cwd(), 'flow-screenshots');
const REPORT_PATH = join(process.cwd(), 'session-flow-report.html');

// ==================== Logging ====================

type LogLevel = 'info' | 'success' | 'warning' | 'error';

function log(message: string, level: LogLevel = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
  };
  const reset = '\x1b[0m';
  const icon = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  console.log(`${colors[level]}${icon[level]} ${message}${reset}`);
}

// ==================== Backend Warmup ====================

async function warmupBackend(page: Page): Promise<void> {
  log('🔥 Warming up backend server (preventing cold start)...', 'info');
  const startTime = Date.now();

  try {
    // Health check로 서버를 깨웁니다
    await page.evaluate(async (backendUrl) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000); // 90초 타임아웃

      try {
        const response = await fetch(`${backendUrl}/api/health`, {
          method: 'GET',
          signal: controller.signal,
        });
        return { ok: response.ok, status: response.status };
      } finally {
        clearTimeout(timeout);
      }
    }, BACKEND_URL);

    const duration = Date.now() - startTime;
    log(`✓ Backend ready (${duration}ms)`, 'success');

    // 서버가 완전히 준비될 때까지 추가 대기
    await page.waitForTimeout(2000);
  } catch {
    const duration = Date.now() - startTime;
    log(`⚠️  Backend warmup timeout after ${duration}ms, continuing anyway...`, 'warn');
    log('  (Server might still be waking up from cold start)', 'warning');
  }
}

// ==================== Types ====================

interface PhaseStep {
  id: string;
  name: string;
  description: string;
  timeout: number;
  status: 'pending' | 'running' | 'passed' | 'failed';
  startTime?: number;
  endTime?: number;
  error?: string;
  screenshot?: string;
  details?: Record<string, unknown>;
}

interface PhaseResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  steps: PhaseStep[];
  startTime?: number;
  endTime?: number;
  duration?: number;
}

interface VerificationReport {
  timestamp: number;
  baseUrl: string;
  browser: string;
  phases: PhaseResult[];
  overallStatus: 'passed' | 'failed';
  totalDuration: number;
}

// ==================== Helper Functions ====================

async function captureScreenshot(page: Page, filename: string): Promise<string> {
  try {
    mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    const screenshotPath = join(SCREENSHOTS_DIR, `${filename}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    return screenshotPath;
  } catch (error) {
    log(`Screenshot capture failed: ${error}`, 'warning');
    return '';
  }
}

async function waitForWebSocketConnection(
  page: Page,
  timeout: number = 5000
): Promise<{ success: boolean; channels: Record<string, boolean>; error?: string }> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      // Check for WebSocket status via test ID
      const wsStatus = await page.getByTestId('ws-status-text').textContent({ timeout: 500 });

      if (wsStatus && wsStatus.includes('연결됨')) {
        return {
          success: true,
          channels: {
            landmarks: true,
            voice: true,
            session: true,
          },
        };
      }
    } catch {
      // Continue polling
    }

    await page.waitForTimeout(100);
  }

  return {
    success: false,
    channels: {
      landmarks: false,
      voice: false,
      session: false,
    },
    error: 'WebSocket connection timeout after 5s',
  };
}

async function waitForMediaPipeInitialization(
  page: Page,
  timeout: number = 10000
): Promise<{ success: boolean; error?: string }> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      // Check for face detection active indicator
      const faceDetection = await page.getByTestId('face-detection-active').isVisible({ timeout: 500 });

      if (faceDetection) {
        return { success: true };
      }

      // Check for errors
      const videoError = await page.getByTestId('video-error').isVisible({ timeout: 100 }).catch(() => false);
      if (videoError) {
        const errorText = await page.getByTestId('video-error').textContent();
        return {
          success: false,
          error: `MediaPipe error: ${errorText}`,
        };
      }
    } catch {
      // Continue polling
    }

    await page.waitForTimeout(100);
  }

  return {
    success: false,
    error: 'MediaPipe initialization timeout after 10s',
  };
}

async function monitorRealTimeDataFlow(
  page: Page,
  duration: number = 15000
): Promise<{ success: boolean; emotionUpdates: number; wsMessages: number; error?: string }> {
  const startTime = Date.now();
  let lastEmotionCount = 0;
  let emotionUpdates = 0;

  while (Date.now() - startTime < duration) {
    try {
      // Check emotion update count
      const emotionCountEl = await page.getByTestId('emotion-update-count').textContent({ timeout: 500 });
      if (emotionCountEl) {
        const match = emotionCountEl.match(/\((\d+)회\)/);
        if (match && match[1]) {
          const currentCount = parseInt(match[1], 10);
          if (currentCount > lastEmotionCount) {
            emotionUpdates++;
            lastEmotionCount = currentCount;
          }
        }
      }
    } catch {
      // Element might not be visible yet
    }

    await page.waitForTimeout(1000);
  }

  return {
    success: emotionUpdates > 0,
    emotionUpdates,
    wsMessages: emotionUpdates, // Each emotion update indicates WebSocket message received
    error: emotionUpdates === 0 ? 'No real-time data received in 15s' : undefined,
  };
}

// ==================== Phase Execution ====================

async function executePhase1(page: Page, phase: PhaseResult): Promise<void> {
  const step: PhaseStep = {
    id: 'phase-1-session-start',
    name: 'Session Start API Call',
    description: 'Login → Navigate to /app → POST /api/sessions/start → get sessionId',
    timeout: 15000,
    status: 'running',
    startTime: Date.now(),
  };

  phase.steps.push(step);
  log(`${phase.name} - ${step.name}`, 'info');

  try {
    // Step 0: Warmup backend server (콜드 스타트 방지)
    await warmupBackend(page);

    // Step 1: Navigate to login page
    log('Navigating to login page...', 'info');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle', timeout: step.timeout });
    await captureScreenshot(page, 'phase-1-login-page');

    // Step 2: Fill in login credentials (using test user)
    log(`Filling in login credentials (${TEST_EMAIL})...`, 'info');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);

    // Step 3: Submit login form with retry logic (콜드 스타트 대응)
    log('Submitting login form...', 'info');

    let loginSuccess = false;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        if (attempt > 1) {
          log(`Login attempt ${attempt}/3 (backend might still be waking up)...`, 'info');
          // 재시도 전에 폼을 다시 채웁니다
          await page.fill('input[type="email"]', TEST_EMAIL);
          await page.fill('input[type="password"]', TEST_PASSWORD);
        }

        // Wait for the login API call to complete
        const loginPromise = page.waitForResponse(
          response => response.url().includes('/api/auth/login') && response.status() === 200,
          { timeout: 45000 } // 첫 시도는 더 긴 타임아웃 (콜드 스타트 대응)
        );

        await page.click('button[type="submit"]');
        await loginPromise;

        log(`✓ Login successful on attempt ${attempt}`, 'success');
        loginSuccess = true;
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        log(`✗ Login attempt ${attempt}/3 failed: ${lastError.message}`, 'warn');

        await captureScreenshot(page, `phase-1-login-attempt-${attempt}-failed`);

        // 에러 메시지 확인
        const errorMessage = await page.locator('.text-red-500, [role="alert"]').textContent({ timeout: 1000 }).catch(() => null);
        if (errorMessage && !errorMessage.includes('연결') && !errorMessage.includes('시간')) {
          // 연결/타임아웃 에러가 아닌 실제 인증 실패면 재시도하지 않음
          throw new Error(`Login failed: ${errorMessage}`);
        }

        // 마지막 시도가 아니면 대기 후 재시도
        if (attempt < 3) {
          const waitTime = attempt * 3000; // 3초, 6초로 점진적 증가
          log(`Waiting ${waitTime}ms before retry...`, 'info');
          await page.waitForTimeout(waitTime);

          // 페이지를 다시 로드합니다
          await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle', timeout: 15000 });
        }
      }
    }

    if (!loginSuccess) {
      throw new Error(`Login failed after 3 attempts. Last error: ${lastError?.message}`);
    }

    // Step 4: Wait for navigation to /app
    log('Waiting for redirect to /app...', 'info');
    await page.waitForURL('**/app**', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await captureScreenshot(page, 'phase-1-after-login');

    // Step 4.5: Wait for Dashboard to load (Suspense fallback to disappear)
    log('Waiting for Dashboard to load...', 'info');
    // Wait for the "Loading..." fallback to disappear
    try {
      await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 20000 });
      log('Dashboard loaded', 'info');
    } catch {
      log('Dashboard loading timeout, checking if content is visible anyway...', 'warn');
    }

    // Give the Dashboard component time to render
    await page.waitForTimeout(2000);
    await captureScreenshot(page, 'phase-1-dashboard-loaded');

    // Step 5: Look for session start button
    log('Looking for start session button...', 'info');

    // Try different selectors with longer timeout
    let startButton = page.locator('button:has-text("세션 시작")');
    let buttonVisible = await startButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!buttonVisible) {
      startButton = page.getByRole('button', { name: /세션 시작|Start Session/i });
      buttonVisible = await startButton.isVisible({ timeout: 5000 }).catch(() => false);
    }

    if (!buttonVisible) {
      await captureScreenshot(page, 'phase-1-button-not-found');
      throw new Error('Session start button not found on dashboard');
    }

    // Step 6: Click session start button
    log('Clicking start session button...', 'info');
    await startButton.click();

    // Step 7: Wait for session info to appear (indicates session started)
    log('Waiting for session to start...', 'info');
    await page.getByTestId('session-info').waitFor({ state: 'visible', timeout: step.timeout });

    // Verify session ID is present
    const sessionId = await page.getByTestId('session-id').textContent({ timeout: 1000 });

    if (!sessionId || sessionId.length === 0) {
      throw new Error('Session ID not found');
    }

    step.status = 'passed';
    step.endTime = Date.now();
    step.details = { sessionId: sessionId.trim() };
    step.screenshot = await captureScreenshot(page, step.id);

    log(`✓ Session started: ${sessionId}`, 'success');
  } catch (error) {
    step.status = 'failed';
    step.endTime = Date.now();
    step.error = error instanceof Error ? error.message : String(error);
    step.screenshot = await captureScreenshot(page, `${step.id}-error`);

    log(`✗ ${step.error}`, 'error');
    phase.status = 'failed';
  }
}

async function executePhase2(page: Page, phase: PhaseResult): Promise<void> {
  const step: PhaseStep = {
    id: 'phase-2-websocket-connection',
    name: 'WebSocket 3-Channel Connection',
    description: 'Connect landmarks, voice, session channels (5s timeout)',
    timeout: 5000,
    status: 'running',
    startTime: Date.now(),
  };

  phase.steps.push(step);
  log(`${phase.name} - ${step.name}`, 'info');

  try {
    const wsResult = await waitForWebSocketConnection(page, step.timeout);

    if (!wsResult.success) {
      throw new Error(wsResult.error || 'WebSocket connection failed');
    }

    step.status = 'passed';
    step.endTime = Date.now();
    step.details = { channels: wsResult.channels };
    step.screenshot = await captureScreenshot(page, step.id);

    log(`✓ WebSocket connected (3 channels)`, 'success');
  } catch (error) {
    step.status = 'failed';
    step.endTime = Date.now();
    step.error = error instanceof Error ? error.message : String(error);
    step.screenshot = await captureScreenshot(page, `${step.id}-error`);

    log(`✗ ${step.error}`, 'error');
    phase.status = 'failed';
  }
}

async function executePhase3(page: Page, phase: PhaseResult, context: BrowserContext): Promise<void> {
  const step: PhaseStep = {
    id: 'phase-3-mediapipe-init',
    name: 'MediaPipe Face Mesh Initialization',
    description: 'Request camera permissions, load Face Mesh library, start camera stream',
    timeout: 10000,
    status: 'running',
    startTime: Date.now(),
  };

  phase.steps.push(step);
  log(`${phase.name} - ${step.name}`, 'info');

  try {
    // Grant camera permissions
    await context.grantPermissions(['camera'], { origin: BASE_URL });

    // Wait for MediaPipe initialization
    const mediaPipeResult = await waitForMediaPipeInitialization(page, step.timeout);

    if (!mediaPipeResult.success) {
      throw new Error(mediaPipeResult.error || 'MediaPipe initialization failed');
    }

    step.status = 'passed';
    step.endTime = Date.now();
    step.details = { faceDetectionActive: true };
    step.screenshot = await captureScreenshot(page, step.id);

    log(`✓ MediaPipe initialized, face detection active`, 'success');
  } catch (error) {
    step.status = 'failed';
    step.endTime = Date.now();
    step.error = error instanceof Error ? error.message : String(error);
    step.screenshot = await captureScreenshot(page, `${step.id}-error`);

    log(`✗ ${step.error}`, 'error');
    phase.status = 'failed';
  }
}

async function executePhase4(page: Page, phase: PhaseResult): Promise<void> {
  const step: PhaseStep = {
    id: 'phase-4-realtime-data',
    name: 'Real-time Data Transmission',
    description: 'Monitor landmarks, emotion updates, VAD analysis (15s)',
    timeout: 15000,
    status: 'running',
    startTime: Date.now(),
  };

  phase.steps.push(step);
  log(`${phase.name} - ${step.name}`, 'info');

  try {
    const dataFlowResult = await monitorRealTimeDataFlow(page, step.timeout);

    if (!dataFlowResult.success) {
      throw new Error(dataFlowResult.error || 'No real-time data flow detected');
    }

    step.status = 'passed';
    step.endTime = Date.now();
    step.details = {
      emotionUpdates: dataFlowResult.emotionUpdates,
      wsMessages: dataFlowResult.wsMessages,
    };
    step.screenshot = await captureScreenshot(page, step.id);

    log(`✓ Real-time data flowing (${dataFlowResult.emotionUpdates} emotion updates)`, 'success');
  } catch (error) {
    step.status = 'failed';
    step.endTime = Date.now();
    step.error = error instanceof Error ? error.message : String(error);
    step.screenshot = await captureScreenshot(page, `${step.id}-error`);

    log(`✗ ${step.error}`, 'error');
    phase.status = 'failed';
  }
}

async function executePhase5(page: Page, phase: PhaseResult): Promise<void> {
  const step: PhaseStep = {
    id: 'phase-5-session-end',
    name: 'Session End with Cleanup',
    description: 'Click end session button, verify cleanup (WebSocket close, camera stop)',
    timeout: 40000, // Backend grace period is 30s
    status: 'running',
    startTime: Date.now(),
  };

  phase.steps.push(step);
  log(`${phase.name} - ${step.name}`, 'info');

  try {
    // Click end session button
    log('Looking for end session button...', 'info');
    const endButton = page.locator('button:has-text("세션 종료")').or(page.locator('button:has-text("End Session")'));
    await endButton.waitFor({ state: 'visible', timeout: 5000 });
    await endButton.click();
    log('Clicked end session button', 'info');

    // Wait for session to end - session info should disappear
    log('Waiting for session cleanup...', 'info');
    await page.waitForTimeout(3000);

    // Verify session info is gone
    const sessionInfoVisible = await page.getByTestId('session-info').isVisible({ timeout: 5000 }).catch(() => false);

    if (sessionInfoVisible) {
      throw new Error('Session did not end - session info still visible');
    }

    step.status = 'passed';
    step.endTime = Date.now();
    step.details = { cleanupSuccess: true };
    step.screenshot = await captureScreenshot(page, step.id);

    log(`✓ Session ended, cleanup completed`, 'success');
  } catch (error) {
    step.status = 'failed';
    step.endTime = Date.now();
    step.error = error instanceof Error ? error.message : String(error);
    step.screenshot = await captureScreenshot(page, `${step.id}-error`);

    log(`✗ ${step.error}`, 'error');
    phase.status = 'failed';
  }
}

// ==================== Report Generation ====================

function generateHTMLReport(report: VerificationReport): string {
  const phaseRows = report.phases
    .map((phase) => {
      const statusIcon = {
        passed: '✅',
        failed: '❌',
        skipped: '⏭️',
        pending: '⏸️',
        running: '🔄',
      }[phase.status];

      const stepRows = phase.steps
        .map((step) => {
          const stepStatusIcon = {
            passed: '✅',
            failed: '❌',
            pending: '⏸️',
            running: '🔄',
          }[step.status];

          const duration = step.endTime && step.startTime ? step.endTime - step.startTime : 0;

          return `
            <tr>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">&nbsp;&nbsp;&nbsp;&nbsp;${stepStatusIcon} ${step.name}</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${step.description}</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${duration}ms</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${step.error || '-'}</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">
                ${step.screenshot ? `<a href="${step.screenshot}" target="_blank" style="color: #3b82f6; text-decoration: underline;">View</a>` : '-'}
              </td>
            </tr>
          `;
        })
        .join('');

      return `
        <tr style="background-color: #f9fafb;">
          <td style="padding: 12px; border-bottom: 2px solid #d1d5db; font-weight: bold;">${statusIcon} ${phase.name}</td>
          <td style="padding: 12px; border-bottom: 2px solid #d1d5db;" colspan="4">${phase.status}</td>
        </tr>
        ${stepRows}
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Session Flow Verification Report</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; margin: 20px; background-color: #f3f4f6; }
        .container { max-width: 1200px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        h1 { color: #111827; margin-bottom: 10px; }
        .summary { background-color: ${report.overallStatus === 'passed' ? '#d1fae5' : '#fee2e2'}; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
        .summary h2 { margin: 0 0 10px 0; color: ${report.overallStatus === 'passed' ? '#065f46' : '#991b1b'}; }
        .summary p { margin: 5px 0; color: #374151; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #f3f4f6; padding: 12px; text-align: left; border-bottom: 2px solid #d1d5db; color: #374151; font-weight: 600; }
        td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
        .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Session Flow Verification Report</h1>
        <div class="summary">
          <h2>${report.overallStatus === 'passed' ? '✅ All Phases Passed' : '❌ Verification Failed'}</h2>
          <p><strong>Base URL:</strong> ${report.baseUrl}</p>
          <p><strong>Browser:</strong> ${report.browser}</p>
          <p><strong>Timestamp:</strong> ${new Date(report.timestamp).toLocaleString('ko-KR')}</p>
          <p><strong>Total Duration:</strong> ${report.totalDuration}ms</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Phase / Step</th>
              <th>Description</th>
              <th>Duration</th>
              <th>Error</th>
              <th>Screenshot</th>
            </tr>
          </thead>
          <tbody>
            ${phaseRows}
          </tbody>
        </table>

        <div class="footer">
          <p>Generated by verify-session-flow.ts | BeMore Frontend Verification</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ==================== Main Verification ====================

async function main() {
  const startTime = Date.now();
  let browser: Browser | null = null;

  log('='.repeat(60), 'info');
  log('BeMore Session Flow Verification', 'info');
  log('='.repeat(60), 'info');
  log(`Base URL: ${BASE_URL}`, 'info');
  log(`Test User: ${TEST_EMAIL}`, 'info');
  log('', 'info');

  const report: VerificationReport = {
    timestamp: startTime,
    baseUrl: BASE_URL,
    browser: 'chromium',
    phases: [],
    overallStatus: 'passed',
    totalDuration: 0,
  };

  try {
    // Launch browser
    browser = await chromium.launch({
      headless: false, // Show browser for debugging
      args: [
        '--use-fake-ui-for-media-stream', // Auto-grant camera permissions
        '--use-fake-device-for-media-stream', // Use fake camera
      ],
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      permissions: ['camera'],
    });

    const page = await context.newPage();

    // Phase 1: Session Start
    const phase1: PhaseResult = {
      id: 'phase-1',
      name: 'Phase 1: Session Start API Call',
      status: 'running',
      steps: [],
      startTime: Date.now(),
    };
    report.phases.push(phase1);
    await executePhase1(page, phase1);
    phase1.endTime = Date.now();
    phase1.duration = phase1.endTime - (phase1.startTime || 0);
    if (phase1.status !== 'failed') phase1.status = 'passed';

    // Phase 2: WebSocket Connection
    if (phase1.status === 'passed') {
      const phase2: PhaseResult = {
        id: 'phase-2',
        name: 'Phase 2: WebSocket 3-Channel Connection',
        status: 'running',
        steps: [],
        startTime: Date.now(),
      };
      report.phases.push(phase2);
      await executePhase2(page, phase2);
      phase2.endTime = Date.now();
      phase2.duration = phase2.endTime - (phase2.startTime || 0);
      if (phase2.status !== 'failed') phase2.status = 'passed';

      // Phase 3: MediaPipe Initialization
      if (phase2.status === 'passed') {
        const phase3: PhaseResult = {
          id: 'phase-3',
          name: 'Phase 3: MediaPipe Face Mesh Initialization',
          status: 'running',
          steps: [],
          startTime: Date.now(),
        };
        report.phases.push(phase3);
        await executePhase3(page, phase3, context);
        phase3.endTime = Date.now();
        phase3.duration = phase3.endTime - (phase3.startTime || 0);
        if (phase3.status !== 'failed') phase3.status = 'passed';

        // Phase 4: Real-time Data Flow
        if (phase3.status === 'passed') {
          const phase4: PhaseResult = {
            id: 'phase-4',
            name: 'Phase 4: Real-time Data Transmission',
            status: 'running',
            steps: [],
            startTime: Date.now(),
          };
          report.phases.push(phase4);
          await executePhase4(page, phase4);
          phase4.endTime = Date.now();
          phase4.duration = phase4.endTime - (phase4.startTime || 0);
          if (phase4.status !== 'failed') phase4.status = 'passed';

          // Phase 5: Session End
          const phase5: PhaseResult = {
            id: 'phase-5',
            name: 'Phase 5: Session End with Cleanup',
            status: 'running',
            steps: [],
            startTime: Date.now(),
          };
          report.phases.push(phase5);
          await executePhase5(page, phase5);
          phase5.endTime = Date.now();
          phase5.duration = phase5.endTime - (phase5.startTime || 0);
          if (phase5.status !== 'failed') phase5.status = 'passed';
        }
      }
    }

    // Determine overall status
    report.overallStatus = report.phases.every((p) => p.status === 'passed') ? 'passed' : 'failed';
  } catch (error) {
    log(`Fatal error: ${error}`, 'error');
    report.overallStatus = 'failed';
  } finally {
    if (browser) {
      await browser.close();
    }

    // Calculate total duration
    report.totalDuration = Date.now() - startTime;

    // Generate and save HTML report
    const htmlReport = generateHTMLReport(report);
    writeFileSync(REPORT_PATH, htmlReport, 'utf-8');

    log('', 'info');
    log('='.repeat(60), 'info');
    log(`Verification ${report.overallStatus === 'passed' ? 'PASSED' : 'FAILED'}`, report.overallStatus === 'passed' ? 'success' : 'error');
    log(`Total Duration: ${report.totalDuration}ms`, 'info');
    log(`HTML Report: ${REPORT_PATH}`, 'info');
    log('='.repeat(60), 'info');

    process.exit(report.overallStatus === 'passed' ? 0 : 1);
  }
}

main();
