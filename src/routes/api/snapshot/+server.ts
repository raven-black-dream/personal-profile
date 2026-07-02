import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	validateSnapshotPayload,
	buildSnapshotRow,
	insertSnapshot,
	deriveDeviceClass,
	deriveSource
} from '$lib/server/snapshot-log';

/** Generous cap for a 12-question answer map; rejects abusive bodies. */
const MAX_BODY_BYTES = 4096;
const encoder = new TextEncoder();

const noContent = () => new Response(null, { status: 204 });

export const POST: RequestHandler = async ({ request, platform }) => {
	// Reject oversized bodies BEFORE buffering, when Content-Length is declared.
	const declaredLen = Number(request.headers.get('content-length'));
	if (Number.isFinite(declaredLen) && declaredLen > MAX_BODY_BYTES) {
		return json({ error: 'payload too large' }, { status: 413 });
	}

	const raw = await request.text();
	// Defense in depth: Content-Length may be absent or wrong — check actual bytes too.
	if (encoder.encode(raw).length > MAX_BODY_BYTES) {
		return json({ error: 'payload too large' }, { status: 413 });
	}

	let body: unknown;
	try {
		body = JSON.parse(raw);
	} catch {
		return json({ error: 'invalid json' }, { status: 400 });
	}

	const valid = validateSnapshotPayload(body);
	if (!valid.ok) {
		return json({ error: valid.message }, { status: 400 });
	}

	// Graceful no-op when D1 is not bound (local dev / preview).
	const db = platform?.env?.DB;
	if (!db) return noContent();

	const row = buildSnapshotRow(valid.branch, valid.answers, {
		deviceClass: deriveDeviceClass(request.headers.get('user-agent')),
		source: deriveSource(request.headers.get('referer')),
		now: Date.now()
	});

	try {
		await insertSnapshot(db, row);
	} catch {
		// Logging is best-effort; never surface a write failure to the client.
	}
	return noContent();
};
