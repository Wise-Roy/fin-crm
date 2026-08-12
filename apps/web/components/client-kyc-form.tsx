"use client";

import { useState } from "react";
import type { ClientKyc } from "@/lib/types";
import {
  validatePAN,
  validateGSTIN,
  validateGSTStateCode,
  validateLLPIN,
  validateDIN,
  validateCIN,
  validatePincode,
} from "@/lib/validations";

interface KycFormProps {
  initial?: ClientKyc;
  onChange: (kyc: ClientKyc) => void;
  disabled?: boolean;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh", "Chandigarh", "Puducherry",
  "Andaman & Nicobar", "Dadra & Nagar Haveli", "Lakshadweep",
];

export function ClientKycForm({ initial, onChange, disabled }: KycFormProps) {
  const [kyc, setKyc] = useState<ClientKyc>({
    business_pan: initial?.business_pan || "",
    address_line1: initial?.address_line1 || "",
    address_line2: initial?.address_line2 || "",
    city: initial?.city || "",
    state: initial?.state || "",
    country: initial?.country || "India",
    pincode: initial?.pincode || "",
    llpin: initial?.llpin || "",
    din: initial?.din || "",
    cin: initial?.cin || "",
    gst_number: initial?.gst_number || "",
    gst_state_code: initial?.gst_state_code || "",
    gst_dest_address: initial?.gst_dest_address || "",
  });

  const update = (key: keyof ClientKyc, value: string) => {
    const next = { ...kyc, [key]: value };
    setKyc(next);
    onChange(next);
  };

  const panErr = validatePAN(kyc.business_pan || "").error;
  const gstErr = validateGSTIN(kyc.gst_number || "").error;
  const gstStateErr = validateGSTStateCode(kyc.gst_state_code || "").error;
  const llpinErr = validateLLPIN(kyc.llpin || "").error;
  const dinErr = validateDIN(kyc.din || "").error;
  const cinErr = validateCIN(kyc.cin || "").error;
  const pincodeErr = validatePincode(kyc.pincode || "").error;

  const inputCls = "w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10";

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">KYC Details</p>

      {/* Registration Numbers */}
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Business PAN</label>
          <input
            value={kyc.business_pan || ""}
            onChange={(e) => update("business_pan", e.target.value.toUpperCase())}
            placeholder="ABCDE1234F"
            maxLength={10}
            className={inputCls}
            disabled={disabled}
          />
          {panErr && <p className="text-xs text-red-500 mt-0.5">{panErr}</p>}
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">LLPIN</label>
          <input
            value={kyc.llpin || ""}
            onChange={(e) => update("llpin", e.target.value.toUpperCase())}
            placeholder="AAA-0000"
            maxLength={8}
            className={inputCls}
            disabled={disabled}
          />
          {llpinErr && <p className="text-xs text-red-500 mt-0.5">{llpinErr}</p>}
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">DIN</label>
          <input
            value={kyc.din || ""}
            onChange={(e) => update("din", e.target.value.replace(/\D/g, ""))}
            placeholder="12345678"
            maxLength={8}
            className={inputCls}
            disabled={disabled}
          />
          {dinErr && <p className="text-xs text-red-500 mt-0.5">{dinErr}</p>}
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">CIN</label>
          <input
            value={kyc.cin || ""}
            onChange={(e) => update("cin", e.target.value.toUpperCase())}
            placeholder="U12345AB1234ABC123456"
            maxLength={21}
            className={inputCls}
            disabled={disabled}
          />
          {cinErr && <p className="text-xs text-red-500 mt-0.5">{cinErr}</p>}
        </div>
      </div>

      {/* GST */}
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">GST Number</label>
          <input
            value={kyc.gst_number || ""}
            onChange={(e) => update("gst_number", e.target.value.toUpperCase())}
            placeholder="22AAAAA0000A1Z5"
            maxLength={15}
            className={inputCls}
            disabled={disabled}
          />
          {gstErr && <p className="text-xs text-red-500 mt-0.5">{gstErr}</p>}
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">GST State Code</label>
          <input
            value={kyc.gst_state_code || ""}
            onChange={(e) => update("gst_state_code", e.target.value.replace(/\D/g, ""))}
            placeholder="22"
            maxLength={2}
            className={inputCls}
            disabled={disabled}
          />
          {gstStateErr && <p className="text-xs text-red-500 mt-0.5">{gstStateErr}</p>}
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-0.5">GST Destination Address</label>
        <input
          value={kyc.gst_dest_address || ""}
          onChange={(e) => update("gst_dest_address", e.target.value)}
          placeholder="Destination address for GST"
          className={inputCls}
          disabled={disabled}
        />
      </div>

      {/* Address */}
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-1">Address</p>
      <div className="space-y-2.5">
        <input
          value={kyc.address_line1 || ""}
          onChange={(e) => update("address_line1", e.target.value)}
          placeholder="Address Line 1"
          className={inputCls}
          disabled={disabled}
        />
        <input
          value={kyc.address_line2 || ""}
          onChange={(e) => update("address_line2", e.target.value)}
          placeholder="Address Line 2"
          className={inputCls}
          disabled={disabled}
        />
        <div className="grid grid-cols-2 gap-2.5">
          <input
            value={kyc.city || ""}
            onChange={(e) => update("city", e.target.value)}
            placeholder="City"
            className={inputCls}
            disabled={disabled}
          />
          <select
            value={kyc.state || ""}
            onChange={(e) => update("state", e.target.value)}
            className={inputCls}
            disabled={disabled}
          >
            <option value="">Select State</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <input
            value={kyc.country || "India"}
            onChange={(e) => update("country", e.target.value)}
            placeholder="Country"
            className={inputCls}
            disabled={disabled}
          />
          <div>
            <input
              value={kyc.pincode || ""}
              onChange={(e) => update("pincode", e.target.value.replace(/\D/g, ""))}
              placeholder="Pincode"
              maxLength={6}
              className={inputCls}
              disabled={disabled}
            />
            {pincodeErr && <p className="text-xs text-red-500 mt-0.5">{pincodeErr}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Check if any KYC validation errors exist */
export function hasKycErrors(kyc: ClientKyc): boolean {
  return !!(
    validatePAN(kyc.business_pan || "").error ||
    validateGSTIN(kyc.gst_number || "").error ||
    validateGSTStateCode(kyc.gst_state_code || "").error ||
    validateLLPIN(kyc.llpin || "").error ||
    validateDIN(kyc.din || "").error ||
    validateCIN(kyc.cin || "").error ||
    validatePincode(kyc.pincode || "").error
  );
}
