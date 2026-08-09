import { supabase } from "../src/integrations/backend/client";
import { readFileSync } from "fs";
import * as xlsx from "xlsx";

async function importEmployees() {
  console.log("Reading Excel file...");
  const fileBuffer = readFileSync("/mnt/user-uploads/Thông_tin_CBNV_1.xlsx");
  const workbook = xlsx.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const rows: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  console.log(`Found ${rows.length} raw rows.`);

  const employees = [];
  let currentDonVi = "Công ty";

  // Data starts from index 7
  for (let i = 7; i < rows.length; i++) {
    const row = rows[i];
    const stt = row[0];
    const hoTen = row[1];
    const chucVu = row[2];
    const dobRaw = row[3];
    const sdt = row[4];

    if (!hoTen) continue;

    if (stt === "*") {
      currentDonVi = String(hoTen).trim();
      continue;
    }

    // Clean phone number
    let phone = sdt ? String(sdt).trim() : null;
    
    // Parse date
    let dob = null;
    if (dobRaw) {
      if (typeof dobRaw === 'number') {
        // Excel serial date
        const d = new Date((dobRaw - 25569) * 86400 * 1000);
        dob = d.toISOString().split('T')[0];
      } else {
        const d = new Date(dobRaw);
        if (!isNaN(d.getTime())) {
          dob = d.toISOString().split('T')[0];
        }
      }
    }

    employees.push({
      ma_nhan_vien: `NV_${String(employees.length + 1).padStart(4, '0')}`,
      ho_ten: String(hoTen).trim(),
      chuc_vu: chucVu ? String(chucVu).trim() : null,
      don_vi: currentDonVi,
      dien_thoai: phone,
      ngay_sinh: dob,
      hoat_dong: true
    });
  }

  console.log(`Prepared ${employees.length} employees to import.`);

  // Batch insert in chunks of 50
  const chunkSize = 50;
  for (let i = 0; i < employees.length; i += chunkSize) {
    const chunk = employees.slice(i, i + chunkSize);
    const { error } = await supabase
      .from("nhan_vien")
      .upsert(chunk, { onConflict: "ma_nhan_vien" });
    
    if (error) {
      console.error(`Error importing chunk starting at ${i}:`, error.message);
    } else {
      console.log(`Imported chunk ${i / chunkSize + 1}`);
    }
  }

  console.log("Import completed.");
}

importEmployees().catch(console.error);
