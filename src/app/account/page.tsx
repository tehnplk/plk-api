"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface AccountUser {
  id: number;
  account_id: string;
  provider_id: string;
  full_name_th: string;
  full_name_en: string | null;
  email: string | null;
  organization: string | null;
  department: string | null;
  role: string | null;
  active: boolean;
  last_login: string | null;
  login_count: number;
  created_account_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Department {
  id: string;
  name: string;
  activate: boolean;
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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<AccountUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<AccountUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<AccountUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  // Fetch user role from account_user
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const rawProfile = (session.user as any)?.profile;
      if (rawProfile) {
        try {
          const profile = JSON.parse(rawProfile);
          const providerId = profile.provider_id;
          if (providerId) {
            fetch(`/api/account/role?provider_id=${providerId}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.success && data.role) {
                  setUserRole(data.role);
                }
                setIsCheckingRole(false);
              })
              .catch(() => {
                setIsCheckingRole(false);
              });
          } else {
            setIsCheckingRole(false);
          }
        } catch {
          setIsCheckingRole(false);
        }
      } else {
        setIsCheckingRole(false);
      }
    }
  }, [status, session]);

  // Redirect to home if not admin
  useEffect(() => {
    if (!isCheckingRole && userRole !== 'admin') {
      toast.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
      router.replace('/home');
    }
  }, [isCheckingRole, userRole, router]);

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

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch("/api/department");
      const data = await res.json();
      if (data.success) {
        setDepartments(data.data.filter((d: Department) => d.activate));
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, [fetchUsers, fetchDepartments]);

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

  // Show loading while checking auth/role
  if (status === 'loading' || status === 'unauthenticated' || isCheckingRole || userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: THEME.bg }}>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-green-100">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link
            href="/home"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-green-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold shadow">
              <Users size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">จัดการบัญชีผู้ใช้</h1>
              <p className="text-xs text-gray-500">รายการผู้ใช้งานทั้งหมด {users.length} คน</p>
            </div>
          </div>
        </div>
      </header>

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
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ backgroundColor: THEME.bg }}>
                    <th className="px-3 py-2 text-center font-semibold w-12" style={{ color: THEME.textMain }}>
                      ลำดับ
                    </th>
                    <th className="px-3 py-2 text-left font-semibold" style={{ color: THEME.textMain }}>
                      ชื่อ-นามสกุล
                    </th>
                    <th className="px-3 py-2 text-left font-semibold" style={{ color: THEME.textMain }}>
                      อีเมล
                    </th>
                    <th className="px-3 py-2 text-left font-semibold" style={{ color: THEME.textMain }}>
                      สังกัด
                    </th>
                    <th className="px-3 py-2 text-left font-semibold" style={{ color: THEME.textMain }}>
                      กลุ่มงาน
                    </th>
                    <th className="px-3 py-2 text-left font-semibold" style={{ color: THEME.textMain }}>
                      Role
                    </th>
                    <th className="px-3 py-2 text-center font-semibold" style={{ color: THEME.textMain }}>
                      Activate
                    </th>
                    <th className="px-3 py-2 text-center font-semibold" style={{ color: THEME.textMain }}>
                      เข้าใช้ล่าสุด
                    </th>
                    <th className="px-3 py-2 text-center font-semibold" style={{ color: THEME.textMain }}>
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
                      <td className="px-3 py-2 text-center font-medium" style={{ color: THEME.textLight }}>
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium" style={{ color: THEME.textMain }}>
                          {user.full_name_th}
                        </div>
                        {user.full_name_en && (
                          <div style={{ color: THEME.textLight }}>
                            {user.full_name_en}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2" style={{ color: THEME.textMain }}>
                        {user.email || "-"}
                      </td>
                      <td className="px-3 py-2" style={{ color: THEME.textMain }}>
                        {(() => {
                          try {
                            const orgs = JSON.parse(user.organization || "[]");
                            if (Array.isArray(orgs) && orgs.length > 0) {
                              return (
                                <div className="space-y-1">
                                  {orgs.map((org: any, i: number) => (
                                    <div key={i}>
                                      {i + 1}. {org.position || "-"} {org.hname_th || "-"}({org.hcode || "-"})
                                    </div>
                                  ))}
                                </div>
                              );
                            }
                            return "-";
                          } catch {
                            return user.organization || "-";
                          }
                        })()}
                      </td>
                      <td className="px-3 py-2" style={{ color: THEME.textMain }}>
                        {user.department || "-"}
                      </td>
                      <td className="px-3 py-2" style={{ color: THEME.textMain }}>
                        {user.role || "-"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className="px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: user.active ? "#D1FAE5" : "#FEE2E2",
                            color: user.active ? THEME.success : THEME.danger,
                          }}
                        >
                          {user.active ? "YES" : "NO"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center" style={{ color: THEME.textLight }}>
                        {user.last_login ? formatDateTime(user.last_login) : "-"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="px-2 py-1 rounded font-medium text-white"
                            style={{ backgroundColor: THEME.info }}
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(user)}
                            className="px-2 py-1 rounded font-medium text-white"
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
            className="rounded-lg shadow-xl w-full max-w-md"
            style={{ backgroundColor: THEME.white }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b" style={{ borderColor: THEME.bg }}>
              <h2 className="text-lg font-bold" style={{ color: THEME.primary }}>
                แก้ไขสิทธิ์ผู้ใช้
              </h2>
              <p className="text-sm mt-1" style={{ color: THEME.textLight }}>
                {editingUser.full_name_th}
              </p>
            </div>

            {/* User Info (Read-only) */}
            <div className="px-6 py-4 space-y-2" style={{ backgroundColor: THEME.bg }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: THEME.textLight }}>Provider ID:</span>
                <span className="font-mono" style={{ color: THEME.textMain }}>{editingUser.provider_id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: THEME.textLight }}>Email:</span>
                <span style={{ color: THEME.textMain }}>{editingUser.email || "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: THEME.textLight }}>หน่วยงาน:</span>
                <span style={{ color: THEME.textMain }}>
                  {(() => {
                    try {
                      const org = JSON.parse(editingUser.organization || "[]");
                      return org[0]?.hname_th || "-";
                    } catch {
                      return "-";
                    }
                  })()}
                </span>
              </div>
            </div>

            {/* Editable Fields */}
            <form onSubmit={handleUpdate}>
              <div className="px-6 py-5 space-y-5">
                {/* Department */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: THEME.textMain }}>
                    กลุ่มงาน
                  </label>
                  <select
                    value={editingUser.department || ""}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, department: e.target.value })
                    }
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    style={{ borderColor: THEME.secondary }}
                  >
                    <option value="">-- เลือกกลุ่มงาน --</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: THEME.textMain }}>
                    Role
                  </label>
                  <select
                    value={editingUser.role || ""}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, role: e.target.value })
                    }
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    style={{ borderColor: THEME.secondary }}
                  >
                    <option value="">-- ไม่ระบุ --</option>
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: THEME.bg }}>
                  <div>
                    <p className="font-medium" style={{ color: THEME.textMain }}>สถานะการใช้งาน</p>
                    <p className="text-sm" style={{ color: THEME.textLight }}>
                      {editingUser.active ? "บัญชีนี้เปิดใช้งานอยู่" : "บัญชีนี้ถูกปิดใช้งาน"}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingUser.active}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, active: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: THEME.bg }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium"
                  style={{ backgroundColor: THEME.bg, color: THEME.textMain }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: THEME.primary }}
                >
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </form>
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
