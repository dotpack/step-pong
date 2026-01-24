import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getBaseUrl() {
    return window.location.href.split('#')[0].replace(/\/$/, "");
}

export function getShareLink(shareId: string, messageId?: string) {
    const baseUrl = getBaseUrl();
    const msgPart = messageId ? `/${messageId}` : '';
    return `${baseUrl}/#/share/${shareId}${msgPart}`;
}
