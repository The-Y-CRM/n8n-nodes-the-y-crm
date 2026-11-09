import { createHmac, timingSafeEqual } from 'crypto';

/** Deliveries older or newer than this many seconds are rejected (same rule as the The-Y CRM docs). */
export const SIGNATURE_TOLERANCE_SECONDS = 300;

/**
 * Checks the `X-TheY-Signature` header of an outbound webhook from The-Y CRM.
 * Signature: `v1=<hex>` = HMAC-SHA256(secret, `<X-TheY-Timestamp>.<raw body>`).
 */
export function verifyTheYSignature(
	secret: string,
	signatureHeader: unknown,
	timestampHeader: unknown,
	rawBody: string,
	nowSeconds: number,
	toleranceSeconds = SIGNATURE_TOLERANCE_SECONDS,
): boolean {
	const timestamp = Number(timestampHeader);
	if (!Number.isInteger(timestamp) || Math.abs(nowSeconds - timestamp) > toleranceSeconds) {
		return false;
	}
	const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
	const received =
		String(signatureHeader ?? '')
			.split(',')
			.map((part) => part.trim())
			.find((part) => part.startsWith('v1='))
			?.slice(3) ?? '';
	if (received.length !== expected.length || !/^[0-9a-f]+$/.test(received)) {
		return false;
	}
	return timingSafeEqual(Buffer.from(received, 'hex'), Buffer.from(expected, 'hex'));
}
