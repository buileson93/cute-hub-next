# Plan: Software License Management Enhancement (Employee-Centric)

The system currently supports assigning software licenses to assets (computers) and assets to employees. This plan aims to make this relationship more visible and manageable from the employee's perspective, as requested.

## 1. Feature Confirmation & Visual Edit

- **Action**: Add a "Feature Capability" banner in the Software License management page (`/phan-mem-ban-quyen`).
- **Content**: Use the Vietnamese text provided by the user to confirm that the system handles License -> Asset -> Employee relationships.
- **Why**: Satisfies the "visual text edit" request and confirms feature existence.

## 2. Employee-Centric License Inventory

- **Action**: Enhance the Employee Management page (`/admin/nhan-vien`).
- **Implementation**:
  - Add a "View Software" action for each employee in the `StandardTable`.
  - Create `NhanVienSoftwareSheet` to display:
    - List of assets (computers/laptops) assigned to the employee.
    - For each asset, list the active software licenses.
  - Provide a "Quick Assign" button within this sheet to add new licenses to the employee's assets.

## 3. Search & UI Enhancements

- **Action**: Improve the `BanQuyenCapPhatDialog` (Asset-centric assignment).
- **Implementation**:
  - Update the search logic in `useThietBiOptions` to allow searching by **Employee Name** in addition to Asset Name/Code.
  - This makes it easier to find the "computer belonging to employee X" when assigning a license.

## 4. Documentation & Form Template

- **Action**: Provide a clear "Workflow Guide" in the UI explaining how to:
  1. Assign a Computer to an Employee (via `ThietBiFormDialog`).
  2. Assign a License to that Computer (via `BanQuyenCapPhatDialog`).
- **Why**: Responds to the user's question about whether an "input form template" exists.

## 5. Verification

- **Test**: Verify that searching for an employee name in the License Assignment dialog returns their assigned computers.
- **Test**: Verify that the Employee list shows the correct software inventory for a selected employee.
