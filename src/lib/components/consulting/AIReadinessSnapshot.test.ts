import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

// vi.mock is hoisted, so we must use vi.hoisted to share the fn reference.
const { postSnapshot } = vi.hoisted(() => ({ postSnapshot: vi.fn() }));
vi.mock('$lib/consulting/snapshot-client', () => ({ postSnapshot }));

import AIReadinessSnapshot from './AIReadinessSnapshot.svelte';

/**
 * Complete the wizard via the LLM branch, picking non-gate options by their
 * exact visible label text (robust: unaffected by Dialog close/Back buttons).
 *
 * Branch: llm (13 steps total: 1 intent + 12 branch questions)
 * Questions in order: uc1, uc2, uc3, uc4, rag1, tc1, tc2, tc3, df2, ti1, gr1, gr2
 */
async function completeWizard(user: ReturnType<typeof userEvent.setup>) {
	// Q0 — intent: pick LLM branch
	await user.click(
		await screen.findByRole('button', {
			name: 'Help my people work faster — drafting, summarising, answering questions, research'
		})
	);
	// uc1 — exactness: safe non-gate option
	await user.click(
		await screen.findByRole('button', { name: 'Mostly needs to be right, but a person reviews it' })
	);
	// uc2 — task specificity
	await user.click(
		await screen.findByRole('button', {
			name: 'A specific task people do over and over that eats hours every week'
		})
	);
	// uc3 — written definition
	await user.click(
		await screen.findByRole('button', { name: 'Yes — written down and agreed' })
	);
	// uc4 — business owner
	await user.click(
		await screen.findByRole('button', {
			name: 'Yes — a named owner and a number it would move'
		})
	);
	// rag1 — data source (no score, just weight router)
	await user.click(
		await screen.findByRole('button', { name: 'Just general knowledge + what we paste in' })
	);
	// tc1 — team usage
	await user.click(await screen.findByRole('button', { name: 'Most of them' }));
	// tc2 — verification literacy
	await user.click(await screen.findByRole('button', { name: 'Usually' }));
	// tc3 — leadership AI literacy
	await user.click(await screen.findByRole('button', { name: 'Yes, clearly' }));
	// df2 — data location
	await user.click(await screen.findByRole('button', { name: 'One central system' }));
	// ti1 — data movability
	await user.click(
		await screen.findByRole('button', {
			name: 'Our systems already pass data to each other automatically'
		})
	);
	// gr1 — cost of error (pick "Minor annoyance" to avoid real-damage cap)
	await user.click(await screen.findByRole('button', { name: 'Minor annoyance' }));
	// gr2 — data privacy
	await user.click(
		await screen.findByRole('button', { name: 'No sensitive or confidential data involved' })
	);
	// Result screen should now be visible (transparency line is the landmark)
	await screen.findByText(/Anonymous answers are kept/i);
}

describe('AIReadinessSnapshot logging', () => {
	beforeEach(() => postSnapshot.mockClear());

	it('fires the POST exactly once when the result renders', async () => {
		const user = userEvent.setup();
		render(AIReadinessSnapshot, { props: { open: true } });
		await completeWizard(user);
		expect(postSnapshot).toHaveBeenCalledTimes(1);
		expect(postSnapshot).toHaveBeenCalledWith('llm', expect.any(Object));
	});

	it('shows the transparency line on the result screen', async () => {
		const user = userEvent.setup();
		render(AIReadinessSnapshot, { props: { open: true } });
		await completeWizard(user);
		expect(
			screen.getByText(/Anonymous answers are kept to improve this tool — no names, no emails\./i)
		).toBeInTheDocument();
	});
});
