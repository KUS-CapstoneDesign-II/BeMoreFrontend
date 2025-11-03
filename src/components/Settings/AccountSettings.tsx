import { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { useToast } from '../../contexts/ToastContext';

interface FormErrors {
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export function AccountSettings() {
  const { t } = useI18n();
  const { addToast } = useToast();

  // 이메일 변경 상태
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  // 비밀번호 변경 상태
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  // 계정 삭제 상태
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 에러 상태
  const [errors, setErrors] = useState<FormErrors>({});

  // 비밀번호 강도 계산
  const calculatePasswordStrength = (password: string) => {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);
    const isLongEnough = password.length >= 8;

    const score = [hasUppercase, hasLowercase, hasNumbers, hasSpecial, isLongEnough].filter(Boolean).length;

    if (score >= 4) return 'strong';
    if (score >= 2) return 'medium';
    return 'weak';
  };

  // 이메일 인증 코드 발송
  const handleSendEmailVerification = async () => {
    setErrors({});

    if (!newEmail) {
      setErrors({ email: t('validation.required') || '필수 입력 항목입니다' });
      return;
    }

    if (!newEmail.includes('@')) {
      setErrors({ email: t('validation.invalidEmail') || '유효한 이메일을 입력하세요' });
      return;
    }

    setEmailLoading(true);
    try {
      // TODO: API 호출 - 이메일 인증 코드 발송
      console.log('Sending verification code to:', newEmail);
      setIsVerificationSent(true);
      addToast(t('settings.account.verificationSent') || '인증 코드가 이메일로 발송되었습니다', 'success');
    } catch {
      addToast(t('settings.account.verificationFailed') || '인증 코드 발송 실패', 'error');
    } finally {
      setEmailLoading(false);
    }
  };

  // 이메일 변경 확인
  const handleConfirmEmailChange = async () => {
    setErrors({});

    if (!emailVerificationCode) {
      setErrors({ email: t('validation.required') || '인증 코드를 입력하세요' });
      return;
    }

    setEmailLoading(true);
    try {
      // TODO: API 호출 - 이메일 변경
      console.log('Changing email to:', newEmail, 'with code:', emailVerificationCode);
      addToast(t('settings.account.emailChanged') || '이메일이 변경되었습니다', 'success');
      setShowEmailForm(false);
      setNewEmail('');
      setEmailVerificationCode('');
      setIsVerificationSent(false);
    } catch {
      addToast(t('settings.account.emailChangeFailed') || '이메일 변경 실패', 'error');
    } finally {
      setEmailLoading(false);
    }
  };

  // 비밀번호 변경
  const handleChangePassword = async () => {
    setErrors({});

    if (!currentPassword) {
      setErrors({ currentPassword: t('validation.required') || '현재 비밀번호를 입력하세요' });
      return;
    }

    if (!newPassword) {
      setErrors({ newPassword: t('validation.required') || '새 비밀번호를 입력하세요' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: t('validation.passwordMismatch') || '비밀번호가 일치하지 않습니다' });
      return;
    }

    if (passwordStrength === 'weak') {
      setErrors({ newPassword: t('validation.weakPassword') || '더 강력한 비밀번호를 설정하세요' });
      return;
    }

    setPasswordLoading(true);
    try {
      // TODO: API 호출 - 비밀번호 변경
      console.log('Changing password');
      addToast(t('settings.account.passwordChanged') || '비밀번호가 변경되었습니다', 'success');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      addToast(t('settings.account.passwordChangeFailed') || '비밀번호 변경 실패', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  // 계정 삭제
  const handleDeleteAccount = async () => {
    setErrors({});

    if (!deleteConfirmPassword) {
      setErrors({ currentPassword: t('validation.required') || '비밀번호를 입력하세요' });
      return;
    }

    setDeleteLoading(true);
    try {
      // TODO: API 호출 - 계정 삭제
      console.log('Deleting account with password confirmation');
      addToast(t('settings.account.deleteScheduled') || '계정이 30일 후 삭제 예정입니다', 'success');
      setShowDeleteConfirm(false);
      setDeleteConfirmPassword('');
    } catch {
      addToast(t('settings.account.deleteFailed') || '계정 삭제 실패', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 이메일 변경 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('settings.account.email') || '이메일 주소'}
        </h3>
        {!showEmailForm ? (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('settings.account.currentEmail') || '현재 이메일'}: user@example.com
            </p>
            <button
              onClick={() => setShowEmailForm(true)}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
            >
              {t('settings.account.changeEmail') || '이메일 변경'}
            </button>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.account.newEmail') || '새 이메일'}
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={isVerificationSent}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="new@example.com"
              />
              {errors.email && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.email}</p>}
            </div>

            {isVerificationSent && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('settings.account.verificationCode') || '인증 코드'}
                </label>
                <input
                  type="text"
                  value={emailVerificationCode}
                  onChange={(e) => setEmailVerificationCode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="000000"
                />
              </div>
            )}

            <div className="flex gap-2">
              {!isVerificationSent ? (
                <button
                  onClick={handleSendEmailVerification}
                  disabled={emailLoading}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                >
                  {emailLoading ? t('common.sending') || '발송 중...' : t('settings.account.sendCode') || '인증 코드 발송'}
                </button>
              ) : (
                <button
                  onClick={handleConfirmEmailChange}
                  disabled={emailLoading}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                >
                  {emailLoading ? t('common.confirming') || '확인 중...' : t('common.confirm') || '확인'}
                </button>
              )}
              <button
                onClick={() => {
                  setShowEmailForm(false);
                  setNewEmail('');
                  setEmailVerificationCode('');
                  setIsVerificationSent(false);
                  setErrors({});
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
              >
                {t('common.cancel') || '취소'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 비밀번호 변경 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('settings.account.password') || '비밀번호'}
        </h3>
        {!showPasswordForm ? (
          <button
            onClick={() => setShowPasswordForm(true)}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
          >
            {t('settings.account.changePassword') || '비밀번호 변경'}
          </button>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.account.currentPassword') || '현재 비밀번호'}
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.currentPassword && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.currentPassword}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.account.newPassword') || '새 비밀번호'}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordStrength(calculatePasswordStrength(e.target.value));
                }}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {newPassword && (
                <div className="mt-2">
                  <div className="flex gap-2">
                    <div className={`flex-1 h-2 rounded ${passwordStrength === 'weak' ? 'bg-red-500' : passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {passwordStrength === 'weak' && t('settings.account.weakPassword') || '약함'}
                    {passwordStrength === 'medium' && t('settings.account.mediumPassword') || '중간'}
                    {passwordStrength === 'strong' && t('settings.account.strongPassword') || '강함'}
                  </p>
                </div>
              )}
              {errors.newPassword && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.newPassword}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.account.confirmPassword') || '비밀번호 확인'}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.confirmPassword && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.confirmPassword}</p>}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                {passwordLoading ? t('common.saving') || '저장 중...' : t('common.save') || '저장'}
              </button>
              <button
                onClick={() => {
                  setShowPasswordForm(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setErrors({});
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
              >
                {t('common.cancel') || '취소'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 계정 삭제 */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-4">
          {t('settings.account.dangerZone') || '위험 영역'}
        </h3>
        {!showDeleteConfirm ? (
          <div className="space-y-4">
            <p className="text-sm text-red-800 dark:text-red-300">
              {t('settings.account.deleteWarning') || '계정을 삭제하면 모든 데이터가 30일 후 영구 삭제됩니다. 이 작업은 되돌릴 수 없습니다.'}
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              {t('settings.account.deleteAccount') || '계정 삭제'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-red-900 dark:text-red-200 mb-2">
                {t('settings.account.confirmPassword') || '비밀번호 확인'}
              </label>
              <input
                type="password"
                value={deleteConfirmPassword}
                onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-red-300 dark:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {errors.currentPassword && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.currentPassword}</p>}
            </div>

            <p className="text-xs text-red-800 dark:text-red-300">
              {t('settings.account.deleteConfirmWarning') || '계정 삭제 후 30일의 복구 기간이 제공됩니다. 이 기간 동안 계정을 복구할 수 있습니다.'}
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                {deleteLoading ? t('common.deleting') || '삭제 중...' : t('settings.account.confirmDelete') || '삭제 확인'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmPassword('');
                  setErrors({});
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
              >
                {t('common.cancel') || '취소'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
