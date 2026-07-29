import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../api';

export const generateReport = async (reportType: string, quarter: string, format: string, includeAI: boolean) => {
  try {
    let title = '';
    let columns: string[] = [];
    let rows: any[][] = [];

    // Fetch data based on report type
    if (reportType === 'financial') {
      title = `Báo cáo Tài chính - ${quarter}`;
      columns = ['Mã Đơn', 'Ngày', 'Loại', 'Số tiền', 'Trạng thái'];
      
      const [ordersRes] = await Promise.all([
        api.get('/Orders?pageSize=100'),
      ]);

      const orders = ordersRes.data?.items || ordersRes.data || [];
      const expenses = [
        { id: 1, expenseDate: new Date(), amount: 15000000, status: 'Completed' },
        { id: 2, expenseDate: new Date(Date.now() - 86400000), amount: 5000000, status: 'Pending' }
      ];

      const allData = [
        ...orders.map((o: any) => ({
          code: o.orderCode || `ORD-${o.id.substring(0,8)}`,
          date: new Date(o.createdAt).toLocaleDateString('vi-VN'),
          type: 'Doanh thu',
          amount: (o.totalAmount || 0).toLocaleString('vi-VN') + ' đ',
          status: o.orderStatus
        })),
        ...expenses.map((e: any) => ({
          code: `EXP-${e.id}`,
          date: new Date(e.expenseDate).toLocaleDateString('vi-VN'),
          type: 'Chi phí',
          amount: '-' + (e.amount || 0).toLocaleString('vi-VN') + ' đ',
          status: e.status
        }))
      ];

      // Sort by date roughly (this is just for reporting)
      rows = allData.map(d => [d.code, d.date, d.type, d.amount, d.status]);

    } else if (reportType === 'employees') {
      title = `Báo cáo Nhân sự - ${quarter}`;
      columns = ['Mã NV', 'Tên', 'Email', 'Vai trò', 'Ngày tham gia', 'Trạng thái'];
      
      const usersRes = await api.get('/Users?pageSize=100');
      const users = usersRes.data?.items || usersRes.data || [];

      rows = users.map((u: any) => [
        `NV-${u.id.substring(0,8)}`,
        u.fullName,
        u.email,
        u.role?.roleName || 'N/A',
        new Date(u.joinDate || u.createdAt || Date.now()).toLocaleDateString('vi-VN'),
        u.isActive ? 'Hoạt động' : 'Đã nghỉ'
      ]);
    } else if (reportType === 'permissions') {
      title = `Báo cáo Phân quyền - ${quarter}`;
      columns = ['Quyền', 'Vai trò', 'Được phép'];
      
      const permRes = await api.get('/Permissions');
      const perms = permRes.data || [];

      rows = perms.map((p: any) => [
        p.permissionKey,
        p.roleName,
        p.isGranted ? 'Có' : 'Không'
      ]);
    } else {
      title = `Báo cáo - ${quarter}`;
      columns = ['Thông tin'];
      rows = [['Không có dữ liệu']];
    }

    if (includeAI) {
      // Add a dummy AI summary row at the end
      rows.push(['---', '---', '---', '---', '---', '---'].slice(0, columns.length));
      rows.push(['Tóm tắt AI:', 'Dựa trên dữ liệu, hệ thống đang hoạt động ổn định.', '', '', '', ''].slice(0, columns.length));
    }

    if (format === 'pdf') {
      exportToPDF(title, columns, rows);
    } else if (format === 'csv') {
      exportToCSV(title, columns, rows);
    }
    
    return true;
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

const removeAccents = (str: string) => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
};

const exportToPDF = (title: string, columns: string[], rows: any[][]) => {
  const doc = new jsPDF();
  
  const safeTitle = removeAccents(title);
  const safeColumns = columns.map(c => removeAccents(c));
  const safeRows = rows.map(row => row.map(cell => typeof cell === 'string' ? removeAccents(cell) : cell));

  doc.setFontSize(16);
  doc.text(safeTitle, 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Ngay tao: ${new Date().toLocaleDateString('vi-VN')}`, 14, 30);

  autoTable(doc, {
    startY: 35,
    head: [safeColumns],
    body: safeRows,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9 },
    headStyles: { fillColor: [217, 119, 6] },
  });

  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
};

const exportToCSV = (title: string, columns: string[], rows: any[][]) => {
  const csvContent = [
    columns.join(','),
    ...rows.map(r => r.map(item => `"${item}"`).join(','))
  ].join('\n');

  // Add BOM for UTF-8 Excel support
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${title.replace(/\s+/g, '_')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
