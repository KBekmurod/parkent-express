import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date, formatStr = "PPP") {
  if (!date) return "";
  try {
    return format(new Date(date), formatStr);
  } catch {
    return "";
  }
}

export function formatDateTime(date) {
  return formatDate(date, "PPP p");
}

export function formatCurrency(amount, currency = "UZS") {
  if (typeof amount !== "number") return "0";
  
  if (currency === "UZS") {
    return new Intl.NumberFormat("uz-UZ", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(amount) + " сум";
  }
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

export function formatStatus(status) {
  const statusMap = {
    pending: "В ожидании",
    confirmed: "Подтверждён",
    preparing: "Готовится",
    ready: "Готов",
    picked_up: "Забран курьером",
    delivering: "Доставляется",
    delivered: "Доставлен",
    cancelled: "Отменён",
  };
  
  return statusMap[status] || status;
}

export function getStatusColor(status) {
  const colorMap = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    preparing: "bg-purple-100 text-purple-800",
    ready: "bg-cyan-100 text-cyan-800",
    picked_up: "bg-indigo-100 text-indigo-800",
    delivering: "bg-orange-100 text-orange-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  
  return colorMap[status] || "bg-gray-100 text-gray-800";
}

export function formatPhoneNumber(phone) {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 12) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  return phone;
}

export function truncate(str, length = 50) {
  if (!str) return "";
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
