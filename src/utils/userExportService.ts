import * as XLSX from 'xlsx';
import { RegisteredUserData, TrialPolicyConfig, adminService } from './adminService';
import { formatAppDate } from './jalali';

export const userExportService = {
  /**
   * Export registered users to real Microsoft Excel (.xlsx) format
   * Fully right-to-left (RTL) with Persian headers and structured columns matching the single-row layout
   */
  exportToXlsx(users: RegisteredUserData[], policy: TrialPolicyConfig, isFa = true) {
    // 1. Prepare table data with exact Persian headers
    const headers = [
      'ردیف',
      'نام و نام خانوادگی',
      'شماره همراه (نام کاربری)',
      'رمز عبور ثبت‌نامی',
      'تاریخ و زمان ثبت‌نام (شمسی)',
      'وضعیت دوره آزمایشی / اشتراک',
      'دستگاه و پلتفرم',
      'وضعیت حساب',
      'شناسه کاربری یکتا',
      'آخرین فعالیت',
    ];

    const rows = users.map((u, index) => {
      const trialInfo = adminService.getUserTrialStatus(u, policy);
      const regDate = formatAppDate(u.createdAt, 'fa', true);
      const lastLogin = u.lastLoginAt ? formatAppDate(u.lastLoginAt, 'fa', true) : 'همزمان با ثبت‌نام';
      const statusText = u.status === 'suspended' ? 'معلق (مسدود)' : 'فعال';

      return [
        (index + 1).toString(),
        u.fullName,
        u.username,
        u.rawPassword || '[محفوظ]',
        regDate,
        trialInfo.label,
        u.deviceInfo || 'کلاینت موبایل (PWA)',
        statusText,
        u.id,
        lastLogin,
      ];
    });

    const worksheetData = [
      headers,
      ...rows,
      [], // blank line
      [
        'گزارش سیستمی یادآور پرو',
        `وضعیت جاری دوره آزمایشی: ${policy.isFreeModeActive ? 'رایگان عمومی (همگانی)' : `${policy.trialDurationDays} روزه`}`,
        `مبلغ تمدید: ${policy.subscriptionFeeToman.toLocaleString()} تومان`,
        `درگاه: ${policy.paymentGatewayUrl}`,
        `تاریخ تهیه: ${formatAppDate(new Date(), 'fa', true)}`,
      ],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set Sheet to Right-To-Left (راست چین) for Persian
    worksheet['!views'] = [{ rightToLeft: true }];

    // Set Column Widths for clean reading
    worksheet['!cols'] = [
      { wch: 8 },  // ردیف
      { wch: 22 }, // نام و نام خانوادگی
      { wch: 18 }, // شماره همراه
      { wch: 18 }, // رمز عبور
      { wch: 26 }, // تاریخ ثبت‌نام
      { wch: 24 }, // وضعیت اشتراک
      { wch: 22 }, // دستگاه
      { wch: 14 }, // وضعیت
      { wch: 22 }, // شناسه
      { wch: 24 }, // آخرین ورود
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'کاربران ثبت‌نامی');

    const fileName = `گزارش_کاربران_یادآور_پرو_${Date.now()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  },

  /**
   * Export registered users to professional Printable PDF with Persian RTL layout
   */
  exportToPdf(users: RegisteredUserData[], policy: TrialPolicyConfig, isFa = true) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('لطفاً اجازه باز شدن پنجره پاپ‌آپ (Pop-up) را در مرورگر فعال کنید.');
      return;
    }

    const reportDate = formatAppDate(new Date(), 'fa', true);
    const policyDesc = policy.isFreeModeActive
      ? 'رایگان سراسری (بدون محدودیت زمانی)'
      : `دوره آزمایشی ${policy.trialDurationDays} روزه - مبلغ تمدید: ${policy.subscriptionFeeToman.toLocaleString('fa-IR')} تومان`;

    const rowsHtml = users
      .map((u, i) => {
        const trialInfo = adminService.getUserTrialStatus(u, policy);
        const regDate = formatAppDate(u.createdAt, 'fa', true);
        const trialBadgeColor =
          trialInfo.status === 'free'
            ? '#059669'
            : trialInfo.status === 'trial_expired'
            ? '#dc2626'
            : trialInfo.status === 'subscribed'
            ? '#2563eb'
            : '#d97706';

        return `
          <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
            <td style="padding: 8px 6px; text-align: center; font-weight: bold; color: #64748b;">${i + 1}</td>
            <td style="padding: 8px 6px; font-weight: bold; color: #0f172a;">${u.fullName}</td>
            <td style="padding: 8px 6px; font-family: monospace; direction: ltr; text-align: center; font-weight: 600; color: #1e293b;">${u.username}</td>
            <td style="padding: 8px 6px; font-family: monospace; direction: ltr; text-align: center; color: #b45309; font-weight: bold;">${u.rawPassword || '••••••••'}</td>
            <td style="padding: 8px 6px; text-align: center; color: #334155;">${regDate}</td>
            <td style="padding: 8px 6px; text-align: center;">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; color: white; background-color: ${trialBadgeColor};">
                ${trialInfo.label}
              </span>
            </td>
            <td style="padding: 8px 6px; text-align: center; color: #475569;">${u.deviceInfo || 'موبایل PWA'}</td>
            <td style="padding: 8px 6px; text-align: center; font-weight: 600; color: ${u.status === 'suspended' ? '#dc2626' : '#16a34a'};">
              ${u.status === 'suspended' ? 'معلق' : 'فعال'}
            </td>
            <td style="padding: 8px 6px; font-family: monospace; font-size: 10px; direction: ltr; text-align: center; color: #64748b;">${u.id}</td>
          </tr>
        `;
      })
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <title>گزارش رسمی کاربران سامانه یادآور پرو</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 12mm 10mm;
          }
          body {
            font-family: system-ui, -apple-system, 'Vazirmatn', Tahoma, sans-serif;
            margin: 0;
            padding: 20px;
            color: #0f172a;
            direction: rtl;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .title {
            font-size: 18px;
            font-weight: 900;
            color: #1e3a8a;
            margin: 0;
          }
          .subtitle {
            font-size: 11px;
            color: #64748b;
            margin-top: 4px;
          }
          .meta {
            text-align: left;
            font-size: 11px;
            color: #334155;
            line-height: 1.6;
          }
          .info-banner {
            background-color: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 8px 14px;
            margin-bottom: 16px;
            font-size: 11px;
            display: flex;
            justify-content: space-between;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
          }
          th {
            background-color: #1e293b;
            color: #ffffff;
            padding: 9px 6px;
            font-size: 11px;
            font-weight: bold;
            text-align: center;
            border: 1px solid #1e293b;
          }
          td {
            border: 1px solid #e2e8f0;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .footer {
            margin-top: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
          }
          .sign-box {
            text-align: center;
            font-weight: bold;
            color: #1e3a8a;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 14px; display: flex; gap: 10px;">
          <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 8px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; font-family: inherit;">
            🖨️ چاپ / ذخیره فایل PDF
          </button>
          <button onclick="window.close()" style="background: #e2e8f0; color: #334155; border: none; padding: 8px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; font-family: inherit;">
            بستن پنجره
          </button>
        </div>

        <div class="header">
          <div>
            <h1 class="title">📋 گزارش رسمی اطلاعات کاربران و حساب‌های ثبت‌نامی</h1>
            <div class="subtitle">سامانه هوشمند مدیریت یادآور پرو (نسخه تجاری و نظارتی)</div>
          </div>
          <div class="meta">
            <div>تاریخ تنظیم: <b>${reportDate}</b></div>
            <div>تعداد کل کاربران: <b>${users.length} نفر</b></div>
          </div>
        </div>

        <div class="info-banner">
          <div><b>وضعیت سیاست دوره آزمایشی:</b> ${policyDesc}</div>
          <div><b>درگاه پرداخت متصل:</b> ${policy.paymentGatewayUrl.includes('shaparak') ? 'شاپرک (BPM Mellat)' : policy.gatewayProvider}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 4%;">#</th>
              <th style="width: 15%;">نام و نام خانوادگی</th>
              <th style="width: 12%;">شماره همراه (کاربری)</th>
              <th style="width: 12%;">کلمه عبور ثبت‌نامی</th>
              <th style="width: 15%;">تاریخ و ساعت ثبت‌نام</th>
              <th style="width: 14%;">وضعیت دوره آزمایشی</th>
              <th style="width: 11%;">دستگاه</th>
              <th style="width: 7%;">وضعیت</th>
              <th style="width: 10%;">شناسه کاربر</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <div>سامانه تولید خودکار اسناد نظارتی یادآور پرو • کلیه حقوق محفوظ است.</div>
          <div class="sign-box">
            <div>تاییدیه مدیریت ارشد سیستم</div>
            <div style="margin-top: 6px; color: #059669;">✓ احراز هویت شده (Super Master)</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 600);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  },
};
