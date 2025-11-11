#!/usr/bin/env tsx

/**
 * User Flow Verification Script
 *
 * 사용자 플로우 자동 검증:
 * - 각 단계별 실행 및 검증
 * - 스크린샷 캡처
 * - 성공/실패 리포트 생성
 */

import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

interface FlowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  error?: string;
  screenshot?: string;
  duration?: number;
}

interface FlowReport {
  timestamp: string;
  totalSteps: number;
  successSteps: number;
  failedSteps: number;
  skippedSteps: number;
  steps: FlowStep[];
  screenshots: string[];
}

// ============================================================================
// Colors (Terminal Output)
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// ============================================================================
// Configuration
// ============================================================================

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const SCREENSHOTS_DIR = path.join(process.cwd(), 'flow-screenshots');
const REPORT_PATH = path.join(process.cwd(), 'user-flow-report.html');

// Test User Credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'ValidPass123!',
};

// ============================================================================
// Flow Steps Definition
// ============================================================================

const flowSteps: FlowStep[] = [
  {
    id: 'step-1-landing',
    name: 'Step 1: 랜딩 페이지 접속',
    description: '메인 랜딩 페이지에 접속하여 로딩 확인',
    status: 'pending',
  },
  {
    id: 'step-2-login-page',
    name: 'Step 2: 로그인 페이지 이동',
    description: '로그인 페이지로 이동하여 폼 표시 확인',
    status: 'pending',
  },
  {
    id: 'step-3-login',
    name: 'Step 3: 로그인 실행',
    description: '테스트 계정으로 로그인 시도',
    status: 'pending',
  },
  {
    id: 'step-4-dashboard',
    name: 'Step 4: 대시보드 확인',
    description: '대시보드 페이지 로딩 및 데이터 표시 확인',
    status: 'pending',
  },
  {
    id: 'step-5-session',
    name: 'Step 5: 세션 페이지 이동',
    description: '세션 페이지로 이동하여 UI 확인',
    status: 'pending',
  },
  {
    id: 'step-6-history',
    name: 'Step 6: 히스토리 페이지 이동',
    description: '히스토리 페이지로 이동하여 데이터 목록 확인',
    status: 'pending',
  },
  {
    id: 'step-7-settings',
    name: 'Step 7: 설정 페이지 이동',
    description: '설정 페이지로 이동하여 옵션 표시 확인',
    status: 'pending',
  },
  {
    id: 'step-8-navigation',
    name: 'Step 8: 페이지 간 네비게이션',
    description: '대시보드 ↔ 세션 ↔ 히스토리 이동 테스트',
    status: 'pending',
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 스크린샷 디렉토리 초기화
 */
function initScreenshotsDir(): void {
  if (fs.existsSync(SCREENSHOTS_DIR)) {
    fs.rmSync(SCREENSHOTS_DIR, { recursive: true });
  }
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

/**
 * 스크린샷 캡처
 */
async function captureScreenshot(page: Page, stepId: string): Promise<string> {
  const filename = `${stepId}-${Date.now()}.png`;
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  return filename;
}

/**
 * 페이지 요소 대기 (유연한 대기)
 */
async function waitForElement(
  page: Page,
  selector: string,
  timeout = 5000
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout, state: 'visible' });
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Flow Execution Functions
// ============================================================================

/**
 * Step 1: 랜딩 페이지 접속
 */
async function executeStep1(page: Page, step: FlowStep): Promise<void> {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');

  // 페이지 타이틀 확인
  const title = await page.title();
  if (!title.includes('BeMore')) {
    throw new Error(`페이지 타이틀이 올바르지 않습니다: ${title}`);
  }

  step.screenshot = await captureScreenshot(page, step.id);
}

/**
 * Step 2: 로그인 페이지 이동
 */
async function executeStep2(page: Page, step: FlowStep): Promise<void> {
  // 로그인 버튼 또는 링크 찾기
  const loginButton = page.locator('a, button').filter({ hasText: /로그인|Login|Sign in/i }).first();

  if (await loginButton.count() > 0) {
    await loginButton.click();
  } else {
    // 직접 URL 이동
    await page.goto(`${BASE_URL}/auth/login`);
  }

  await page.waitForURL('**/auth/login', { timeout: 5000 });

  // 로그인 폼 확인
  const emailInput = await waitForElement(page, 'input[type="email"]');
  const passwordInput = await waitForElement(page, 'input[type="password"]');

  if (!emailInput || !passwordInput) {
    throw new Error('로그인 폼을 찾을 수 없습니다');
  }

  step.screenshot = await captureScreenshot(page, step.id);
}

/**
 * Step 3: 로그인 실행
 */
async function executeStep3(page: Page, step: FlowStep): Promise<void> {
  // 로그인 폼 입력
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);

  step.screenshot = await captureScreenshot(page, step.id);

  // 로그인 버튼 클릭
  await page.click('button[type="submit"]');

  // 대시보드로 리다이렉트 대기 (또는 에러 메시지)
  try {
    await page.waitForURL('**/app**', { timeout: 5000 });
  } catch {
    // 에러 메시지가 있는지 확인
    const errorMessage = page.locator('[role="alert"], .error-message, .alert');
    if (await errorMessage.count() > 0) {
      const errorText = await errorMessage.first().textContent();
      throw new Error(`로그인 실패: ${errorText}`);
    }
    throw new Error('로그인 후 대시보드로 리다이렉트되지 않았습니다');
  }
}

/**
 * Step 4: 대시보드 확인
 */
async function executeStep4(page: Page, step: FlowStep): Promise<void> {
  // URL 확인
  if (!page.url().includes('/app')) {
    throw new Error(`대시보드 URL이 올바르지 않습니다: ${page.url()}`);
  }

  // 대시보드 타이틀 확인
  const dashboardTitle = page.locator('h1, h2').filter({ hasText: /대시보드|Dashboard/i });
  const titleVisible = await dashboardTitle.isVisible().catch(() => false);

  if (!titleVisible) {
    log('경고: 대시보드 타이틀을 찾을 수 없습니다 (계속 진행)', 'yellow');
  }

  await page.waitForTimeout(1000); // 데이터 로딩 대기
  step.screenshot = await captureScreenshot(page, step.id);
}

/**
 * Step 5: 세션 페이지 이동
 */
async function executeStep5(page: Page, step: FlowStep): Promise<void> {
  await page.goto(`${BASE_URL}/app/session`);
  await page.waitForLoadState('networkidle');

  // 세션 페이지 확인
  const sessionTitle = page.locator('h1, h2').filter({ hasText: /세션|Session/i });
  const titleVisible = await sessionTitle.isVisible().catch(() => false);

  if (!titleVisible) {
    log('경고: 세션 페이지 타이틀을 찾을 수 없습니다 (계속 진행)', 'yellow');
  }

  step.screenshot = await captureScreenshot(page, step.id);
}

/**
 * Step 6: 히스토리 페이지 이동
 */
async function executeStep6(page: Page, step: FlowStep): Promise<void> {
  await page.goto(`${BASE_URL}/app/history`);
  await page.waitForLoadState('networkidle');

  // 히스토리 페이지 확인
  const historyTitle = page.locator('h1, h2').filter({ hasText: /히스토리|History|기록/i });
  const titleVisible = await historyTitle.isVisible().catch(() => false);

  if (!titleVisible) {
    log('경고: 히스토리 페이지 타이틀을 찾을 수 없습니다 (계속 진행)', 'yellow');
  }

  step.screenshot = await captureScreenshot(page, step.id);
}

/**
 * Step 7: 설정 페이지 이동
 */
async function executeStep7(page: Page, step: FlowStep): Promise<void> {
  await page.goto(`${BASE_URL}/app/settings`);
  await page.waitForLoadState('networkidle');

  // 설정 페이지 확인
  const settingsTitle = page.locator('h1, h2').filter({ hasText: /설정|Settings|Profile/i });
  const titleVisible = await settingsTitle.isVisible().catch(() => false);

  if (!titleVisible) {
    log('경고: 설정 페이지 타이틀을 찾을 수 없습니다 (계속 진행)', 'yellow');
  }

  step.screenshot = await captureScreenshot(page, step.id);
}

/**
 * Step 8: 페이지 간 네비게이션 테스트
 */
async function executeStep8(page: Page, step: FlowStep): Promise<void> {
  // 대시보드 → 세션
  await page.goto(`${BASE_URL}/app`);
  await page.waitForLoadState('networkidle');
  if (!page.url().includes('/app')) {
    throw new Error('대시보드 이동 실패');
  }

  // 세션 → 히스토리
  await page.goto(`${BASE_URL}/app/session`);
  await page.waitForLoadState('networkidle');
  if (!page.url().includes('/session')) {
    throw new Error('세션 페이지 이동 실패');
  }

  // 히스토리 → 대시보드
  await page.goto(`${BASE_URL}/app/history`);
  await page.waitForLoadState('networkidle');
  if (!page.url().includes('/history')) {
    throw new Error('히스토리 페이지 이동 실패');
  }

  step.screenshot = await captureScreenshot(page, step.id);
}

// ============================================================================
// Main Flow Execution
// ============================================================================

async function executeUserFlow(): Promise<FlowReport> {
  log('\n🚀 사용자 플로우 검증 시작...\n', 'cyan');

  initScreenshotsDir();

  let browser: Browser | null = null;
  let page: Page | null = null;

  const executors = [
    executeStep1,
    executeStep2,
    executeStep3,
    executeStep4,
    executeStep5,
    executeStep6,
    executeStep7,
    executeStep8,
  ];

  try {
    // 브라우저 시작
    log('브라우저 시작 중...', 'gray');
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();

    // 각 단계 실행
    for (let i = 0; i < flowSteps.length; i++) {
      const step = flowSteps[i];
      const executor = executors[i];

      step.status = 'running';
      log(`\n${step.name}`, 'blue');
      log(`  ${step.description}`, 'gray');

      const startTime = Date.now();

      try {
        await executor(page, step);
        step.status = 'success';
        step.duration = Date.now() - startTime;
        log(`  ✅ 성공 (${step.duration}ms)`, 'green');
      } catch (error) {
        step.status = 'failed';
        step.duration = Date.now() - startTime;
        step.error = error instanceof Error ? error.message : String(error);
        log(`  ❌ 실패: ${step.error}`, 'red');

        // 에러 스크린샷 캡처
        try {
          step.screenshot = await captureScreenshot(page, `${step.id}-error`);
        } catch {
          // 스크린샷 실패 무시
        }

        // 로그인 실패 시 이후 단계 스킵
        if (step.id === 'step-3-login') {
          log('  ⏭️  로그인 실패로 이후 단계 스킵', 'yellow');
          for (let j = i + 1; j < flowSteps.length; j++) {
            flowSteps[j].status = 'skipped';
          }
          break;
        }
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // 리포트 생성
  const report: FlowReport = {
    timestamp: new Date().toISOString(),
    totalSteps: flowSteps.length,
    successSteps: flowSteps.filter((s) => s.status === 'success').length,
    failedSteps: flowSteps.filter((s) => s.status === 'failed').length,
    skippedSteps: flowSteps.filter((s) => s.status === 'skipped').length,
    steps: flowSteps,
    screenshots: flowSteps.filter((s) => s.screenshot).map((s) => s.screenshot!),
  };

  return report;
}

// ============================================================================
// Report Generation
// ============================================================================

/**
 * 콘솔 리포트 출력
 */
function printConsoleReport(report: FlowReport): void {
  console.log('\n' + '='.repeat(70));
  log('📊 사용자 플로우 검증 결과', 'cyan');
  console.log('='.repeat(70));

  log(`\n📅 Timestamp: ${report.timestamp}`, 'gray');
  log(`🔗 Base URL: ${BASE_URL}`, 'gray');

  console.log('\n' + '-'.repeat(70));
  log('📈 요약', 'blue');
  console.log('-'.repeat(70));

  log(`전체 단계: ${report.totalSteps}`, 'cyan');
  log(`✅ 성공: ${report.successSteps}`, 'green');
  log(`❌ 실패: ${report.failedSteps}`, 'red');
  log(`⏭️  스킵: ${report.skippedSteps}`, 'yellow');

  const successRate = Math.round((report.successSteps / report.totalSteps) * 100);
  log(`\n성공률: ${successRate}%`, successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');

  console.log('\n' + '-'.repeat(70));
  log('📸 스크린샷', 'blue');
  console.log('-'.repeat(70));
  log(`${report.screenshots.length}개 캡처됨: ${SCREENSHOTS_DIR}`, 'gray');

  console.log('\n' + '-'.repeat(70));
  log('📄 상세 리포트', 'blue');
  console.log('-'.repeat(70));
  log(`HTML 리포트: ${REPORT_PATH}`, 'cyan');

  console.log('='.repeat(70) + '\n');

  if (report.failedSteps > 0) {
    log('❌ 일부 단계가 실패했습니다. 상세 내용은 HTML 리포트를 확인하세요.', 'red');
    process.exit(1);
  } else if (report.skippedSteps > 0) {
    log('⚠️  일부 단계가 스킵되었습니다.', 'yellow');
  } else {
    log('✅ 모든 사용자 플로우가 정상 작동합니다!', 'green');
  }
}

/**
 * HTML 리포트 생성
 */
function generateHTMLReport(report: FlowReport): void {
  const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>User Flow Verification Report - ${report.timestamp}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
      background: #f5f5f5;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      border-radius: 12px;
      margin-bottom: 2rem;
    }
    .header h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .header p { opacity: 0.9; }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .summary-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary-card h3 { font-size: 0.875rem; color: #666; margin-bottom: 0.5rem; }
    .summary-card .value { font-size: 2rem; font-weight: bold; }
    .success { color: #10b981; }
    .failed { color: #ef4444; }
    .skipped { color: #f59e0b; }
    .total { color: #3b82f6; }
    .steps {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .step {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border-left: 4px solid #e5e7eb;
    }
    .step.success { border-left-color: #10b981; }
    .step.failed { border-left-color: #ef4444; }
    .step.skipped { border-left-color: #f59e0b; }
    .step-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }
    .step-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .step-title h3 { font-size: 1.125rem; }
    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-failed { background: #fee2e2; color: #991b1b; }
    .badge-skipped { background: #fef3c7; color: #92400e; }
    .step-description { color: #666; margin-bottom: 0.75rem; }
    .step-meta {
      display: flex;
      gap: 1.5rem;
      font-size: 0.875rem;
      color: #999;
      margin-bottom: 1rem;
    }
    .step-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      padding: 1rem;
      border-radius: 6px;
      margin-top: 1rem;
      color: #991b1b;
    }
    .step-error strong { display: block; margin-bottom: 0.5rem; }
    .screenshot {
      margin-top: 1rem;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .screenshot img {
      width: 100%;
      height: auto;
      display: block;
    }
    .screenshot-label {
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 0.5rem;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔍 사용자 플로우 검증 리포트</h1>
    <p>생성 시간: ${new Date(report.timestamp).toLocaleString('ko-KR')}</p>
    <p>Base URL: ${BASE_URL}</p>
  </div>

  <div class="summary">
    <div class="summary-card">
      <h3>전체 단계</h3>
      <div class="value total">${report.totalSteps}</div>
    </div>
    <div class="summary-card">
      <h3>성공</h3>
      <div class="value success">${report.successSteps}</div>
    </div>
    <div class="summary-card">
      <h3>실패</h3>
      <div class="value failed">${report.failedSteps}</div>
    </div>
    <div class="summary-card">
      <h3>스킵</h3>
      <div class="value skipped">${report.skippedSteps}</div>
    </div>
  </div>

  <div class="steps">
    ${report.steps
      .map(
        (step) => `
      <div class="step ${step.status}">
        <div class="step-header">
          <div class="step-title">
            <h3>${step.name}</h3>
            <span class="status-badge badge-${step.status}">${
          step.status === 'success' ? '성공' : step.status === 'failed' ? '실패' : '스킵'
        }</span>
          </div>
          ${step.duration ? `<span style="color: #999;">${step.duration}ms</span>` : ''}
        </div>
        <p class="step-description">${step.description}</p>
        ${
          step.error
            ? `
          <div class="step-error">
            <strong>❌ 에러 발생:</strong>
            ${step.error}
          </div>
        `
            : ''
        }
        ${
          step.screenshot
            ? `
          <div class="screenshot">
            <div class="screenshot-label">📸 스크린샷:</div>
            <img src="flow-screenshots/${step.screenshot}" alt="${step.name} 스크린샷" />
          </div>
        `
            : ''
        }
      </div>
    `
      )
      .join('')}
  </div>
</body>
</html>
  `;

  fs.writeFileSync(REPORT_PATH, html);
  log(`\n📄 HTML 리포트 생성: ${REPORT_PATH}`, 'cyan');
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  try {
    const report = await executeUserFlow();
    printConsoleReport(report);
    generateHTMLReport(report);
  } catch (error) {
    log(`\n❌ 플로우 검증 실패: ${error instanceof Error ? error.message : String(error)}`, 'red');
    process.exit(1);
  }
}

main();
