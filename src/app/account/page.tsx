"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";

interface AccountUser {
  id: string;
  account_id: string;
  provider_id: string;
  full_name_th: string;
  full_name_en: string | null;
  email: string | null;
  birth_date: string | null;
  position: string | null;
  role: string | null;
  department: string | null;
  level: string | null;
  organization: string | null;
  hospital_code: string | null;
  address: string | null;
  active: boolean;
  last_login: string | null;
  login_count: number;
  created_account_at: string | null;
  created_at: string;
  updated_at: string;
}

const THEME = {
  primary: "#00A651",
  secondary: "#A3D9A5",
  accent: "#F59E0B",
  bg: "#F3F4F6",
  white: "#FFFFFF",
  textMain: "#1F2937",
  textLight: "#6B7280",
  success: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
};

export default function AccountPage() {
  const [users, setUsers] = useState<AccountUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<AccountUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<AccountUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const res = await fetch(`/api/account?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setUsers(data.data);
      } else {
        toast.error("ไม่สามารถโหลดข้อมูลได้");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingUser),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("อัปเดตข้อมูลสำเร็จ");
        setEditingUser(null);
        fetchUsers();
      } else {
        toast.error(data.error || "ไม่สามารถอัปเดตข้อมูลได้");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("เกิดข้อผิดพลาดในการอัปเดต");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/account?id=${deleteConfirm.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        toast.success("ลบข้อมูลสำเร็จ");
        setDeleteConfirm(null);
        fetchUsers();
      } else {
        toast.error(data.error || "ไม่สามารถลบข้อมูลได้");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("เกิดข้อผิดพลาดในการลบ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: THEME.bg }}>
      {/* Header */}
      <div
        className="shadow-sm"
        style={{ backgroundColor: THEME.white }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1
            className="text-2xl font-bold"
            style={{ color: THEME.primary }}
          >
            จัดการบัญชีผู้ใช้
          </h1>
          <p style={{ color: THEME.textLight }}>
            รายการผู้ใช้งานทั้งหมด {users.length} คน
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="ค้นหาชื่อ, อีเมล, รหัส..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ borderColor: THEME.secondary, maxWidth: 400 }}
          />
          <button
            onClick={fetchUsers}
            className="px-4 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: THEME.primary }}
          >
            ค้นหา
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div
          className="rounded-lg shadow overflow-hidden"
          style={{ backgroundColor: THEME.white }}
        >
          {loading ? (
            <div className="p-8 text-center" style={{ color: THEME.textLight }}>
              กำลังโหลด...
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center" style={{ color: THEME.textLight }}>
              ไม่พบข้อมูลผู้ใช้
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: THEME.bg }}>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: THEME.textMain }}>
                      ชื่อ-นามสกุล
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: THEME.textMain }}>
                      อีเมล
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: THEME.textMain }}>
                      หน่วยงาน
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: THEME.textMain }}>
                      ตำแหน่ง
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: THEME.textMain }}>
                      สถานะ
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: THEME.textMain }}>
                      เข้าสู่ระบบ
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: THEME.textMain }}>
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, idx) => (
                    <tr
                      key={user.id}
                      className="border-t hover:bg-gray-50"
                      style={{ borderColor: THEME.bg }}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium" style={{ color: THEME.textMain }}>
                          {user.full_name_th}
                        </div>
                        {user.full_name_en && (
                          <div className="text-sm" style={{ color: THEME.textLight }}>
                            {user.full_name_en}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: THEME.textMain }}>
                        {user.email || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: THEME.textMain }}>
                        <div>{user.organization || "-"}</div>
                        {user.hospital_code && (
                          <div style={{ color: THEME.textLight }}>
                            รหัส: {user.hospital_code}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: THEME.textMain }}>
                        {user.position || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: user.active ? "#D1FAE5" : "#FEE2E2",
                            color: user.active ? THEME.success : THEME.danger,
                          }}
                        >
                          {user.active ? "ใช้งาน" : "ปิดใช้งาน"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm" style={{ color: THEME.textLight }}>
                        <div>{user.login_count} ครั้ง</div>
                        <div className="text-xs">{formatDateTime(user.last_login)}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="px-3 py-1 rounded text-sm font-medium text-white"
                            style={{ backgroundColor: THEME.info }}
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(user)}
                            className="px-3 py-1 rounded text-sm font-medium text-white"
                            style={{ backgroundColor: THEME.danger }}
                          >
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: THEME.white }}
          >
            <div className="p-6">
              <h2
                className="text-xl font-bold mb-4"
                style={{ color: THEME.primary }}
              >
                แก้ไขข้อมูลผู้ใช้
              </h2>

              <form onSubmit={handleUpdate}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: THEME.textMain }}>
                      ชื่อ-นามสกุล (ไทย) *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingUser.full_name_th}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, full_name_th: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{ borderColor: THEME.secondary }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: THEME.textMain }}>
                      ชื่อ-นามสกุล (อังกฤษ)
                    </label>
                    <input
                      type="text"
                      value={editingUser.full_name_en || ""}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, full_name_en: e.target.value || null })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{ borderColor: THEME.secondary }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: THEME.textMain }}>
                      อีเมล
                    </label>
                    <input
                      type="email"
                      value={editingUser.email || ""}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, email: e.target.value || null })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{ borderColor: THEME.secondary }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: THEME.textMain }}>
                      ตำแหน่ง
                    </label>
                    <input
                      type="text"
                      value={editingUser.position || ""}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, position: e.target.value || null })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{ borderColor: THEME.secondary }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: THEME.textMain }}>
                      Role
                    </label>
                    <input
                      type="text"
                      value={editingUser.role || ""}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, role: e.target.value || null })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{ borderColor: THEME.secondary }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: THEME.textMain }}>
                      Department
                    </label>
                    <input
                      type="text"
                      value={editingUser.department || ""}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, department: e.target.value || null })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{ borderColor: THEME.secondary }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: THEME.textMain }}>
                      หน่วยงาน
                    </label>
                    <input
                      type="text"
                      value={editingUser.organization || ""}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, organization: e.target.value || null })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{ borderColor: THEME.secondary }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: THEME.textMain }}>
                      รหัสหน่วยบริการ
                    </label>
                    <input
                      type="text"
                      value={editingUser.hospital_code || ""}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, hospital_code: e.target.value || null })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{ borderColor: THEME.secondary }}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1" style={{ color: THEME.textMain }}>
                      ที่อยู่
                    </label>
                    <input
                      type="text"
                      value={editingUser.address || ""}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, address: e.target.value || null })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{ borderColor: THEME.secondary }}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingUser.active}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, active: e.target.checked })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium" style={{ color: THEME.textMain }}>
                        เปิดใช้งาน
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 rounded-lg font-medium"
                    style={{ backgroundColor: THEME.bg, color: THEME.textMain }}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg font-medium text-white disabled:opacity-50"
                    style={{ backgroundColor: THEME.primary }}
                  >
                    {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-lg shadow-xl w-full max-w-md"
            style={{ backgroundColor: THEME.white }}
          >
            <div className="p-6">
              <h2
                className="text-xl font-bold mb-4"
                style={{ color: THEME.danger }}
              >
                ยืนยันการลบ
              </h2>
              <p style={{ color: THEME.textMain }}>
                คุณต้องการลบผู้ใช้ <strong>{deleteConfirm.full_name_th}</strong> ใช่หรือไม่?
              </p>
              <p className="text-sm mt-2" style={{ color: THEME.textLight }}>
                การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 rounded-lg font-medium"
                  style={{ backgroundColor: THEME.bg, color: THEME.textMain }}
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: THEME.danger }}
                >
                  {isSubmitting ? "กำลังลบ..." : "ลบ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
