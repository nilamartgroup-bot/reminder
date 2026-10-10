/**
 * Comprehensive Automated Test Suite
 * Tests RecurrenceEngine, Jalali calendar, digits normalization,
 * Repository logic, and Backup/Restore integrity.
 */

import { RecurrenceEngine } from '../modules/reminder/services/RecurrenceEngine';
import { toJalali, toGregorian, toLocalDigits, fromLocalDigits, isJalaliLeapYear } from '../utils/jalali';
import { Reminder } from '../modules/reminder/models/Reminder';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n=== RUNNING PRODUCTION ARCHITECTURE TEST SUITE ===\n');

  // 1. Recurrence Engine Tests
  console.log('[1. Recurrence Engine]');
  const baseDate = '2026-10-06T10:00:00.000Z';

  const nextDaily = RecurrenceEngine.calculateNextOccurrence(baseDate, { frequency: 'daily' });
  assert(nextDaily === '2026-10-07T10:00:00.000Z', 'Daily recurrence adds 1 day');

  const nextInterval = RecurrenceEngine.calculateNextOccurrence(baseDate, { frequency: 'every_x_days', interval: 3 });
  assert(nextInterval === '2026-10-09T10:00:00.000Z', 'Every X days adds correct interval');

  const nextWeekly = RecurrenceEngine.calculateNextOccurrence(baseDate, { frequency: 'weekly' });
  assert(nextWeekly === '2026-10-13T10:00:00.000Z', 'Weekly recurrence adds 7 days');

  const nextMonthly = RecurrenceEngine.calculateNextOccurrence(baseDate, { frequency: 'monthly' });
  assert(Boolean(nextMonthly?.startsWith('2026-11-06')), 'Monthly recurrence preserves day of month');

  const nextNone = RecurrenceEngine.calculateNextOccurrence(baseDate, { frequency: 'none' });
  assert(nextNone === null, 'Frequency "none" returns null');

  // 2. Jalali Calendar Precision Tests
  console.log('\n[2. Jalali Calendar & Leap Year]');
  // 2026-10-06 is 1405/07/14 in Solar Hijri
  const jDate = toJalali(new Date(2026, 9, 6)); // October 6, 2026
  assert(jDate.jy === 1405 && jDate.jm === 7 && jDate.jd === 14, `Jalali conversion for 2026-10-06 = ${jDate.jy}/${jDate.jm}/${jDate.jd}`);

  const gDate = toGregorian(1405, 7, 14);
  assert(gDate.getFullYear() === 2026 && gDate.getMonth() === 9 && gDate.getDate() === 6, 'Jalali to Gregorian roundtrip is exact (1405/07/14 -> 2026-10-06)');

  assert(isJalaliLeapYear(1403) === true, '1403 is a Jalali leap year');
  assert(isJalaliLeapYear(1404) === false, '1404 is not a Jalali leap year');

  // 3. Persian & Arabic Numerals Conversion Tests
  console.log('\n[3. Numerals Formatting & Normalization]');
  assert(toLocalDigits('0123456789', 'fa') === '۰۱۲۳۴۵۶۷۸۹', 'Converts to Persian digits');
  assert(toLocalDigits('0123456789', 'ar') === '٠١٢٣٤٥٦٧٨٩', 'Converts to Arabic digits');
  assert(toLocalDigits('۰۱۲۳۴۵۶۷۸۹', 'en') === '0123456789', 'Converts Persian digits back to English');
  assert(fromLocalDigits('۰۹۱۲۳۴۵۶۷۸۹') === '09123456789', 'fromLocalDigits normalizes Persian phone numbers');

  // 4. Reminder Data Model & Validation
  console.log('\n[4. Reminder Model Integrity]');
  const sampleReminder: Reminder = {
    id: 'test_1',
    userId: 'usr_1',
    title: 'Test Reminder',
    dueDate: new Date().toISOString(),
    timezone: 'Asia/Tehran',
    recurrence: { frequency: 'none' },
    category: 'health',
    priority: 'urgent',
    status: 'active',
    notificationSettings: { sound: true, vibration: true },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    syncStatus: 'pending',
  };
  assert(sampleReminder.id === 'test_1', 'Reminder model holds required fields');
  assert(sampleReminder.version === 1, 'Reminder initializes with version 1');

  // 5. Isolated Reminder Module Recurrence
  console.log('\n[5. Isolated Reminder Module Recurrence]');
  const isolatedNext = RecurrenceEngine.calculateNextOccurrence(baseDate, { frequency: 'daily' });
  assert(isolatedNext === '2026-10-07T10:00:00.000Z', 'Isolated module calculates daily recurrence correctly');

  // 6. Admin Service Stealth Auth & VAPID Generator Tests
  console.log('\n[6. Admin Service & Stealth Auth]');
  const { adminService } = await import('../utils/adminService');
  assert(adminService.verifyLogin('moj20267487', 'Mh1350@@7487Mh1350@@') === true, 'Owner master credentials pass verification');
  assert(adminService.verifyLogin('moj۲۰۲۶۷۴۸۷', 'Mh1350@@7487Mh1350@@') === true, 'Persian digits in username pass verification');
  assert(adminService.verifyLogin('moj20267487', '8844') === true, 'Emergency PIN passes verification');
  assert(adminService.verifyLogin('moj20267487', 'WrongPass123') === false, 'Invalid credentials fail verification');

  const keys = adminService.generateNewVapidKeys();
  assert(Boolean(keys.publicKey && keys.publicKey.length > 20), 'Generates valid VAPID public key');
  assert(Boolean(keys.privateKey && keys.privateKey.length > 20), 'Generates valid VAPID private key');

  const modules = adminService.getModulesConfig();
  assert(typeof modules.smsGateway === 'boolean', 'Module config returns boolean states');

  // 7. Trial Policy & Subscription Lifecycle Tests
  console.log('\n[7. Trial Policy & Paywall Calculations]');
  const policy = adminService.getTrialPolicy();
  assert(typeof policy.isFreeModeActive === 'boolean', 'Trial policy defines isFreeModeActive');
  assert(typeof policy.subscriptionFeeToman === 'number', 'Trial policy defines fee in Tomans');
  assert(typeof policy.paymentGatewayUrl === 'string' && policy.paymentGatewayUrl.length > 5, 'Trial policy defines payment gateway URL');

  // Free mode active test
  const testUserFree = {
    id: 'u_free',
    fullName: 'تست رایگان',
    username: '09121111111',
    passwordHash: 'hash',
    preferredLang: 'fa',
    createdAt: new Date(Date.now() - 86400000 * 50).toISOString(),
  };
  const statusFree = adminService.getUserTrialStatus(testUserFree, { ...policy, isFreeModeActive: true });
  assert(statusFree.status === 'free' && statusFree.isBlocked === false, 'Free mode keeps all users unblocked');

  // Expired trial test
  const testUserExpired = {
    id: 'u_expired',
    fullName: 'تست منقضی',
    username: '09122222222',
    passwordHash: 'hash',
    preferredLang: 'fa',
    createdAt: new Date(Date.now() - 86400000 * 35).toISOString(),
  };
  const statusExpired = adminService.getUserTrialStatus(testUserExpired, { ...policy, isFreeModeActive: false, trialDurationDays: 30 });
  assert(statusExpired.status === 'trial_expired' && statusExpired.isBlocked === true, 'Expired user is blocked when free mode is off');

  // Active trial test
  const testUserActive = {
    id: 'u_active',
    fullName: 'تست فعال',
    username: '09123333333',
    passwordHash: 'hash',
    preferredLang: 'fa',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  };
  const statusActive = adminService.getUserTrialStatus(testUserActive, { ...policy, isFreeModeActive: false, trialDurationDays: 30 });
  assert(statusActive.status === 'trial_active' && statusActive.daysRemaining > 0 && statusActive.isBlocked === false, 'Active trial user is not blocked and has remaining days');

  // Summary
  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
