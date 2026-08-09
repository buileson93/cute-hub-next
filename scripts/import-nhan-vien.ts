import { supabase } from "../src/integrations/backend/client";
import { readFileSync } from "fs";
import * as xlsx from "xlsx";

async function importEmployees() {
  console.log("Reading Excel file...");
  const fileBuffer = readFileSync("/mnt/user-uploads/Thông_tin_CBNV_1.xlsx");
  const workbook = xlsx.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Parse data starting from row 5 (index 4)
  const data: any[] = xlsx.utils.sheet_to_json(worksheet, { range: 4 });
  
  console.log(`Found ${data.length} potential rows.`);
  
  const employees = data
    .filter(row => row["HỌ TÊN"] && row["STT"] !== "*")
    .map((row, index) => {
      // Clean phone number
      let phone = row[" SĐT"] ? String(row[" SĐT"]).trim() : null;
      
      // Parse date
      let dob = null;
      if (row["Ngày sinh"]) {
        const d = new Date(row["Ngày sinh"]);
        if (!isNaN(d.getTime())) {
          dob = d.toISOString().split('T')[0];
        }
      }

      return {
        ma_nhan_vien: `NV_${String(index + 1).padStart(4, '0')}`,
        ho_ten: row["HỌ TÊN"].trim(),
        chuc_vu: row["CHỨC DANH"] ? row["CHỨC DANH"].trim() : null,
        dien_thoai: phone,
        ngay_sinh: dob,
        hoat_dong: true
      };
    });

  console.log(`Prepared ${employees.length} employees to import.`);

  for (const emp of employees) {
    const { error } = await supabase
      .from("nhan_vien")
      .upsert(emp, { onConflict: "ma_nhan_vien" });
    
    if (error) {
      console.error(`Error importing ${emp.ho_ten}:`, error.message);
    } else {
      console.log(`Imported: ${emp.ho_ten}`);
    }
  }

  console.log("Import completed.");
}

importEmployees().catch(console.error);
