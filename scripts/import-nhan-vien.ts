import { supabase } from "../src/integrations/backend/client";
import { readFileSync } from "fs";
import * as xlsx from "xlsx";

async function importEmployees() {
  console.log("Reading Excel file...");
  const fileBuffer = readFileSync("/mnt/user-uploads/Thông_tin_CBNV_1.xlsx");
  const workbook = xlsx.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Parse data as a 2D array to inspect it accurately
  const rows: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log(`Found ${rows.length} raw rows.`);
  
  // Header is at index 4 (row 5)
  const header = rows[4];
  console.log("Header found:", header);

  const employees = [];
  
  // Data starts from index 5
  for (let i = 5; i < rows.length; i++) {
    const row = rows[i];
    const stt = row[0];
    const hoTen = row[1];
    const chucVu = row[2];
    const dobRaw = row[3];
    const sdt = row[4];

    if (!hoTen || stt === "*" || String(hoTen).includes("Ban Giám đốc") || String(hoTen).includes("Phòng") || String(hoTen).includes("Đài")) {
      continue;
    }

    // Clean phone number
    let phone = sdt ? String(sdt).trim() : null;
    
    // Parse date
    let dob = null;
    if (dobRaw) {
      const d = new Date(dobRaw);
      if (!isNaN(d.getTime())) {
        dob = d.toISOString().split('T')[0];
      }
    }

    employees.push({
      ma_nhan_vien: `NV_${String(employees.length + 1).padStart(4, '0')}`,
      ho_ten: String(hoTen).trim(),
      chuc_vu: chucVu ? String(chucVu).trim() : null,
      dien_thoai: phone,
      ngay_sinh: dob,
      hoat_dong: true
    });
  }

  console.log(`Prepared ${employees.length} employees to import.`);

  for (const emp of employees) {
    const { error } = await supabase
      .from("nhan_vien")
      .upsert(emp, { onConflict: "ma_nhan_vien" });
    
    if (error) {
      console.error(`Error importing ${emp.ho_ten}:`, error.message);
    } else {
      // console.log(`Imported: ${emp.ho_ten}`);
    }
  }

  console.log("Import completed.");
}

importEmployees().catch(console.error);
