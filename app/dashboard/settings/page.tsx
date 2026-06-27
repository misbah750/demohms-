"use client";

import { useState } from "react";
import { Settings, Bell, Shield, User, Globe, Check } from "lucide-react";
import { toast } from "sonner";

interface SectionField {
  label: string;
  value: string;
  type: string;
}

interface Section {
  icon: React.ElementType;
  label: string;
  description: string;
  fields: SectionField[];
}

export default function SettingsPage() {
  const [reminders, setReminders] = useState<Record<string, boolean>>({
    appt: true,
    stock: true,
    payment: true,
    followup: false,
  });

  const sections: Section[] = [
    {
      icon: User, label: "Profile Information", description: "Manage your administrator account details",
      fields: [
        { label: "Full Name", value: "Admin User", type: "text" },
        { label: "Email Address", value: "admin@hms.com", type: "email" },
        { label: "Phone Number", value: "+92-300-0000000", type: "text" },
      ],
    },
    {
      icon: Globe, label: "Clinic Configuration", description: "Configure your organization setup information",
      fields: [
        { label: "Clinic Name", value: "HMS Clinic", type: "text" },
        { label: "Address", value: "123 Medical Center, Karachi", type: "text" },
        { label: "Phone", value: "+92-21-00000000", type: "text" },
        { label: "Timezone", value: "Asia/Karachi", type: "text" },
      ],
    },
  ];

  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5 font-medium">Manage your clinic and account preferences</p>
      </div>

      {sections.map(({ icon: Icon, label, description, fields }) => (
        <div key={label} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center border border-sky-100">
              <Icon className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{label}</p>
              <p className="text-xs text-slate-500">{description}</p>
            </div>
          </div>
          <div className="space-y-3.5">
            {fields.map((f) => (
              <div key={f.label} className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{f.label}</label>
                <input
                  type={f.type}
                  defaultValue={f.value}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                />
              </div>
            ))}
          </div>
          <div className="pt-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      ))}

      {/* Notifications */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center border border-sky-100">
            <Bell className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Notifications</p>
            <p className="text-xs text-slate-500">Configure alert preferences</p>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { key: "appt", label: "Appointment Reminders", desc: "Send SMS/email reminders 24hrs before" },
            { key: "stock", label: "Low Stock Alerts", desc: "Alert when inventory is below reorder level" },
            { key: "payment", label: "Payment Notifications", desc: "Notify when invoice is paid" },
            { key: "followup", label: "Follow-up Reminders", desc: "Daily digest of pending follow-ups" },
          ].map(({ key, label, desc }) => (
            <div key={label} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
              <button
                type="button"
                onClick={() => setReminders((r) => ({ ...r, [key]: !r[key] }))}
                className={`w-11 h-6 rounded-full relative transition-colors ${reminders[key] ? "bg-sky-600" : "bg-slate-200"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${reminders[key] ? "translate-x-5" : ""}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center border border-sky-100">
            <Shield className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Security</p>
            <p className="text-xs text-slate-500">Manage password and authentication</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">New Password</label>
            <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Confirm Password</label>
            <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all" />
          </div>
        </div>
        <div className="pt-2">
          <button
            onClick={() => {
              toast.success("Password updated successfully");
            }}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}
