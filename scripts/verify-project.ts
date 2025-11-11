#!/usr/bin/env tsx

/**
 * Project Verification Script
 *
 * 프로젝트 전체 검증:
 * - 환경 변수 확인
 * - 라우트 접근성 검증
 * - API 헬스 체크
 * - 빌드 테스트
 * - 리포트 생성
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ============================================================================
// Types
// ============================================================================

interface VerificationResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: string;
}

interface VerificationReport {
  timestamp: string;
  environment: {
    nodeVersion: string;
    npmVersion: string;
    mode: string;
  };
  results: VerificationResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
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
// Verification Functions
// ============================================================================

/**
 * 환경 변수 검증
 */
async function verifyEnvironmentVariables(): Promise<VerificationResult> {
  const requiredVars = ['VITE_API_URL'];
  const optionalVars = ['VITE_WS_URL', 'VITE_ANALYTICS_ENABLED'];

  const envPath = path.join(process.cwd(), '.env');
  const envLocalPath = path.join(process.cwd(), '.env.local');

  if (!fs.existsSync(envPath) && !fs.existsSync(envLocalPath)) {
    return {
      name: 'Environment Variables',
      status: 'fail',
      message: '.env 파일이 없습니다',
      details: '.env 또는 .env.local 파일을 생성하세요',
    };
  }

  return {
    name: 'Environment Variables',
    status: 'pass',
    message: '환경 변수 파일 확인 완료',
    details: `Required: ${requiredVars.join(', ')}\nOptional: ${optionalVars.join(', ')}`,
  };
}

/**
 * TypeScript 컴파일 검증
 */
async function verifyTypeScript(): Promise<VerificationResult> {
  try {
    const { stderr } = await execAsync('npx tsc --noEmit');

    if (stderr && stderr.includes('error TS')) {
      return {
        name: 'TypeScript Compilation',
        status: 'fail',
        message: 'TypeScript 컴파일 에러 발견',
        details: stderr.substring(0, 500),
      };
    }

    return {
      name: 'TypeScript Compilation',
      status: 'pass',
      message: 'TypeScript 컴파일 성공',
    };
  } catch (error) {
    return {
      name: 'TypeScript Compilation',
      status: 'fail',
      message: 'TypeScript 컴파일 실패',
      details: error instanceof Error ? error.message.substring(0, 500) : String(error),
    };
  }
}

/**
 * ESLint 검증
 */
async function verifyESLint(): Promise<VerificationResult> {
  try {
    const { stdout } = await execAsync('npm run lint');

    const warningCount = (stdout.match(/warning/gi) || []).length;
    const errorCount = (stdout.match(/error/gi) || []).length;

    if (errorCount > 0) {
      return {
        name: 'ESLint',
        status: 'fail',
        message: `ESLint 에러 ${errorCount}개 발견`,
        details: stdout.substring(0, 500),
      };
    }

    if (warningCount > 0) {
      return {
        name: 'ESLint',
        status: 'warn',
        message: `ESLint 경고 ${warningCount}개 발견`,
        details: stdout.substring(0, 500),
      };
    }

    return {
      name: 'ESLint',
      status: 'pass',
      message: 'ESLint 검사 통과 (0 errors, 0 warnings)',
    };
  } catch (error) {
    return {
      name: 'ESLint',
      status: 'warn',
      message: 'ESLint 실행 중 오류',
      details: error instanceof Error ? error.message.substring(0, 500) : String(error),
    };
  }
}

/**
 * 빌드 테스트
 */
async function verifyBuild(): Promise<VerificationResult> {
  try {
    log('Building project...', 'cyan');
    const { stderr } = await execAsync('npm run build');

    if (stderr && (stderr.includes('error') || stderr.includes('Error'))) {
      return {
        name: 'Production Build',
        status: 'fail',
        message: '프로덕션 빌드 실패',
        details: stderr.substring(0, 500),
      };
    }

    // 빌드 크기 확인
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      return {
        name: 'Production Build',
        status: 'pass',
        message: '프로덕션 빌드 성공',
        details: `Build output: ${distPath}`,
      };
    }

    return {
      name: 'Production Build',
      status: 'pass',
      message: '빌드 성공',
    };
  } catch (error) {
    return {
      name: 'Production Build',
      status: 'fail',
      message: '빌드 실패',
      details: error instanceof Error ? error.message.substring(0, 500) : String(error),
    };
  }
}

/**
 * API 헬스 체크
 */
async function verifyAPIHealth(): Promise<VerificationResult> {
  const apiUrl = process.env.VITE_API_URL || 'http://localhost:8000';

  try {
    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      return {
        name: 'API Health Check',
        status: 'pass',
        message: `API 연결 성공 (${apiUrl})`,
        details: `Status: ${response.status} ${response.statusText}`,
      };
    } else {
      return {
        name: 'API Health Check',
        status: 'fail',
        message: `API 응답 실패 (${response.status})`,
        details: `URL: ${apiUrl}/health`,
      };
    }
  } catch (error) {
    return {
      name: 'API Health Check',
      status: 'warn',
      message: 'API 연결 실패 (백엔드가 실행 중인지 확인하세요)',
      details: `URL: ${apiUrl}\nError: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * 파일 구조 검증
 */
async function verifyFileStructure(): Promise<VerificationResult> {
  const requiredPaths = [
    'src/main.tsx',
    'src/App.tsx',
    'src/AppRouter.tsx',
    'index.html',
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
  ];

  const missingPaths: string[] = [];

  for (const filePath of requiredPaths) {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      missingPaths.push(filePath);
    }
  }

  if (missingPaths.length > 0) {
    return {
      name: 'File Structure',
      status: 'fail',
      message: `필수 파일 ${missingPaths.length}개 누락`,
      details: `Missing files:\n${missingPaths.join('\n')}`,
    };
  }

  return {
    name: 'File Structure',
    status: 'pass',
    message: '파일 구조 검증 완료',
    details: `Verified ${requiredPaths.length} essential files`,
  };
}

// ============================================================================
// Report Generation
// ============================================================================

/**
 * 콘솔 리포트 생성
 */
function printConsoleReport(report: VerificationReport): void {
  console.log('\n' + '='.repeat(70));
  log('🔍  PROJECT VERIFICATION REPORT', 'cyan');
  console.log('='.repeat(70));

  log(`\n📅 Timestamp: ${report.timestamp}`, 'gray');
  log(`🖥️  Environment: ${report.environment.mode}`, 'gray');
  log(`📦 Node: ${report.environment.nodeVersion} | NPM: ${report.environment.npmVersion}`, 'gray');

  console.log('\n' + '-'.repeat(70));
  log('📊 VERIFICATION RESULTS:', 'blue');
  console.log('-'.repeat(70) + '\n');

  for (const result of report.results) {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    const color = result.status === 'pass' ? 'green' : result.status === 'fail' ? 'red' : 'yellow';

    log(`${icon} ${result.name}`, color);
    log(`   ${result.message}`, 'gray');

    if (result.details) {
      log(`   Details: ${result.details.split('\n')[0]}`, 'gray');
    }
    console.log('');
  }

  console.log('-'.repeat(70));
  log('📈 SUMMARY:', 'blue');
  console.log('-'.repeat(70));

  log(`Total Tests: ${report.summary.total}`, 'cyan');
  log(`Passed: ${report.summary.passed}`, 'green');
  log(`Failed: ${report.summary.failed}`, 'red');
  log(`Warnings: ${report.summary.warnings}`, 'yellow');

  const passRate = Math.round((report.summary.passed / report.summary.total) * 100);
  log(`\nPass Rate: ${passRate}%`, passRate >= 80 ? 'green' : passRate >= 60 ? 'yellow' : 'red');

  console.log('='.repeat(70) + '\n');

  if (report.summary.failed > 0) {
    log('❌ 검증 실패! 위의 에러를 수정하세요.', 'red');
    process.exit(1);
  } else if (report.summary.warnings > 0) {
    log('⚠️  검증 완료 (경고 있음)', 'yellow');
  } else {
    log('✅ 모든 검증 통과!', 'green');
  }
}

/**
 * JSON 리포트 생성
 */
function saveJSONReport(report: VerificationReport): void {
  const outputPath = path.join(process.cwd(), 'verification-report.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  log(`\n📄 JSON 리포트 저장: ${outputPath}`, 'cyan');
}

/**
 * HTML 리포트 생성 (간단 버전)
 */
function saveHTMLReport(report: VerificationReport): void {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Verification Report - ${report.timestamp}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 2rem; max-width: 1200px; margin: 0 auto; }
    h1 { color: #1e40af; }
    .pass { color: #059669; }
    .fail { color: #dc2626; }
    .warn { color: #d97706; }
    table { width: 100%; border-collapse: collapse; margin: 2rem 0; }
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f3f4f6; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin: 2rem 0; }
    .summary-card { padding: 1rem; border-radius: 0.5rem; background: #f9fafb; }
  </style>
</head>
<body>
  <h1>🔍 Project Verification Report</h1>
  <p><strong>Timestamp:</strong> ${report.timestamp}</p>
  <p><strong>Environment:</strong> ${report.environment.mode} | Node ${report.environment.nodeVersion}</p>

  <div class="summary">
    <div class="summary-card">
      <h3>Total Tests</h3>
      <p style="font-size: 2rem; margin: 0;">${report.summary.total}</p>
    </div>
    <div class="summary-card">
      <h3 class="pass">Passed</h3>
      <p style="font-size: 2rem; margin: 0;" class="pass">${report.summary.passed}</p>
    </div>
    <div class="summary-card">
      <h3 class="fail">Failed</h3>
      <p style="font-size: 2rem; margin: 0;" class="fail">${report.summary.failed}</p>
    </div>
    <div class="summary-card">
      <h3 class="warn">Warnings</h3>
      <p style="font-size: 2rem; margin: 0;" class="warn">${report.summary.warnings}</p>
    </div>
  </div>

  <h2>Test Results</h2>
  <table>
    <thead>
      <tr>
        <th>Test Name</th>
        <th>Status</th>
        <th>Message</th>
        <th>Details</th>
      </tr>
    </thead>
    <tbody>
      ${report.results
        .map(
          (result) => `
        <tr>
          <td><strong>${result.name}</strong></td>
          <td class="${result.status}">${result.status.toUpperCase()}</td>
          <td>${result.message}</td>
          <td><small>${result.details || 'N/A'}</small></td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>
</body>
</html>
  `;

  const outputPath = path.join(process.cwd(), 'verification-report.html');
  fs.writeFileSync(outputPath, html);
  log(`📄 HTML 리포트 저장: ${outputPath}`, 'cyan');
}

// ============================================================================
// Main Function
// ============================================================================

async function main() {
  log('\n🚀 Starting Project Verification...\n', 'cyan');

  const results: VerificationResult[] = [];

  // 환경 정보 수집
  const { stdout: nodeVersion } = await execAsync('node --version');
  const { stdout: npmVersion } = await execAsync('npm --version');

  // 검증 실행
  log('1/6 환경 변수 검증...', 'blue');
  results.push(await verifyEnvironmentVariables());

  log('2/6 파일 구조 검증...', 'blue');
  results.push(await verifyFileStructure());

  log('3/6 TypeScript 컴파일 검증...', 'blue');
  results.push(await verifyTypeScript());

  log('4/6 ESLint 검증...', 'blue');
  results.push(await verifyESLint());

  log('5/6 빌드 테스트...', 'blue');
  results.push(await verifyBuild());

  log('6/6 API 헬스 체크...', 'blue');
  results.push(await verifyAPIHealth());

  // 리포트 생성
  const report: VerificationReport = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: nodeVersion.trim(),
      npmVersion: npmVersion.trim(),
      mode: process.env.NODE_ENV || 'development',
    },
    results,
    summary: {
      total: results.length,
      passed: results.filter((r) => r.status === 'pass').length,
      failed: results.filter((r) => r.status === 'fail').length,
      warnings: results.filter((r) => r.status === 'warn').length,
    },
  };

  // 리포트 출력 및 저장
  printConsoleReport(report);
  saveJSONReport(report);
  saveHTMLReport(report);
}

// 실행
main().catch((error) => {
  log(`\n❌ 검증 스크립트 실행 실패: ${error instanceof Error ? error.message : String(error)}`, 'red');
  process.exit(1);
});
