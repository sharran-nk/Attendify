import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Subject, AttendanceEntry } from '@/types/attendance';

export interface ReportData {
  userName: string;
  userEmail: string;
  subjects: Subject[];
  attendance: AttendanceEntry[];
  dateRange: {
    type: 'all' | 'week' | 'month' | 'custom';
    start?: Date;
    end?: Date;
  };
  selectedSubjectId: string; // 'all' or subjectId
  warningThreshold: number;
}

export function generateCSV(data: ReportData): string {
  const filteredAttendance = getFilteredAttendance(data);

  // Headers
  const csvRows = ['Date,Day,Time,Subject,Status'];

  filteredAttendance.forEach((entry) => {
    const subject = data.subjects.find((s) => s.id === entry.subjectId);
    const subjectName = subject ? subject.name : 'Unknown';
    const dateObj = parseISO(entry.date);
    const dateStr = format(dateObj, 'dd-MM-yyyy');
    const dayName = format(dateObj, 'EEEE');
    const timeStr = entry.time || '—';

    let statusStr = 'Present';
    if (entry.status === 'absent') statusStr = 'Absent';
    if (entry.status === 'cancelled') statusStr = 'Cancelled';

    // Escape commas
    const escapedSubjectName = subjectName.includes(',') ? `"${subjectName}"` : subjectName;

    csvRows.push(`${dateStr},${dayName},${timeStr},${escapedSubjectName},${statusStr}`);
  });

  return csvRows.join('\n');
}

export function downloadCSV(csvContent: string, fileName: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// -------------------------------------------------------------
// PDF Generator: Clean, Minimal, Modern Academic Report
// -------------------------------------------------------------
export function generatePDF(data: ReportData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Curated Color Palette
  const colors = {
    primary: [37, 99, 235] as [number, number, number],        // #2563EB Clean Attendify Indigo-Blue
    primarySoft: [239, 246, 255] as [number, number, number],   // #EFF6FF
    darkText: [24, 24, 27] as [number, number, number],         // #18181B Dark Charcoal
    bodyText: [63, 63, 70] as [number, number, number],         // #3F3F46 Medium Charcoal
    mutedText: [113, 113, 122] as [number, number, number],     // #71717A Slate Gray
    border: [228, 228, 231] as [number, number, number],        // #E4E4E7 Light Border
    cardBg: [250, 250, 250] as [number, number, number],        // #FAFAFA Soft Neutral Card
    headerBg: [244, 244, 245] as [number, number, number],      // #F4F4F5 Clean Table Header
    emerald: [16, 185, 129] as [number, number, number],        // #10B981 Present
    rose: [239, 68, 68] as [number, number, number],            // #EF4444 Absent
    amber: [217, 119, 6] as [number, number, number],           // #D97706 Warning
    slateMuted: [148, 163, 184] as [number, number, number],    // #94A3B8 Cancelled / Neutral
  };

  const filteredAttendance = getFilteredAttendance(data);
  const dateRangeStr = getDateRangeString(data);
  const stats = calculateOverallStats(filteredAttendance, data.subjects, data.selectedSubjectId);

  let currentY = margin;

  // Shared Helper: check page breaks for custom canvas drawings
  const ensureSpace = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 16) {
      doc.addPage();
      currentY = margin + 7;
    }
  };

  // ===========================================================
  // 1. REPORT HEADER (Attendify Wordmark, Title, Student Info)
  // ===========================================================
  // Wordmark pill
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(margin, currentY, 20, 6.5, 1.5, 1.5, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('ATTENDIFY', margin + 10, currentY + 4.3, { align: 'center' });

  // Right-aligned report metadata block
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(colors.darkText[0], colors.darkText[1], colors.darkText[2]);
  doc.text(data.userName || 'Student', pageWidth - margin, currentY + 3, { align: 'right' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(colors.mutedText[0], colors.mutedText[1], colors.mutedText[2]);
  doc.text(data.userEmail || 'N/A', pageWidth - margin, currentY + 7, { align: 'right' });
  doc.text(`Generated: ${format(new Date(), 'dd MMMM yyyy, hh:mm a')}`, pageWidth - margin, currentY + 11, { align: 'right' });

  // Main Report Title
  currentY += 10;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(colors.darkText[0], colors.darkText[1], colors.darkText[2]);
  doc.text('Attendance Performance Report', margin, currentY);

  // Period subtitle
  currentY += 5.5;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(colors.mutedText[0], colors.mutedText[1], colors.mutedText[2]);
  let subHeaderInfo = `Reporting Period: ${dateRangeStr}`;
  if (data.selectedSubjectId !== 'all') {
    const subObj = data.subjects.find((s) => s.id === data.selectedSubjectId);
    if (subObj) subHeaderInfo += `  |  Filtered Subject: ${subObj.name}`;
  }
  doc.text(subHeaderInfo, margin, currentY);

  // Subtle separator line
  currentY += 4.5;
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, currentY, margin + contentWidth, currentY);
  currentY += 6;

  // ===========================================================
  // 2. OVERALL ATTENDANCE SUMMARY (4 Compact Metric Cards)
  // ===========================================================
  const cardWidth = (contentWidth - 9) / 4; // 3 gaps of 3mm
  const cardHeight = 17;
  const cards = [
    {
      label: 'TOTAL CLASSES',
      val: stats.total.toString(),
      sub: stats.cancelled > 0 ? `${stats.cancelled} cancelled excluded` : 'Recorded in period',
      valColor: colors.darkText,
    },
    {
      label: 'CLASSES ATTENDED',
      val: stats.present.toString(),
      sub: 'Marked present',
      valColor: colors.emerald,
    },
    {
      label: 'CLASSES MISSED',
      val: stats.absent.toString(),
      sub: 'Marked absent',
      valColor: colors.rose,
    },
    {
      label: 'OVERALL ATTENDANCE',
      val: `${stats.overallPct.toFixed(1)}%`,
      sub: stats.overallPct >= data.warningThreshold ? 'Above threshold' : `Below ${data.warningThreshold}% goal`,
      valColor: stats.overallPct >= data.warningThreshold ? colors.emerald : colors.rose,
    },
  ];

  cards.forEach((c, idx) => {
    const cardX = margin + idx * (cardWidth + 3);

    // Background & subtle border
    doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.setLineWidth(0.2);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    // Label
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(colors.mutedText[0], colors.mutedText[1], colors.mutedText[2]);
    doc.text(c.label, cardX + 3.5, currentY + 4.5);

    // Value
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(c.valColor[0], c.valColor[1], c.valColor[2]);
    doc.text(c.val, cardX + 3.5, currentY + 11.2);

    // Subtext
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(colors.mutedText[0], colors.mutedText[1], colors.mutedText[2]);
    doc.text(c.sub, cardX + 3.5, currentY + 14.8);
  });

  currentY += cardHeight + 4;

  // ===========================================================
  // 3. OVERALL ATTENDANCE INSIGHTS STRIP
  // ===========================================================
  if (data.selectedSubjectId === 'all' && data.subjects.length > 0 && stats.total > 0) {
    const stripHeight = 10;
    doc.setFillColor(colors.primarySoft[0], colors.primarySoft[1], colors.primarySoft[2]);
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, currentY, contentWidth, stripHeight, 1.5, 1.5, 'FD');

    // Left primary accent bar
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.roundedRect(margin, currentY, 1.5, stripHeight, 0.7, 0.7, 'F');

    // Insights content
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text('Key Observations:', margin + 4, currentY + 4.2);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(colors.bodyText[0], colors.bodyText[1], colors.bodyText[2]);

    const insightText = `Highest Attendance: ${stats.highestName} (${stats.highestVal.toFixed(1)}%)   |   Lowest Attendance: ${stats.lowestName} (${stats.lowestVal.toFixed(1)}%)   |   Target Goal: ${data.warningThreshold}%`;
    doc.text(insightText, margin + 30, currentY + 4.2);

    // Second line note
    const attendanceHealth =
      stats.overallPct >= data.warningThreshold
        ? `Your attendance is currently healthy and meets the required minimum threshold of ${data.warningThreshold}%.`
        : `Attention: Your attendance is ${Math.abs(data.warningThreshold - stats.overallPct).toFixed(1)}% below the institutional minimum threshold.`;

    doc.setFont('Helvetica', stats.overallPct >= data.warningThreshold ? 'normal' : 'bold');
    doc.setTextColor(
      stats.overallPct >= data.warningThreshold ? colors.mutedText[0] : colors.rose[0],
      stats.overallPct >= data.warningThreshold ? colors.mutedText[1] : colors.rose[1],
      stats.overallPct >= data.warningThreshold ? colors.mutedText[2] : colors.rose[2]
    );
    doc.text(attendanceHealth, margin + 4, currentY + 8);

    currentY += stripHeight + 6;
  } else {
    currentY += 2;
  }

  // ===========================================================
  // 4. SUBJECT-WISE ATTENDANCE PERFORMANCE TABLE
  // ===========================================================
  const relevantSubjects =
    data.selectedSubjectId === 'all'
      ? data.subjects
      : data.subjects.filter((s) => s.id === data.selectedSubjectId);

  if (relevantSubjects.length > 0) {
    ensureSpace(22);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(colors.darkText[0], colors.darkText[1], colors.darkText[2]);
    doc.text('Subject-Wise Attendance Performance', margin, currentY);
    currentY += 3.5;

    const subjectRows = relevantSubjects.map((sub) => {
      const subEntries = filteredAttendance.filter((a) => a.subjectId === sub.id);
      const present = subEntries.filter((a) => a.status === 'present').length;
      const absent = subEntries.filter((a) => a.status === 'absent').length;
      const totalEligible = present + absent;
      const pct = totalEligible > 0 ? (present / totalEligible) * 100 : 0;
      const pctDisplay = totalEligible > 0 ? `${pct.toFixed(1)}%` : '—';
      const statusLabel =
        totalEligible === 0
          ? 'No Classes'
          : pct >= data.warningThreshold
          ? 'On Track'
          : 'Low Attendance';

      return [sub.name, totalEligible.toString(), present.toString(), absent.toString(), pctDisplay, statusLabel];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Subject', 'Total Classes', 'Present', 'Absent', 'Attendance %', 'Status']],
      body: subjectRows,
      theme: 'plain',
      styles: {
        font: 'Helvetica',
        fontSize: 8,
        cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
        textColor: [colors.bodyText[0], colors.bodyText[1], colors.bodyText[2]],
        lineColor: [colors.border[0], colors.border[1], colors.border[2]],
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: [colors.headerBg[0], colors.headerBg[1], colors.headerBg[2]],
        textColor: [colors.darkText[0], colors.darkText[1], colors.darkText[2]],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      columnStyles: {
        0: { cellWidth: 'auto', fontStyle: 'bold' },
        1: { cellWidth: 24, halign: 'center' },
        2: { cellWidth: 22, halign: 'center', textColor: [colors.emerald[0], colors.emerald[1], colors.emerald[2]] },
        3: { cellWidth: 22, halign: 'center', textColor: [colors.rose[0], colors.rose[1], colors.rose[2]] },
        4: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
        5: { cellWidth: 28, halign: 'center', fontSize: 7.5 },
      },
      didParseCell: (cellData) => {
        if (cellData.section === 'body') {
          // Status column styling
          if (cellData.column.index === 5) {
            const txt = String(cellData.cell.raw);
            if (txt === 'On Track') {
              cellData.cell.styles.textColor = [colors.emerald[0], colors.emerald[1], colors.emerald[2]];
              cellData.cell.styles.fontStyle = 'bold';
            } else if (txt === 'Low Attendance') {
              cellData.cell.styles.textColor = [colors.rose[0], colors.rose[1], colors.rose[2]];
              cellData.cell.styles.fontStyle = 'bold';
            } else {
              cellData.cell.styles.textColor = [colors.mutedText[0], colors.mutedText[1], colors.mutedText[2]];
            }
          }
          // Highlight percentage in red if below warning threshold
          if (cellData.column.index === 4) {
            const rawVal = String(cellData.cell.raw);
            if (rawVal.endsWith('%')) {
              const num = parseFloat(rawVal);
              if (!isNaN(num) && num < data.warningThreshold) {
                cellData.cell.styles.textColor = [colors.rose[0], colors.rose[1], colors.rose[2]];
              }
            }
          }
        }
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // ===========================================================
  // 5. MANDATORY: COMPLETE DAY-BY-DAY ATTENDANCE ANALYSIS
  // ===========================================================
  ensureSpace(20);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(colors.darkText[0], colors.darkText[1], colors.darkText[2]);
  doc.text('Detailed Day-by-Day Attendance Analysis', margin, currentY);
  currentY += 2;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(colors.mutedText[0], colors.mutedText[1], colors.mutedText[2]);
  doc.text('Chronological record of all registered attendance sessions, daily percentages, and subject breakdowns.', margin, currentY + 3);
  currentY += 7;

  if (filteredAttendance.length === 0) {
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(colors.mutedText[0], colors.mutedText[1], colors.mutedText[2]);
    doc.text('No attendance entries recorded for this period.', margin, currentY);
    currentY += 10;
  } else {
    // Group attendance by date string (YYYY-MM-DD)
    const groupedByDate = groupByDate(filteredAttendance);
    const sortedDateKeys = Object.keys(groupedByDate).sort((a, b) => a.localeCompare(b));

    sortedDateKeys.forEach((dateKey, index) => {
      const dayEntries = groupedByDate[dateKey];
      const parsedDate = parseISO(dateKey);
      const formattedDateTitle = format(parsedDate, 'EEEE, dd MMMM yyyy');

      // Sort day entries by time (earliest to latest)
      dayEntries.sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));

      // Calculate Day Statistics
      const dayPresent = dayEntries.filter((e) => e.status === 'present').length;
      const dayAbsent = dayEntries.filter((e) => e.status === 'absent').length;
      const dayCancelled = dayEntries.filter((e) => e.status === 'cancelled').length;
      const dayEligible = dayPresent + dayAbsent;
      const dayPct = dayEligible > 0 ? (dayPresent / dayEligible) * 100 : 0;
      const dayPctStr = dayEligible > 0 ? `${dayPct.toFixed(1)}%` : '—';

      // Dynamic Daily Insight calculation
      let dailyInsight = '';
      if (dayEligible === 0 && dayCancelled > 0) {
        dailyInsight = `All ${dayCancelled} class${dayCancelled > 1 ? 'es were' : ' was'} cancelled on this date.`;
      } else if (dayAbsent === 0 && dayPresent > 0) {
        dailyInsight = `Full attendance achieved! You attended all ${dayPresent} scheduled class${dayPresent > 1 ? 'es' : ''} today (100%).`;
      } else if (dayPresent === 0 && dayAbsent > 0) {
        dailyInsight = `Missed all ${dayAbsent} scheduled class${dayAbsent > 1 ? 'es' : ''} on this date (0%).`;
      } else {
        dailyInsight = `Attended ${dayPresent} of ${dayEligible} eligible classes (${dayPctStr}). Missed ${dayAbsent} class${dayAbsent > 1 ? 'es' : ''}.`;
      }

      // Check total estimated height for entire day section to keep together if possible
      const hasBreakdown = dayEntries.length > 1;
      const breakdownCount = hasBreakdown ? Array.from(new Set(dayEntries.map((e) => e.subjectId))).length : 0;
      const totalDaySectionHeight = 14 + (dayEntries.length + 1) * 5.2 + (hasBreakdown ? (breakdownCount + 1) * 4.5 + 4 : 0) + 12;

      // If the entire section can fit on a clean page, push to next page if space is low
      if (totalDaySectionHeight <= pageHeight - 35) {
        ensureSpace(totalDaySectionHeight);
      } else {
        ensureSpace(28); // At least guarantee header and initial records stay together
      }

      // Day Container Header Box
      doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.setLineWidth(0.2);
      doc.roundedRect(margin, currentY, contentWidth, 12, 1.5, 1.5, 'FD');

      // Left blue accent indicator
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.roundedRect(margin, currentY, 1.5, 12, 0.7, 0.7, 'F');

      // Date Heading
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(colors.darkText[0], colors.darkText[1], colors.darkText[2]);
      doc.text(formattedDateTitle, margin + 4, currentY + 4.8);

      // Date subtitle badge (index numbering)
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(colors.mutedText[0], colors.mutedText[1], colors.mutedText[2]);
      doc.text(`Recorded Date ${index + 1} of ${sortedDateKeys.length}`, margin + 4, currentY + 9);

      // Right-aligned Mini Stats Summary
      const statBlockX = margin + contentWidth - 4;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      const pctColor = dayEligible === 0 ? colors.mutedText : dayPct >= data.warningThreshold ? colors.emerald : colors.rose;
      doc.setTextColor(pctColor[0], pctColor[1], pctColor[2]);
      doc.text(`Attendance: ${dayPctStr}`, statBlockX, currentY + 4.8, { align: 'right' });

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(colors.bodyText[0], colors.bodyText[1], colors.bodyText[2]);
      doc.text(
        `Total: ${dayEntries.length}   |   Present: ${dayPresent}   |   Absent: ${dayAbsent}${dayCancelled > 0 ? `   |   Cancelled: ${dayCancelled}` : ''}`,
        statBlockX,
        currentY + 9,
        { align: 'right' }
      );

      currentY += 13.5;

      // Table of Individual Class Records for this date
      const classRows = dayEntries.map((entry) => {
        const sub = data.subjects.find((s) => s.id === entry.subjectId);
        const subName = sub ? sub.name : 'Unknown Subject';
        const timeFormatted = entry.time || '—';
        const cleanStatus =
          entry.status === 'present'
            ? 'Present'
            : entry.status === 'absent'
            ? 'Absent'
            : 'Cancelled';

        return [timeFormatted, subName, cleanStatus];
      });

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Time', 'Subject', 'Status']],
        body: classRows,
        theme: 'plain',
        styles: {
          font: 'Helvetica',
          fontSize: 7.5,
          cellPadding: { top: 1.6, bottom: 1.6, left: 2.5, right: 2.5 },
          textColor: [colors.bodyText[0], colors.bodyText[1], colors.bodyText[2]],
          lineColor: [colors.border[0], colors.border[1], colors.border[2]],
          lineWidth: 0.15,
        },
        headStyles: {
          fillColor: [colors.headerBg[0], colors.headerBg[1], colors.headerBg[2]],
          textColor: [colors.darkText[0], colors.darkText[1], colors.darkText[2]],
          fontStyle: 'bold',
          fontSize: 7,
        },
        columnStyles: {
          0: { cellWidth: 32 },
          1: { cellWidth: 'auto', fontStyle: 'bold' },
          2: { cellWidth: 32, fontStyle: 'bold' },
        },
        didParseCell: (cellData) => {
          if (cellData.section === 'body' && cellData.column.index === 2) {
            const statusTxt = String(cellData.cell.raw);
            if (statusTxt === 'Present') {
              cellData.cell.styles.textColor = [colors.emerald[0], colors.emerald[1], colors.emerald[2]];
            } else if (statusTxt === 'Absent') {
              cellData.cell.styles.textColor = [colors.rose[0], colors.rose[1], colors.rose[2]];
            } else {
              cellData.cell.styles.textColor = [colors.slateMuted[0], colors.slateMuted[1], colors.slateMuted[2]];
            }
          }
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 2.5;

      // Subject breakdown for this date (if more than 1 class occurred)
      const daySubjectIds = Array.from(new Set(dayEntries.map((e) => e.subjectId)));
      if (dayEntries.length > 1 && daySubjectIds.length > 0) {
        const breakdownRows = daySubjectIds.map((sId) => {
          const subObj = data.subjects.find((s) => s.id === sId);
          const sName = subObj ? subObj.name : 'Unknown';
          const subEntries = dayEntries.filter((e) => e.subjectId === sId);
          const sPresent = subEntries.filter((e) => e.status === 'present').length;
          const sAbsent = subEntries.filter((e) => e.status === 'absent').length;
          const sTotal = sPresent + sAbsent;
          const sPct = sTotal > 0 ? (sPresent / sTotal) * 100 : 0;
          const sPctStr = sTotal > 0 ? `${sPct.toFixed(1)}%` : '—';

          return [sName, sPresent.toString(), sAbsent.toString(), sPctStr];
        });

        autoTable(doc, {
          startY: currentY,
          margin: { left: margin + 35, right: margin },
          head: [['Subject Breakdown for Day', 'Present', 'Absent', 'Attendance %']],
          body: breakdownRows,
          theme: 'plain',
          styles: {
            font: 'Helvetica',
            fontSize: 7,
            cellPadding: { top: 1.2, bottom: 1.2, left: 2, right: 2 },
            textColor: [colors.bodyText[0], colors.bodyText[1], colors.bodyText[2]],
            lineColor: [colors.border[0], colors.border[1], colors.border[2]],
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: [248, 248, 249],
            textColor: [colors.mutedText[0], colors.mutedText[1], colors.mutedText[2]],
            fontStyle: 'bold',
            fontSize: 6.5,
          },
          columnStyles: {
            0: { cellWidth: 'auto', fontStyle: 'bold' },
            1: { cellWidth: 20, halign: 'center', textColor: [colors.emerald[0], colors.emerald[1], colors.emerald[2]] },
            2: { cellWidth: 20, halign: 'center', textColor: [colors.rose[0], colors.rose[1], colors.rose[2]] },
            3: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
          },
        });

        currentY = (doc as any).lastAutoTable.finalY + 2.5;
      }

      // Daily Insight Line
      ensureSpace(8);
      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.setLineWidth(0.15);
      doc.roundedRect(margin, currentY, contentWidth, 5.5, 1, 1, 'FD');

      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(6.8);
      doc.setTextColor(colors.bodyText[0], colors.bodyText[1], colors.bodyText[2]);
      doc.text(`Daily Analysis: ${dailyInsight}`, margin + 3, currentY + 3.7);

      currentY += 8.5;
    });
  }

  // ===========================================================
  // 6. GLOBAL PAGINATION & RUNNING FOOTERS
  // ===========================================================
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Subtle top running line (on subsequent pages)
    if (i > 1) {
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.setLineWidth(0.2);
      doc.line(margin, 8, margin + contentWidth, 8);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(colors.mutedText[0], colors.mutedText[1], colors.mutedText[2]);
      doc.text('ATTENDIFY — Attendance Performance Report', margin, 6.2);
      doc.text(data.userName || 'Student', margin + contentWidth, 6.2, { align: 'right' });
    }

    // Bottom Running Footer
    const footerY = pageHeight - 7;
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.setLineWidth(0.2);
    doc.line(margin, footerY - 2.5, margin + contentWidth, footerY - 2.5);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(colors.mutedText[0], colors.mutedText[1], colors.mutedText[2]);
    doc.text('Generated by Attendify', margin, footerY);
    doc.text(`Page ${i} of ${totalPages}`, margin + contentWidth, footerY, { align: 'right' });
  }

  return doc;
}

// -------------------------------------------------------------
// Pure Calculation & Data Filtering Helpers
// -------------------------------------------------------------
function getFilteredAttendance(data: ReportData): AttendanceEntry[] {
  let entries = [...data.attendance];

  // Subject filter
  if (data.selectedSubjectId !== 'all') {
    entries = entries.filter((e) => e.subjectId === data.selectedSubjectId);
  }

  // Date filter with full day boundary coverage
  if (data.dateRange.type === 'week') {
    const start = startOfDay(new Date());
    start.setDate(start.getDate() - 7);
    entries = entries.filter((e) => {
      const d = parseISO(e.date);
      return d >= start;
    });
  } else if (data.dateRange.type === 'month') {
    const start = startOfDay(new Date());
    start.setDate(start.getDate() - 30);
    entries = entries.filter((e) => {
      const d = parseISO(e.date);
      return d >= start;
    });
  } else if (data.dateRange.type === 'custom' && data.dateRange.start && data.dateRange.end) {
    const start = startOfDay(data.dateRange.start);
    const end = endOfDay(data.dateRange.end);
    entries = entries.filter((e) => {
      const d = parseISO(e.date);
      return isWithinInterval(d, { start, end });
    });
  }

  // Sort chronologically (oldest to newest)
  return entries.sort((a, b) => a.date.localeCompare(b.date));
}

function getDateRangeString(data: ReportData): string {
  if (data.dateRange.type === 'all') return 'All Time';
  if (data.dateRange.type === 'week') return 'Last 7 Days';
  if (data.dateRange.type === 'month') return 'Last 30 Days';
  if (data.dateRange.type === 'custom' && data.dateRange.start && data.dateRange.end) {
    return `${format(data.dateRange.start, 'dd MMM yyyy')} - ${format(data.dateRange.end, 'dd MMM yyyy')}`;
  }
  return 'All Time';
}

function groupByDate(entries: AttendanceEntry[]): Record<string, AttendanceEntry[]> {
  const groups: Record<string, AttendanceEntry[]> = {};
  entries.forEach((e) => {
    if (!groups[e.date]) {
      groups[e.date] = [];
    }
    groups[e.date].push(e);
  });
  return groups;
}

function calculateOverallStats(
  entries: AttendanceEntry[],
  subjects: Subject[],
  selectedSubjectId: string
) {
  const present = entries.filter((e) => e.status === 'present').length;
  const absent = entries.filter((e) => e.status === 'absent').length;
  const cancelled = entries.filter((e) => e.status === 'cancelled').length;
  const total = present + absent;
  const overallPct = total > 0 ? (present / total) * 100 : 0;

  let highestName = 'N/A';
  let highestVal = 0;
  let lowestName = 'N/A';
  let lowestVal = 100;

  const relevantSubjects =
    selectedSubjectId === 'all'
      ? subjects
      : subjects.filter((s) => s.id === selectedSubjectId);

  let subjectsWithDataCount = 0;

  relevantSubjects.forEach((sub) => {
    const subEntries = entries.filter((e) => e.subjectId === sub.id);
    const subPresent = subEntries.filter((e) => e.status === 'present').length;
    const subAbsent = subEntries.filter((e) => e.status === 'absent').length;
    const subTotal = subPresent + subAbsent;

    if (subTotal > 0) {
      subjectsWithDataCount++;
      const subPct = (subPresent / subTotal) * 100;

      if (highestName === 'N/A' || subPct >= highestVal) {
        highestVal = subPct;
        highestName = sub.name;
      }
      if (lowestName === 'N/A' || subPct <= lowestVal) {
        lowestVal = subPct;
        lowestName = sub.name;
      }
    }
  });

  if (subjectsWithDataCount === 0) {
    highestName = 'N/A';
    highestVal = 0;
    lowestName = 'N/A';
    lowestVal = 0;
  }

  return {
    total,
    present,
    absent,
    cancelled,
    overallPct,
    highestName,
    highestVal,
    lowestName,
    lowestVal,
  };
}

function parseTimeToMinutes(timeStr?: string): number {
  if (!timeStr) return 9999;
  const clean = timeStr.trim().toLowerCase();
  const isPM = clean.includes('pm');
  const isAM = clean.includes('am');
  const timeOnly = clean.replace(/[ap]m/g, '').trim();
  const parts = timeOnly.split(':');
  if (parts.length < 2) return 9999;

  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  // Fallback for simple "1:30" format without AM/PM (assuming college daytime)
  if (!isAM && !isPM && hours >= 1 && hours <= 7) {
    hours += 12;
  }

  return hours * 60 + minutes;
}
