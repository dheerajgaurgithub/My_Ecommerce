export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(date: string | Date): string {
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'N/A';
  }
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(dateObj);
}

export function generateOrderNumber(): string {
  const prefix = 'BWT';
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${Date.now().toString().slice(-6)}${random}`;
}

export function getDeliveryDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDate(date);
}
