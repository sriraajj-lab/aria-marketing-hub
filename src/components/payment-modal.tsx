"use client";

import { useState } from "react";
import {
  X,
  CheckCircle2,
  Loader2,
  CreditCard,
  Building2,
  User,
  Mail,
  Phone,
} from "lucide-react";

/* ─── Plan Definitions ─── */
const PLANS = [
  {
    id: "l1-scan",
    name: "Level 1: Scan & Score",
    price: 149,
    currency: "USD",
    description:
      "AI-powered denial pattern scan & diagnostic report per 100 claims",
  },
  {
    id: "l2-fix",
    name: "Level 2: Fix & Appeal",
    price: 349,
    currency: "USD",
    description:
      "Full AI analysis with fix instructions & appeal letters per 100 claims",
  },
  {
    id: "l3-autofix",
    name: "Level 3: EHR Auto-Fix",
    price: 699,
    currency: "USD",
    description:
      "Full autonomous recovery with EHR integration per 100 claims",
  },
  {
    id: "audit",
    name: "RCM Denial Audit",
    price: 2500,
    currency: "USD",
    description:
      "Complete denial pattern audit with root cause analysis & recommendations",
  },
  {
    id: "custom",
    name: "Custom / Enterprise",
    price: 0,
    currency: "USD",
    description:
      "Custom pricing for large organizations — we'll contact you",
  },
];

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId?: string;
}

export function PaymentModal({ isOpen, onClose, planId }: PaymentModalProps) {
  const [step, setStep] = useState<"form" | "processing" | "success" | "contact">("form");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    plan: planId || "l2-fix",
    message: "",
  });

  const selectedPlan = PLANS.find((p) => p.id === formData.plan);

  const handleSubmit = async () => {
    if (formData.plan === "custom" || formData.plan === "l3-autofix") {
      setStep("contact");
      return;
    }

    setStep("processing");

    try {
      // Create Razorpay order
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: selectedPlan?.price,
          currency: selectedPlan?.currency,
          plan: formData.plan,
          email: formData.email,
          name: formData.name,
        }),
      });

      const orderData = await res.json();

      if (!res.ok) {
        throw new Error(orderData.error || "Failed to create order");
      }

      // Open Razorpay checkout
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Denials Doctor",
        description: selectedPlan?.description,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // Verify payment
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            setStep("success");
          } else {
            alert(
              "Payment verification failed. Please contact hello@denialsdoctor.com"
            );
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        notes: {
          plan: formData.plan,
          company: formData.company,
        },
        theme: {
          color: "#2563eb",
        },
      };

      // @ts-ignore - Razorpay script loaded via CDN
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        alert("Payment failed: " + response.error.description);
        setStep("form");
      });
      rzp.open();
    } catch (error: any) {
      alert("Something went wrong: " + error.message);
      setStep("form");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors z-10"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        {step === "form" && (
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Get Started
                </h2>
                <p className="text-sm text-gray-500">
                  Secure payment via Razorpay
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Plan Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Select Plan
                </label>
                <select
                  value={formData.plan}
                  onChange={(e) =>
                    setFormData({ ...formData, plan: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {PLANS.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}{" "}
                      {plan.price > 0
                        ? `— $${plan.price.toLocaleString()}`
                        : "— Contact Us"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Your full name"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Work Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="you@company.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Company / Practice Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    placeholder="Your Healthcare Organization"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  How can we help?
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="Tell us about your denial volumes, payers, or any questions..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
              </div>
            </div>

            {/* Price Summary */}
            {selectedPlan && selectedPlan.price > 0 && (
              <div className="mt-5 p-4 bg-blue-50 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    {selectedPlan.name}
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    ${selectedPlan.price.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedPlan.description}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.email}
              className="mt-5 w-full py-3.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-blue-600/25 flex items-center justify-center gap-2"
            >
              {selectedPlan?.price
                ? `Pay $${selectedPlan.price.toLocaleString()} Now`
                : "Submit Inquiry"}
              <CreditCard className="w-4 h-4" />
            </button>

            <p className="text-xs text-gray-400 text-center mt-3">
              Secured by Razorpay. HIPAA compliant. 14-day money-back guarantee.
            </p>
          </div>
        )}

        {step === "processing" && (
          <div className="p-12 text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Processing Payment
            </h3>
            <p className="text-sm text-gray-500">
              Please wait while we set up your account...
            </p>
          </div>
        )}

        {step === "success" && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Welcome to Denials Doctor. We&apos;ll send your onboarding details
              to {formData.email} within 24 hours.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-700 transition-all"
            >
              Done
            </button>
          </div>
        )}

        {step === "contact" && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Let&apos;s Talk
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              For enterprise and custom plans, we&apos;d love to discuss your
              specific needs.
            </p>
            <a
              href="mailto:hello@denialsdoctor.com"
              className="inline-block px-6 py-2.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all mt-4"
            >
              Email hello@denialsdoctor.com
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
