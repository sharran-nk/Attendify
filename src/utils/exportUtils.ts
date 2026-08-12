import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { Subject, AttendanceEntry } from '@/types/attendance';

interface ReportData {
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
    const timeStr = entry.time || 'N/A';
    
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

export function generatePDF(data: ReportData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const filteredAttendance = getFilteredAttendance(data);
  const dateRangeStr = getDateRangeString(data);

  // Styling Constants
  const primaryColor = [0, 122, 255]; // #007AFF iOS Blue
  const textColor = [26, 26, 26];
  const mutedTextColor = [115, 115, 115];
  const accentColor = [242, 242, 247]; // Light gray background
  
  // Page layout helper
  let currentY = 15;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const contentWidth = doc.internal.pageSize.width - margin * 2;

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
      drawHeaderFooter();
    }
  };

  const drawHeaderFooter = () => {
    // Top border line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(margin, 10, margin + contentWidth, 10);

    // Header text
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('ATTENDIFY — ATTENDANCE REPORT', margin, 7);

    // Footer page number
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Page ${pageCount}`, doc.internal.pageSize.width - margin, doc.internal.pageSize.height - 7, { align: 'right' });
    doc.text(`Generated on ${format(new Date(), 'dd MMM yyyy')}`, margin, doc.internal.pageSize.height - 7);
  };

  // 1. HEADER SECTION
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('ATTENDIFY', margin, currentY);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text('Attendance Report', margin, currentY + 7);

  // Student Info (Right-aligned)
  doc.setFontSize(10);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(`Name: ${data.userName}`, doc.internal.pageSize.width - margin, currentY, { align: 'right' });
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`Email: ${data.userEmail}`, doc.internal.pageSize.width - margin, currentY + 5, { align: 'right' });
  doc.text(`Date: ${format(new Date(), 'dd MMM yyyy')}`, doc.internal.pageSize.width - margin, currentY + 10, { align: 'right' });

  currentY += 20;

  // Selected Date Range Sub-header
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1);
  doc.line(margin, currentY, margin + contentWidth, currentY);
  
  currentY += 5;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(`Period: ${dateRangeStr}`, margin, currentY);
  
  if (data.selectedSubjectId !== 'all') {
    const subject = data.subjects.find(s => s.id === data.selectedSubjectId);
    if (subject) {
      doc.text(`Subject: ${subject.name}`, doc.internal.pageSize.width - margin, currentY, { align: 'right' });
    }
  }

  currentY += 10;

  // Calculate Metrics
  const stats = calculateStats(filteredAttendance, data.subjects, data.selectedSubjectId);

  // 2. SUMMARY BOXES (2-column key metrics)
  checkPageBreak(35);
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.roundedRect(margin, currentY, contentWidth, 25, 3, 3, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  
  doc.text('TOTAL CLASSES', margin + 10, currentY + 8);
  doc.text('ATTENDED', margin + 50, currentY + 8);
  doc.text('ABSENT', margin + 90, currentY + 8);
  doc.text('OVERALL ATTENDANCE', margin + 130, currentY + 8);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  
  doc.text(`${stats.total}`, margin + 10, currentY + 18);
  doc.setTextColor(0, 150, 0); // Green
  doc.text(`${stats.present}`, margin + 50, currentY + 18);
  doc.setTextColor(220, 0, 0); // Red
  doc.text(`${stats.absent}`, margin + 90, currentY + 18);
  
  // Overall % color based on warning threshold
  const overallPercent = stats.total > 0 ? (stats.present / stats.total) * 100 : 0;
  if (overallPercent < data.warningThreshold) {
    doc.setTextColor(220, 0, 0);
  } else {
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  }
  doc.text(`${overallPercent.toFixed(2)}%`, margin + 130, currentY + 18);

  currentY += 35;

  // 3. STATS CARDS
  if (data.selectedSubjectId === 'all' && data.subjects.length > 0) {
    checkPageBreak(25);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('Attendance Overview', margin, currentY);
    currentY += 5;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Highest Attendance Subject:`, margin, currentY);
    doc.setFont('Helvetica', 'bold');
    doc.text(`${stats.highestName} (${stats.highestVal.toFixed(1)}%)`, margin + 55, currentY);

    currentY += 5;
    doc.setFont('Helvetica', 'normal');
    doc.text(`Lowest Attendance Subject:`, margin, currentY);
    doc.setFont('Helvetica', 'bold');
    if (stats.lowestVal < data.warningThreshold) {
      doc.setTextColor(220, 0, 0);
      doc.text(`⚠️ ${stats.lowestName} (${stats.lowestVal.toFixed(1)}%)`, margin + 55, currentY);
    } else {
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(`${stats.lowestName} (${stats.lowestVal.toFixed(1)}%)`, margin + 55, currentY);
    }
    
    currentY += 15;
  }

  // 4. DAILY ATTENDANCE TABLE (Grouped by Date)
  if (filteredAttendance.length === 0) {
    checkPageBreak(20);
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text('No attendance records found for the selected period.', margin, currentY);
    currentY += 15;
  } else {
    checkPageBreak(15);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('Daily Attendance Log', margin, currentY);
    currentY += 7;

    // Grouping logic by Date
    const grouped = groupByDate(filteredAttendance);
    
    // Sort dates descending or ascending? Let's do ascending for a chronological report.
    const sortedDates = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

    sortedDates.forEach((dateStr) => {
      const entries = grouped[dateStr];
      const parsedDate = parseISO(dateStr);
      const headerTitle = `${format(parsedDate, 'EEEE')} — ${format(parsedDate, 'dd MMM yyyy')}`;

      // Check height before rendering table group
      const neededHeight = 15 + entries.length * 8;
      checkPageBreak(neededHeight);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(headerTitle, margin, currentY);
      currentY += 3;

      const tableBody = entries.map((entry) => {
        const subject = data.subjects.find((s) => s.id === entry.subjectId);
        const subjectName = subject ? subject.name : 'Unknown';
        const timeVal = entry.time || 'N/A';
        
        let statusVal = '✅ Attended';
        if (entry.status === 'absent') statusVal = '❌ Not Attended';
        if (entry.status === 'cancelled') statusVal = '➖ Cancelled';

        return [timeVal, subjectName, statusVal];
      });

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Time', 'Subject', 'Status']],
        body: tableBody,
        theme: 'plain',
        styles: {
          fontSize: 9,
          cellPadding: 1.5,
          textColor: [50, 50, 50],
        },
        headStyles: {
          fontStyle: 'bold',
          textColor: [100, 100, 100],
          fillColor: [248, 249, 250],
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 40, fontStyle: 'bold' },
        },
        didDrawPage: () => {
          // Keep track of header/footer on page break
          drawHeaderFooter();
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;
    });
  }

  // 5. SUBJECT-WISE SUMMARY (Only for All Subjects)
  if (data.selectedSubjectId === 'all' && data.subjects.length > 0) {
    checkPageBreak(30);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('Subject-wise Performance', margin, currentY);
    currentY += 5;

    const subjectRows = data.subjects.map((sub) => {
      const subEntries = filteredAttendance.filter(a => a.subjectId === sub.id);
      const total = subEntries.length;
      const present = subEntries.filter(a => a.status === 'present').length;
      const absent = subEntries.filter(a => a.status === 'absent').length;
      const pct = total > 0 ? (present / total) * 100 : 0;
      
      const pctStr = `${pct.toFixed(1)}%`;
      const isBelow = pct < data.warningThreshold && total > 0;

      return [
        sub.name,
        total.toString(),
        present.toString(),
        absent.toString(),
        isBelow ? `⚠️ ${pctStr}` : pctStr,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Subject', 'Total Classes', 'Present', 'Absent', 'Attendance %']],
      body: subjectRows,
      theme: 'striped',
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 35, halign: 'center', fontStyle: 'bold' },
      },
      didParseCell: (cellData) => {
        // Red color text if cell is below threshold
        if (cellData.column.index === 4 && cellData.cell.text[0]?.startsWith('⚠️')) {
          cellData.cell.styles.textColor = [220, 0, 0];
        }
      },
      didDrawPage: () => {
        drawHeaderFooter();
      }
    });
  }

  // Draw header/footers on pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawHeaderFooter();
  }

  return doc;
}

// Helpers
function getFilteredAttendance(data: ReportData): AttendanceEntry[] {
  let entries = [...data.attendance];

  // Subject filter
  if (data.selectedSubjectId !== 'all') {
    entries = entries.filter((e) => e.subjectId === data.selectedSubjectId);
  }

  // Date filter
  if (data.dateRange.type === 'week') {
    // Last 7 days
    const start = new Date();
    start.setDate(start.getDate() - 7);
    entries = entries.filter((e) => {
      const d = parseISO(e.date);
      return d >= start;
    });
  } else if (data.dateRange.type === 'month') {
    // Last 30 days
    const start = new Date();
    start.setDate(start.getDate() - 30);
    entries = entries.filter((e) => {
      const d = parseISO(e.date);
      return d >= start;
    });
  } else if (data.dateRange.type === 'custom' && data.dateRange.start && data.dateRange.end) {
    const start = data.dateRange.start;
    const end = data.dateRange.end;
    entries = entries.filter((e) => {
      const d = parseISO(e.date);
      return isWithinInterval(d, { start, end });
    });
  }

  // Sort chronologically
  return entries.sort((a, b) => a.date.localeCompare(b.date));
}

function getDateRangeString(data: ReportData): string {
  if (data.dateRange.type === 'all') return 'All Attendance';
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

function calculateStats(entries: AttendanceEntry[], subjects: Subject[], selectedSubjectId: string) {
  const total = entries.length;
  const present = entries.filter((e) => e.status === 'present').length;
  const absent = entries.filter((e) => e.status === 'absent').length;

  let highestName = 'N/A';
  let highestVal = 0;
  let lowestName = 'N/A';
  let lowestVal = 100;

  if (selectedSubjectId === 'all') {
    subjects.forEach((sub) => {
      const subEntries = entries.filter((e) => e.subjectId === sub.id);
      if (subEntries.length > 0) {
        const subPresent = subEntries.filter((e) => e.status === 'present').length;
        const subPct = (subPresent / subEntries.length) * 100;

        if (subPct >= highestVal) {
          highestVal = subPct;
          highestName = sub.name;
        }
        if (subPct <= lowestVal) {
          lowestVal = subPct;
          lowestName = sub.name;
        }
      }
    });
    if (highestName === 'N/A') highestVal = 0;
    if (lowestName === 'N/A') lowestVal = 0;
  }

  return { total, present, absent, highestName, highestVal, lowestName, lowestVal };
}
